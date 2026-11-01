// AI providers. BrainBoro works with any of these. Set one or more keys and it uses them in order,
// falling back to the next one when a provider is rate-limited or down (handy on free tiers).
//
//   ANTHROPIC_API_KEY    Claude (paid, best quality)        BRAINBORO_MODEL   default claude-opus-5-5
//   GEMINI_API_KEY       Google Gemini (free tier)          GEMINI_MODEL      default gemini-flash-lite-latest
//   GROQ_API_KEY         Groq (free tier, very fast)        GROQ_MODEL        default meta-llama/llama-4-scout-17b-16e-instruct
//   OPENROUTER_API_KEY   OpenRouter (has :free models)      OPENROUTER_MODEL  default meta-llama/llama-4-scout:free
//   AI_PROVIDERS         optional order, e.g. "gemini,groq,anthropic"
//
// Messages use one internal shape (Anthropic-style blocks): { role, content: [{type:"text",text} | {type:"image",source:{media_type,data}}] }.
import Anthropic from "@anthropic-ai/sdk";

export class ProviderError extends Error {
  constructor(message, status, provider) {
    super(message);
    this.status = status;
    this.provider = provider;
  }
}
export class Refusal extends Error {}

// Trims stray spaces/quotes/newlines that sneak in when a key is pasted on a phone.
const env = (k) => String(process.env[k] || "").trim().replace(/^["']+|["']+$/g, "").trim();

// ---------- Claude ----------
let claude;
const anthropic = {
  name: "anthropic",
  ready: () => Boolean(env("ANTHROPIC_API_KEY") || env("ANTHROPIC_AUTH_TOKEN")),
  model: () => env("BRAINBORO_MODEL") || "claude-opus-5-5",
  client: () => (claude ??= new Anthropic()),
  async stream({ system, messages, maxTokens }, onText) {
    const stream = this.client().beta.messages.stream({
      model: this.model(),
      max_tokens: maxTokens,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: system.map((text, i) => (i === 0 ? { type: "text", text, cache_control: { type: "ephemeral" } } : { type: "text", text })),
      messages,
    });
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") onText(event.delta.text);
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") throw new Refusal("refused");
  },
  async json({ system, content, schema, maxTokens }) {
    const response = await this.client().beta.messages.create({
      model: this.model(),
      max_tokens: maxTokens,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema } },
      system,
      messages: [{ role: "user", content }],
    });
    if (response.stop_reason === "refusal") throw new Refusal("refused");
    return response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  },
};

// Shared JSON instruction for providers whose schema support is looser.
const schemaNote = (schema) => `\n\nReply with ONLY a JSON object (no markdown, no code fences) that matches this JSON Schema exactly:\n${JSON.stringify(schema)}`;

// Reads a server-sent-events body and yields each `data:` payload.
async function* sse(res) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (line.startsWith("data:")) yield line.slice(5).trim();
    }
  }
}

async function check(res, provider) {
  if (res.ok) return res;
  let detail = "";
  try {
    detail = (await res.text()).slice(0, 300);
  } catch {
    /* ignore */
  }
  // Gemini reports a bad key or unsupported country as 400; treat them as auth errors so the next provider is tried.
  const status = res.status === 400 && /API_KEY_INVALID|API key not valid|location is not supported/i.test(detail) ? 401 : res.status;
  throw new ProviderError(`${provider} ${res.status}: ${detail}`, status, provider);
}

// ---------- Google Gemini ----------
function geminiParts(content) {
  return content.map((b) => (b.type === "image" ? { inlineData: { mimeType: b.source.media_type, data: b.source.data } } : { text: b.text }));
}
// Gemini's older `responseSchema` (OpenAPI subset) doesn't accept additionalProperties.
const stripExtras = (s) => (Array.isArray(s) ? s.map(stripExtras) : s && typeof s === "object" ? Object.fromEntries(Object.entries(s).filter(([k]) => k !== "additionalProperties").map(([k, v]) => [k, stripExtras(v)])) : s);

