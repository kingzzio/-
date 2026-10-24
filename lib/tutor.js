// Shared AI logic for BrainBoro. Used by both the local dev server (server.js)
// and the Vercel serverless function (api/tutor.js).
import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.BRAINBORO_MODEL || "claude-opus-5-5";
const MAX_MESSAGES = 24;
const MAX_TEXT_CHARS = 6000;
const MAX_IMAGE_BYTES = 4_500_000; // base64 length cap (~3.3 MB image)
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

const TUTOR_SYSTEM = `You are "Boro", the AI study coach inside BrainBoro, a free study app for middle and high school students (grades 6–12), with a focus on New York City. Students use you to prepare for the SHSAT, TACHS, NYS Regents exams (Algebra I, Geometry, Algebra II, ELA, Life Science: Biology / Living Environment, Earth and Space Sciences, Chemistry, Physics, Global History, U.S. History), the SAT/PSAT, and everyday class work from curricula like Illustrative Mathematics, Eureka Math, Amplify, and others.

How to tutor:
- Be warm, upbeat, and concise. Talk like a supportive older student, not a textbook. Short paragraphs; use lists and numbered steps for procedures.
- Teach, don't just answer. In "hint" mode, never give the final answer: ask one guiding question or give the next small step. In "explain" mode, walk through the full solution step by step and say *why* each step works. In "quiz" mode, ask the student one question at a time, wait for their answer, then give feedback.
- When a student is wrong, name what they did right first, then pinpoint the exact mistake.
- Write math in plain text with Unicode where it helps (x², √, ≤, π, ½). Put each algebra step on its own line.
- Tie advice to the student's test when relevant (e.g. "On the SHSAT you can't use a calculator, so…", "Regents Algebra I lets you use a graphing calculator…").
- If a photo of homework is shared, read it carefully, restate the problem you see, and then help according to the mode.
- If asked to write a whole essay or do graded work for them, help them plan, outline, and revise their own writing instead.
- Stay on school, studying, test strategy, study habits, and school-admissions process questions. Politely steer other topics back to studying. Never ask for personal information. If a student seems upset or mentions being unsafe, be kind and encourage them to talk to a trusted adult or school counselor; in the U.S. they can call or text 988 any time.
- If you're not sure about a specific fact (an exam date, a school policy), say so and suggest checking the official source (NYC Public Schools / MySchools, NYSED, the College Board, or tachsinfo.com).`;

const QUIZ_SYSTEM = `You write accurate, exam-style multiple-choice practice questions for middle and high school students in New York. Match the style and difficulty of the named exam or course. Every question must have exactly 4 answer choices with exactly one correct answer, plausible distractors based on common mistakes, and a short explanation a 13–17 year old can follow. Write math in plain text with Unicode (x², √, π). Double-check every answer before including it.`;

const QUIZ_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          choices: { type: "array", items: { type: "string" } },
          answer_index: { type: "integer" },
          explanation: { type: "string" },
        },
        required: ["question", "choices", "answer_index", "explanation"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
};

let client;
function getClient() {
  client ??= new Anthropic();
  return client;
}

export function aiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export class BadRequest extends Error {}

// --- tiny in-memory rate limiter (per server instance) ---
const hits = new Map();
export function rateLimited(key, limit = Number(process.env.BRAINBORO_RATE_LIMIT || 40)) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length > limit;
}

function cleanText(value, max = MAX_TEXT_CHARS) {
  if (typeof value !== "string") return "";
  return value.slice(0, max);
}

