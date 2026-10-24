// Checks the free-AI providers (Gemini, Groq) against local fake servers: streaming chat, images,
// structured JSON, schema fallbacks, and switching providers when one is rate-limited.
import assert from "node:assert/strict";
import { createServer } from "node:http";

const fixtures = {
  problems: { note: "", problems: [{ question: "2x + 5 = 17", answer: "x = 6", subject: "Math", concept: "Two-step equations", steps: [{ show: "2x = 12", say: "Subtract 5." }, { show: "x = [[6]]", say: "Divide by 2." }] }] },
  questions: { questions: [{ question: "2+2?", choices: ["3", "4", "5", "6"], answer_index: 1, explanation: "Add." }] },
  thesis_options: { understand: "Pick a side.", thesis_options: ["A", "B", "C"], outline: [{ part: "Intro", goal: "Hook", bullets: ["x"], starter: "Imagine" }], evidence_tips: ["t"], counterclaim: "c", words_to_use: ["however"], checklist: ["cite"] },
};
const pick = (schema) => fixtures[Object.keys(schema?.properties || {}).find((k) => fixtures[k])] || {};
const read = async (req) => {
  let b = "";
  for await (const c of req) b += c;
  return JSON.parse(b || "{}");
};

const log = [];
const state = { geminiRateLimited: false, geminiOldSchema: false };

const gem = createServer(async (req, res) => {
  const body = await read(req);
  log.push({ who: "gemini", url: req.url, key: req.headers["x-goog-api-key"], body });
  if (state.geminiRateLimited) return res.writeHead(429).end('{"error":{"message":"quota"}}');
  if (req.url.includes(":streamGenerateContent")) {
    assert.ok(req.url.includes("alt=sse"));
    res.writeHead(200, { "content-type": "text/event-stream" });
    for (const t of ["Hello ", "from ", "Gemini"]) res.write(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: t }] } }] })}\n\n`);
    return res.end();
  }
  const cfg = body.generationConfig || {};
  if (state.geminiOldSchema && cfg.responseJsonSchema) return res.writeHead(400).end('{"error":{"message":"Unknown name responseJsonSchema"}}');
  const schema = cfg.responseJsonSchema || cfg.responseSchema || {};
  if (cfg.responseSchema) assert.ok(!JSON.stringify(cfg.responseSchema).includes("additionalProperties"), "responseSchema must not include additionalProperties");
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(pick(schema.properties ? schema : { properties: Object.fromEntries(Object.keys(fixtures).map((k) => [k, 1])) })) }] }, finishReason: "STOP" }] }));
});

const groqSrv = createServer(async (req, res) => {
  const body = await read(req);
  log.push({ who: "groq", url: req.url, auth: req.headers.authorization, body });
  if (body.stream) {
    res.writeHead(200, { "content-type": "text/event-stream" });
    for (const t of ["Hi ", "from ", "Groq"]) res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`);
    res.write("data: [DONE]\n\n");
    return res.end();
  }
  // The schema arrives in the system prompt; answer with the matching fixture, wrapped in a code fence to test cleanup.
  const sys = body.messages[0].content;
  const key = Object.keys(fixtures).find((k) => sys.includes(`"${k}"`));
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ choices: [{ message: { content: "```json\n" + JSON.stringify(fixtures[key]) + "\n```" } }] }));
});

await new Promise((r) => gem.listen(0, r));
await new Promise((r) => groqSrv.listen(0, r));
delete process.env.ANTHROPIC_API_KEY;
delete process.env.ANTHROPIC_AUTH_TOKEN;
process.env.GEMINI_API_KEY = "gem-key";
process.env.GEMINI_API_BASE = `http://localhost:${gem.address().port}`;
process.env.GROQ_API_KEY = "groq-key";
process.env.GROQ_API_BASE = `http://localhost:${groqSrv.address().port}`;

const tutor = await import("../lib/tutor.js");
const { providerNames } = await import("../lib/providers.js");
assert.deepEqual(providerNames(), ["gemini", "groq"]);
assert.equal(tutor.aiConfigured(), true);

// 1. Streaming chat on Gemini, with a photo.
let text = "";
const r1 = await tutor.streamTutor({ mode: "explain", messages: [{ role: "user", text: "help", image: { mediaType: "image/jpeg", data: "QUJD" } }] }, (t) => (text += t));
assert.equal(text, "Hello from Gemini");
assert.equal(r1.provider, "gemini");
const g1 = log.at(-1);
assert.equal(g1.key, "gem-key");
assert.equal(g1.body.contents[0].parts[0].inlineData.mimeType, "image/jpeg");
assert.ok(g1.body.systemInstruction.parts[0].text.includes("Boro"));

// 2. Snap & Answer (image + structured JSON) on Gemini.
const ans = await tutor.generateAnswer({ image: { mediaType: "image/png", data: "QUJD" } });
assert.equal(ans.problems[0].answer, "x = 6");
assert.equal(ans.problems[0].steps.length, 2);

// 3. Older Gemini model: falls back from responseJsonSchema to responseSchema.
state.geminiOldSchema = true;
const qz = await tutor.generateQuiz({ topic: "Addition" });
assert.equal(qz[0].answer_index, 1);
state.geminiOldSchema = false;

// 4. Gemini out of free quota → Groq takes over (chat and JSON).
state.geminiRateLimited = true;
text = "";
const r2 = await tutor.streamTutor({ messages: [{ role: "user", text: "hi" }] }, (t) => (text += t));
assert.equal(text, "Hi from Groq");
assert.equal(r2.provider, "groq");
const plan = await tutor.generateEssay({ mode: "plan", prompt: "Phones in school?" });
assert.equal(plan.thesis_options.length, 3);
const gq = log.filter((l) => l.who === "groq").at(-1);
assert.equal(gq.auth, "Bearer groq-key");
assert.equal(gq.body.response_format.type, "json_object");
const img = await tutor.generateAnswer({ image: { mediaType: "image/png", data: "QUJD" } });
assert.equal(img.problems[0].concept, "Two-step equations");
const gImg = log.filter((l) => l.who === "groq").at(-1);
assert.ok(gImg.body.messages[1].content.some((c) => c.type === "image_url" && c.image_url.url.startsWith("data:image/png;base64,")));

// 5. Everything rate-limited → a friendly error.
process.env.AI_PROVIDERS = "gemini";
await assert.rejects(tutor.streamTutor({ messages: [{ role: "user", text: "hi" }] }, () => {}), (err) => tutor.describeError(err).status === 429);

gem.close();
groqSrv.close();
console.log("ai provider checks OK");