const gemini = {
  name: "gemini",
  ready: () => Boolean(env("GEMINI_API_KEY") || env("GOOGLE_API_KEY")),
  model: () => env("GEMINI_MODEL") || "gemini-flash-lite-latest",
  url(method) {
    return `${env("GEMINI_API_BASE") || "https://generativelanguage.googleapis.com/v1beta"}/models/${encodeURIComponent(this.model())}:${method}`;
  },
  headers: () => ({ "Content-Type": "application/json", "x-goog-api-key": env("GEMINI_API_KEY") || env("GOOGLE_API_KEY") }),
  body({ system, messages, maxTokens }) {
    return {
      systemInstruction: { parts: [{ text: system.join("\n\n") }] },
      contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: geminiParts(m.content) })),
      generationConfig: { maxOutputTokens: maxTokens },
    };
  },
  async stream(req, onText) {
    const res = await check(await fetch(`${this.url("streamGenerateContent")}?alt=sse`, { method: "POST", headers: this.headers(), body: JSON.stringify(this.body(req)), signal: AbortSignal.timeout(90000) }), "gemini");
    let any = false;
    for await (const data of sse(res)) {
      const chunk = JSON.parse(data);
      const cand = chunk.candidates?.[0];
      const text = (cand?.content?.parts || []).map((p) => p.text || "").join("");
      if (text) {
        any = true;
        onText(text);
      }
      if (!any && (cand?.finishReason === "SAFETY" || chunk.promptFeedback?.blockReason)) throw new Refusal("blocked");
    }
  },
  async json({ system, content, schema, maxTokens }) {
    const base = { systemInstruction: { parts: [{ text: system + schemaNote(schema) }] }, contents: [{ role: "user", parts: geminiParts(content) }] };
    const send = (generationConfig) => fetch(this.url("generateContent"), { method: "POST", headers: this.headers(), body: JSON.stringify({ ...base, generationConfig }), signal: AbortSignal.timeout(90000) });
    let res = await send({ maxOutputTokens: maxTokens, responseMimeType: "application/json", responseJsonSchema: schema });
    // Older models only know `responseSchema`.
    const schemaRejected = async (r) => r.status === 400 && !/API_KEY_INVALID|API key not valid|location is not supported/i.test(await r.clone().text());
    if (await schemaRejected(res)) res = await send({ maxOutputTokens: maxTokens, responseMimeType: "application/json", responseSchema: stripExtras(schema) });
    if (await schemaRejected(res)) res = await send({ maxOutputTokens: maxTokens, responseMimeType: "application/json" });
    const data = await (await check(res, "gemini")).json();
    const cand = data.candidates?.[0];
    if (!cand || cand.finishReason === "SAFETY" || data.promptFeedback?.blockReason) throw new Refusal("blocked");
    return (cand.content?.parts || []).map((p) => p.text || "").join("");
  },
};

// ---------- OpenAI-compatible (Groq, OpenRouter) ----------
function openaiMessages(system, messages) {
  return [
    { role: "system", content: system.join("\n\n") },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content.some((b) => b.type === "image")
        ? m.content.map((b) => (b.type === "image" ? { type: "image_url", image_url: { url: `data:${b.source.media_type};base64,${b.source.data}` } } : { type: "text", text: b.text }))
        : m.content.map((b) => b.text).join("\n"),
    })),
  ];
}

function openaiCompatible(name, { key, model, base, defaultModel, extraHeaders = {} }) {
  return {
    name,
    ready: () => Boolean(env(key)),
    model: () => env(model) || defaultModel,
    headers: () => ({ "Content-Type": "application/json", Authorization: `Bearer ${env(key)}`, ...extraHeaders }),
    async stream({ system, messages, maxTokens }, onText) {
      const res = await check(await fetch(`${base}/chat/completions`, { method: "POST", headers: this.headers(), body: JSON.stringify({ model: this.model(), messages: openaiMessages(system, messages), max_tokens: maxTokens, stream: true }), signal: AbortSignal.timeout(90000) }), name);
      for await (const data of sse(res)) {
        if (data === "[DONE]") break;
        const text = JSON.parse(data).choices?.[0]?.delta?.content;
        if (text) onText(text);
      }
    },
    async json({ system, content, schema, maxTokens }) {
      const res = await check(await fetch(`${base}/chat/completions`, { method: "POST", headers: this.headers(), body: JSON.stringify({ model: this.model(), messages: openaiMessages([system + schemaNote(schema)], [{ role: "user", content }]), max_tokens: maxTokens, response_format: { type: "json_object" } }), signal: AbortSignal.timeout(90000) }), name);
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    },
  };
}

const groq = openaiCompatible("groq", { key: "GROQ_API_KEY", model: "GROQ_MODEL", base: env("GROQ_API_BASE") || "https://api.groq.com/openai/v1", defaultModel: "meta-llama/llama-4-scout-17b-16e-instruct" });
const openrouter = openaiCompatible("openrouter", { key: "OPENROUTER_API_KEY", model: "OPENROUTER_MODEL", base: "https://openrouter.ai/api/v1", defaultModel: "meta-llama/llama-4-scout:free", extraHeaders: { "X-Title": "BrainBoro" } });

const ALL = { anthropic, gemini, groq, openrouter };

/** Providers with keys, in the preferred order. */
export function providers() {
  const order = (env("AI_PROVIDERS") || "anthropic,gemini,groq,openrouter").split(",").map((s) => s.trim()).filter((n) => ALL[n]);
  return order.map((n) => ALL[n]).filter((p) => p.ready());
}
export const aiConfigured = () => providers().length > 0;
export const providerNames = () => providers().map((p) => p.name);