// Converts the client's chat history into Messages API params, validating as we go.
function toMessages(history) {
  if (!Array.isArray(history) || history.length === 0) throw new BadRequest("No messages sent.");
  const messages = history.slice(-MAX_MESSAGES).map((m) => {
    const role = m.role === "assistant" ? "assistant" : "user";
    const content = [];
    if (role === "user" && m.image) {
      const { mediaType, data } = m.image;
      if (!IMAGE_TYPES.has(mediaType) || typeof data !== "string" || data.length > MAX_IMAGE_BYTES) {
        throw new BadRequest("Image must be a PNG, JPEG, WEBP or GIF under ~3 MB.");
      }
      content.push({ type: "image", source: { type: "base64", media_type: mediaType, data } });
    }
    const text = cleanText(m.text);
    if (text) content.push({ type: "text", text });
    if (content.length === 0) content.push({ type: "text", text: "(empty)" });
    return { role, content };
  });
  // The conversation must start with a user turn.
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    throw new BadRequest("The last message must be from the student.");
  }
  return messages;
}

function contextNote({ mode, topic, exam, grade, assignment }) {
  const parts = [`Mode: ${["hint", "explain", "quiz"].includes(mode) ? mode : "explain"}.`];
  if (exam) parts.push(`Studying for: ${cleanText(exam, 80)}.`);
  if (grade) parts.push(`Grade: ${cleanText(String(grade), 10)}.`);
  if (topic) parts.push(`Current topic: ${cleanText(topic, 120)}.`);
  if (assignment) parts.push(`The student is working on a homework assignment: "${cleanText(assignment, 300)}". Coach them through it so they can do it themselves: explain the method with a similar example, check their work, and give hints. Don't write out final answers for them to copy.`);
  return parts.join(" ");
}

/**
 * Streams a tutor reply. Calls onText(chunk) for each piece of text.
 * Resolves to { stopReason }.
 */
export async function streamTutor(body, onText) {
  const messages = toMessages(body.messages);
  const stream = getClient().beta.messages.stream({
    model: MODEL,
    max_tokens: 8000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    system: [
      { type: "text", text: TUTOR_SYSTEM, cache_control: { type: "ephemeral" } },
      { type: "text", text: contextNote(body) },
    ],
    messages,
  });
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      onText(event.delta.text);
    }
  }
  const final = await stream.finalMessage();
  if (final.stop_reason === "refusal") {
    onText("\n\nI can't help with that one — let's get back to studying! Try asking about a topic or a practice problem.");
  }
  return { stopReason: final.stop_reason };
}

/** Generates fresh multiple-choice questions for a topic. */
export async function generateQuiz(body) {
  const topic = cleanText(body.topic, 160);
  if (!topic) throw new BadRequest("Pick a topic first.");
  const count = Math.min(Math.max(Number(body.count) || 5, 1), 10);
  const context = [body.exam && `Exam/course: ${cleanText(body.exam, 80)}`, body.grade && `Grade: ${cleanText(String(body.grade), 10)}`, body.difficulty && `Difficulty: ${cleanText(body.difficulty, 20)}`]
    .filter(Boolean)
    .join("\n");

  const response = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: 12000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: QUIZ_SCHEMA },
    },
    system: QUIZ_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Write ${count} new multiple-choice practice questions on: ${topic}\n${context}`,
      },
    ],
  });
  if (response.stop_reason === "refusal") throw new BadRequest("Couldn't make questions for that topic.");
  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const parsed = JSON.parse(text);
  return parsed.questions
    .filter((q) => Array.isArray(q.choices) && q.choices.length >= 2 && q.answer_index >= 0 && q.answer_index < q.choices.length)
    .slice(0, count);
}

const CHEAT_SYSTEM = `You make "Cheat Code" walkthroughs for BrainBoro: short, animated, whiteboard-style explanations of the FASTEST legitimate way to solve a test question (a shortcut, pattern, estimation trick, plugging in answer choices, eliminating wrong answers, or a memory hook). Think of a 30-second TikTok explainer for a 13–17 year old.