const KNOWN_VARS = new Set(["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "GEMINI_API_KEY", "GOOGLE_API_KEY", "GROQ_API_KEY", "OPENROUTER_API_KEY"]);

/** Plain-English fix for a failed provider test. */
function hint(name, err) {
  const status = err.status ?? err.statusCode;
  const key = { anthropic: "ANTHROPIC_API_KEY", gemini: "GEMINI_API_KEY", groq: "GROQ_API_KEY", openrouter: "OPENROUTER_API_KEY" }[name];
  const model = { anthropic: "BRAINBORO_MODEL", gemini: "GEMINI_MODEL", groq: "GROQ_MODEL", openrouter: "OPENROUTER_MODEL" }[name];
  const text = String(err.message || "");
  if (/location is not supported|region|country/i.test(text)) return "This AI isn't available in the server's region. Add a free GROQ_API_KEY as well.";
  if (/api key not valid|API_KEY_INVALID|invalid api key|invalid_api_key/i.test(text)) return `The key in ${key} isn't valid. Make a new key, paste it as the value (nothing else), Save, then Redeploy.`;
  if (status === 401 || status === 403) return `The key in ${key} was rejected. Make a new key, paste only the key as the value, Save, then Redeploy.`;
  if (status === 404) return `The model "${ALL[name].model()}" wasn't found. Add ${model} with a current model name, then Redeploy.`;
  if (status === 429) return "This key is out of free uses right now (or the project hit its limit). Wait, or add a free GROQ_API_KEY as backup.";
  if (status >= 500) return "The AI company's servers are having trouble. Try again in a few minutes.";
  if (err instanceof SyntaxError) return "It answered, but not in the right format. It usually works on a retry.";
  if (err.name === "TimeoutError" || err.name === "AbortError") return "It took too long to answer. Try again.";
  return "Unexpected error. Read the details below.";
}

/** Sends a tiny request to every configured provider and reports what happened, for the AI check page. */
export async function testProviders() {
  const schema = { type: "object", properties: { answer: { type: "string" } }, required: ["answer"], additionalProperties: false };
  const results = await Promise.all(providers().map(async (p) => {
    const started = Date.now();
    try {
      const text = await p.json({ system: "You check that an API works.", content: [{ type: "text", text: 'What is 2 + 2? Put just the number in "answer".' }], schema, maxTokens: 50 });
      const parsed = JSON.parse(String(text).replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, ""));
      return { name: p.name, model: p.model(), ok: true, ms: Date.now() - started, reply: String(parsed.answer).slice(0, 40) };
    } catch (err) {
      return { name: p.name, model: p.model(), ok: false, status: err.status ?? err.statusCode ?? null, hint: hint(p.name, err), detail: String(err.message || err).slice(0, 300) };
    }
  }));
  // Variables that look like AI keys but have a name BrainBoro doesn't read (a common typo).
  const lookalikes = Object.keys(process.env).filter((k) => /GEMINI|GROQ|OPENROUTER|ANTHROPIC|AI_STUDIO/i.test(k) && /KEY|TOKEN|SECRET/i.test(k) && !KNOWN_VARS.has(k));
  return { results, lookalikes };
}

// Worth trying the next provider: rate limits, outages, timeouts, bad keys.
function retryable(err) {
  if (err instanceof Refusal) return false;
  const status = err.status ?? err.statusCode;
  return !status || status === 401 || status === 403 || status === 404 || status === 408 || status === 429 || status >= 500;
}

/** Streams a chat reply from the first provider that works. Only falls back before any text was sent. */
export async function streamChat(req, onText) {
  const list = providers();
  let last;
  for (const p of list) {
    let sent = false;
    try {
      await p.stream(req, (t) => {
        sent = true;
        onText(t);
      });
      return p.name;
    } catch (err) {
      last = err;
      if (sent || !retryable(err)) throw err;
      console.warn(`[ai] ${p.name} failed, trying next:`, err.message);
    }
  }
  throw last || new ProviderError("No AI provider is configured.", 503, "none");
}

/** Gets schema-shaped JSON from the first provider that works; retries once on unparseable output. */
export async function structuredJSON(req) {
  const list = providers();
  let last;
  for (const p of list) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const text = await p.json(req);
        const parsed = JSON.parse(String(text).replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, ""));
        for (const key of req.schema.required || []) if (!(key in parsed)) throw new SyntaxError(`missing ${key}`);
        return parsed;
      } catch (err) {
        last = err;
        if (err instanceof SyntaxError && attempt === 0) continue; // ask the same provider again
        if (err instanceof SyntaxError || retryable(err)) break; // move on to the next provider
        throw err;
      }
    }
    console.warn(`[ai] ${p.name} failed, trying next:`, last?.message);
  }
  throw last || new ProviderError("No AI provider is configured.", 503, "none");
}