Rules:
- 4 to 8 steps. Each step has "show" (what appears on the board: short, big, mostly math or a few key words) and "say" (the caption/voiceover: one casual sentence, under 18 words).
- In "show", write a fraction as {numerator|denominator} and wrap the key thing to circle or highlight in [[double brackets]]. Use Unicode math (×, ÷, ², √, π, ≤). No LaTeX, no markdown.
- Name the trick in "trick" (2–5 words, e.g. "Percent of a percent").
- The final step must land on the correct answer. Double-check the math.
- Set answer_index to the index of the correct choice.`;

const CHEAT_SCHEMA = {
  type: "object",
  properties: {
    trick: { type: "string" },
    answer_index: { type: "integer" },
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: { show: { type: "string" }, say: { type: "string" } },
        required: ["show", "say"],
        additionalProperties: false,
      },
    },
  },
  required: ["trick", "answer_index", "steps"],
  additionalProperties: false,
};

async function structured(system, user, schema, maxTokens = 8000) {
  const response = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: { type: "json_schema", schema } },
    system,
    messages: [{ role: "user", content: user }],
  });
  if (response.stop_reason === "refusal") throw new BadRequest("Couldn't help with that one.");
  return JSON.parse(response.content.filter((b) => b.type === "text").map((b) => b.text).join(""));
}

/** Builds an animated shortcut walkthrough for one multiple-choice question (premium). */
export async function generateCheatCode(body) {
  const question = cleanText(body.question, 1500);
  const choices = Array.isArray(body.choices) ? body.choices.slice(0, 6).map((c) => cleanText(String(c), 300)) : [];
  if (!question || choices.length < 2) throw new BadRequest("Send a question with its answer choices.");
  const known = Number.isInteger(body.answer_index) && body.answer_index >= 0 && body.answer_index < choices.length ? `\nThe correct answer is ${"ABCDEF"[body.answer_index]}) ${choices[body.answer_index]}.` : "";
  const out = await structured(
    CHEAT_SYSTEM,
    `Question: ${question}\nChoices:\n${choices.map((c, i) => `${"ABCDEF"[i]}) ${c}`).join("\n")}${known}${body.exam ? `\nExam: ${cleanText(body.exam, 60)}` : ""}`,
    CHEAT_SCHEMA,
  );
  return { ...out, steps: out.steps.slice(0, 10) };
}

const STEPS_SCHEMA = {
  type: "object",
  properties: { steps: { type: "array", items: { type: "string" } } },
  required: ["steps"],
  additionalProperties: false,
};

/** Splits a homework assignment into small, doable steps for the planner. */
export async function generateSteps(body) {
  const title = cleanText(body.title, 200);
  if (!title) throw new BadRequest("Give the assignment a name first.");
  const out = await structured(
    "You help middle and high school students plan homework. Break the assignment into 3–7 small, concrete steps the STUDENT will do themselves, in order, each under 10 words (e.g. 'Problems 1–4', 'Outline 3 body paragraphs', 'Check answers with the key'). Never do the work for them.",
    `Assignment: ${title}${body.course ? `\nClass: ${cleanText(body.course, 80)}` : ""}${body.notes ? `\nDetails: ${cleanText(body.notes, 800)}` : ""}`,
    STEPS_SCHEMA,
    2000,
  );
  return out.steps.slice(0, 8).map((s) => cleanText(s, 80));
}

/** Maps SDK errors to a status code and a student-friendly message. */
export function describeError(err) {
  if (err instanceof BadRequest) return { status: 400, message: err.message };
  if (err instanceof Anthropic.RateLimitError) return { status: 429, message: "Boro is super busy right now — try again in a minute." };
  if (err instanceof Anthropic.AuthenticationError) return { status: 500, message: "The AI tutor isn't set up yet (missing or invalid API key)." };
  if (err instanceof Anthropic.APIStatusError) return { status: 502, message: "The AI tutor hit a snag. Please try again." };
  if (err instanceof Anthropic.APIConnectionError) return { status: 503, message: "Couldn't reach the AI tutor. Check your connection." };
  if (err instanceof SyntaxError) return { status: 502, message: "The AI returned something unexpected. Try again." };
  return { status: 500, message: "Something went wrong." };
}
