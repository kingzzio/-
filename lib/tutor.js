// Shared AI logic for BrainBoro. Used by both the local dev server (server.js)
// and the Vercel serverless function (api/tutor.js).
import Anthropic from "@anthropic-ai/sdk";
import { aiConfigured, ProviderError, Refusal, streamChat, structuredJSON } from "./providers.js";

export { aiConfigured };
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

export class BadRequest extends Error {}

// --- tiny in-memory rate limiter (per server instance) ---
const hits = new Map();
export function rateLimited(key, limit = Number(process.env.BRAINBORO_RATE_LIMIT || 40), windowMs = 60 * 60 * 1000) {
  const now = Date.now();
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
  try {
    const provider = await streamChat({ system: [TUTOR_SYSTEM, contextNote(body)], messages, maxTokens: 8000 }, onText);
    return { provider };
  } catch (err) {
    if (!(err instanceof Refusal)) throw err;
    onText("\n\nI can't help with that one. Let's get back to studying! Try asking about a topic or a practice problem.");
    return { provider: "refused" };
  }
}

/** Generates fresh multiple-choice questions for a topic. */
export async function generateQuiz(body) {
  const topic = cleanText(body.topic, 160);
  if (!topic) throw new BadRequest("Pick a topic first.");
  const count = Math.min(Math.max(Number(body.count) || 5, 1), 10);
  const context = [body.exam && `Exam/course: ${cleanText(body.exam, 80)}`, body.grade && `Grade: ${cleanText(String(body.grade), 10)}`, body.difficulty && `Difficulty: ${cleanText(body.difficulty, 20)}`]
    .filter(Boolean)
    .join("\n");

  const parsed = await structured(QUIZ_SYSTEM, `Write ${count} new multiple-choice practice questions on: ${topic}\n${context}`, QUIZ_SCHEMA, 12000);
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

// Schema-shaped JSON from whichever AI provider is configured (see providers.js).
async function structured(system, user, schema, maxTokens = 8000) {
  const content = typeof user === "string" ? [{ type: "text", text: user }] : user;
  try {
    return await structuredJSON({ system, content, schema, maxTokens });
  } catch (err) {
    if (err instanceof Refusal) throw new BadRequest("Couldn't help with that one.");
    throw err;
  }
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
  return { trick: String(out.trick || "Cheat Code"), answer_index: Number.isInteger(out.answer_index) ? out.answer_index : body.answer_index ?? 0, steps: cleanSteps(out.steps, 10) };
}

const STEPS_SCHEMA = {
  type: "object",
  properties: { steps: { type: "array", items: { type: "string" } } },
  required: ["steps"],
  additionalProperties: false,
};

// Normalizes whiteboard steps from any AI provider into [{show, say}].
function cleanSteps(steps, max) {
  return (Array.isArray(steps) ? steps : [])
    .map((s) => (typeof s === "string" ? { show: s, say: "" } : { show: String(s?.show ?? ""), say: String(s?.say ?? "") }))
    .filter((s) => s.show)
    .slice(0, max);
}

// Optional homework photo → image content block.
function imageBlock(image) {
  if (!image) return [];
  const { mediaType, data } = image;
  if (!IMAGE_TYPES.has(mediaType) || typeof data !== "string" || data.length > MAX_IMAGE_BYTES) throw new BadRequest("Photo must be a PNG, JPEG, WEBP or GIF under ~3 MB.");
  return [{ type: "image", source: { type: "base64", media_type: mediaType, data } }];
}

/** Splits a homework assignment (or a photo of the worksheet) into small, doable steps for the planner. */
export async function generateSteps(body) {
  const title = cleanText(body.title, 200);
  if (!title && !body.image) throw new BadRequest("Give the assignment a name first.");
  const out = await structured(
    "You help middle and high school students plan homework. Break the assignment into 3–8 small, concrete steps the student will do, in order, each under 10 words (e.g. 'Problems 1–4', 'Outline 3 body paragraphs', 'Check answers with the key'). If a worksheet photo is included, base the steps on the actual problems you see.",
    [...imageBlock(body.image), { type: "text", text: `Assignment: ${title || "(see photo)"}${body.course ? `\nClass: ${cleanText(body.course, 80)}` : ""}${body.notes ? `\nDetails: ${cleanText(body.notes, 800)}` : ""}` }],
    STEPS_SCHEMA,
    2000,
  );
  return (Array.isArray(out.steps) ? out.steps : []).slice(0, 10).map((s) => cleanText(String(s), 80)).filter(Boolean);
}

const SOLVE_SYSTEM = `You are BrainBoro's "Solve" feature: a whiteboard walkthrough that teaches a middle/high school student how to solve ONE homework problem, step by step, the way a great tutor would at the board.

Rules:
- If there are several problems (e.g. a worksheet photo), solve only the one the student names, or the first one, and say which in "title".
- 3 to 9 steps. Each step has "show" (what's written on the board: short, mostly math or a few key words) and "say" (one casual sentence explaining WHY, under 22 words).
- In "show", write fractions as {numerator|denominator} and wrap the key result in [[double brackets]]. Use Unicode math (×, ÷, ², √, π, ≤). No LaTeX, no markdown.
- "answer" is the final answer in a few words. Double-check it.
- "try_next" is one similar practice problem (different numbers) so the student can do one on their own.
- For writing assignments (essays, paragraphs, responses), don't write the piece. Instead make the steps a plan: a thesis formula, what evidence to look for, and an outline. Set "answer" to "Your turn to write it!".`;

const SOLVE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    answer: { type: "string" },
    try_next: { type: "string" },
    steps: CHEAT_SCHEMA.properties.steps,
  },
  required: ["title", "answer", "try_next", "steps"],
  additionalProperties: false,
};

/** Step-by-step whiteboard walkthrough for a homework problem (text and/or photo). */
export async function generateSolve(body) {
  const problem = cleanText(body.problem, 2000);
  if (!problem && !body.image) throw new BadRequest("Type the problem or snap a photo of it.");
  const out = await structured(
    SOLVE_SYSTEM,
    [...imageBlock(body.image), { type: "text", text: `${problem ? `Problem: ${problem}` : "Solve the problem in the photo."}${body.course ? `\nClass: ${cleanText(body.course, 80)}` : ""}${body.grade ? `\nGrade: ${cleanText(String(body.grade), 10)}` : ""}` }],
    SOLVE_SCHEMA,
  );
  return { title: String(out.title || "Solve"), answer: String(out.answer || ""), try_next: String(out.try_next || ""), steps: cleanSteps(out.steps, 12) };
}

const ANSWER_SYSTEM = `You are BrainBoro's "Snap & Answer": a student sends a photo (or text) of homework or a test-prep question. Find each distinct problem (up to 6) and answer it.

For each problem:
- "question": restate it briefly in plain text (Unicode math, no LaTeX).
- "answer": the final answer, short and exact (include units / the letter choice if multiple choice).
- "subject": one of Math, Science, ELA, History, Other.
- "steps": 2–6 steps. "show" = the math or key idea written on a whiteboard ({numerator|denominator} for fractions, [[x]] to circle the key result); "say" = one sentence explaining why, under 22 words.
- "concept": the skill being tested in 2–5 words (e.g. "Two-step equations").
Double-check every answer. If the photo is unreadable, return no problems and say so in "note". If a problem asks the student to write an essay or long response, don't write it: set "answer" to "Open Essay Coach to plan this" and make the steps a short plan.`;

const ANSWER_SCHEMA = {
  type: "object",
  properties: {
    note: { type: "string" },
    problems: {
      type: "array",
      items: {
        type: "object",
        properties: { question: { type: "string" }, answer: { type: "string" }, subject: { type: "string" }, concept: { type: "string" }, steps: CHEAT_SCHEMA.properties.steps },
        required: ["question", "answer", "subject", "concept", "steps"],
        additionalProperties: false,
      },
    },
  },
  required: ["note", "problems"],
  additionalProperties: false,
};

/** Gauth-style: photo or text in, answers + steps for each problem out. */
export async function generateAnswer(body) {
  const text = cleanText(body.text, 2000);
  if (!text && !body.image) throw new BadRequest("Snap a photo or type the question.");
  const out = await structured(ANSWER_SYSTEM, [...imageBlock(body.image), { type: "text", text: text ? `Question(s): ${text}` : "Answer the problem(s) in this photo." }], ANSWER_SCHEMA, 12000);
  const problems = (Array.isArray(out.problems) ? out.problems : [])
    .filter((p) => p && p.question && p.answer)
    .slice(0, 6)
    .map((p) => ({ question: String(p.question), answer: String(p.answer), subject: String(p.subject || "Other"), concept: String(p.concept || "Homework"), steps: cleanSteps(p.steps, 8) }));
  return { note: String(out.note || ""), problems };
}

// ---------- Essay Coach ----------
const ESSAY_KINDS = {
  argument: "argument essay (claim, evidence, counterclaim, like the ELA Regents Part 2)",
  analysis: "text-analysis response (central idea + one writing strategy, like the ELA Regents Part 3)",
  short: "short constructed response (one paragraph: restate, answer, cite evidence, explain: RACE)",
  literary: "literary essay about a book, story or poem",
  narrative: "personal narrative or college/high-school application essay",
  research: "informational or research essay",
  dbq: "history document-based essay (Regents Enduring Issues or Civic Literacy essay)",
};

const PLAN_SYSTEM = `You are BrainBoro's Essay Coach for students in grades 6–12. You help students write THEIR OWN essays: you plan, teach and give feedback, but you never write the essay, a full paragraph, or text meant to be turned in. Keep every suggestion short (a phrase or one model sentence starter) so the student does the writing in their own voice.`;

const PLAN_SCHEMA = {
  type: "object",
  properties: {
    understand: { type: "string" },
    thesis_options: { type: "array", items: { type: "string" } },
    outline: {
      type: "array",
      items: {
        type: "object",
        properties: { part: { type: "string" }, goal: { type: "string" }, bullets: { type: "array", items: { type: "string" } }, starter: { type: "string" } },
        required: ["part", "goal", "bullets", "starter"],
        additionalProperties: false,
      },
    },
    evidence_tips: { type: "array", items: { type: "string" } },
    counterclaim: { type: "string" },
    words_to_use: { type: "array", items: { type: "string" } },
    checklist: { type: "array", items: { type: "string" } },
  },
  required: ["understand", "thesis_options", "outline", "evidence_tips", "counterclaim", "words_to_use", "checklist"],
  additionalProperties: false,
};

const FEEDBACK_SCHEMA = {
  type: "object",
  properties: {
    overall: { type: "string" },
    scores: {
      type: "array",
      items: { type: "object", properties: { area: { type: "string" }, score: { type: "integer" }, out_of: { type: "integer" }, why: { type: "string" } }, required: ["area", "score", "out_of", "why"], additionalProperties: false },
    },
    strengths: { type: "array", items: { type: "string" } },
    fixes: {
      type: "array",
      items: { type: "object", properties: { quote: { type: "string" }, problem: { type: "string" }, how_to_fix: { type: "string" } }, required: ["quote", "problem", "how_to_fix"], additionalProperties: false },
    },
    grammar: {
      type: "array",
      items: { type: "object", properties: { quote: { type: "string" }, fix: { type: "string" } }, required: ["quote", "fix"], additionalProperties: false },
    },
    next_step: { type: "string" },
  },
  required: ["overall", "scores", "strengths", "fixes", "grammar", "next_step"],
  additionalProperties: false,
};

/** Essay Coach: "plan" builds thesis options + an outline; "feedback" scores the student's draft on a rubric. */
const arr = (v) => (Array.isArray(v) ? v : []);
function normalizeEssay(out, mode) {
  if (mode === "feedback") return { overall: String(out.overall || ""), scores: arr(out.scores), strengths: arr(out.strengths), fixes: arr(out.fixes), grammar: arr(out.grammar), next_step: String(out.next_step || "") };
  return { understand: String(out.understand || ""), thesis_options: arr(out.thesis_options), outline: arr(out.outline).map((o) => ({ part: String(o.part || ""), goal: String(o.goal || ""), bullets: arr(o.bullets), starter: String(o.starter || "") })), evidence_tips: arr(out.evidence_tips), counterclaim: String(out.counterclaim || ""), words_to_use: arr(out.words_to_use), checklist: arr(out.checklist) };
}

export async function generateEssay(body) {
  return normalizeEssay(await essayRaw(body), body.mode === "feedback" ? "feedback" : "plan");
}

async function essayRaw(body) {
  const kind = ESSAY_KINDS[body.kind] ? body.kind : "argument";
  const prompt = cleanText(body.prompt, 3000);
  const sources = cleanText(body.sources, 8000);
  const grade = body.grade ? `Grade ${cleanText(String(body.grade), 6)}` : "Middle/high school";
  if (body.mode === "feedback") {
    const draft = cleanText(body.draft, 12000);
    if (draft.length < 80) throw new BadRequest("Paste at least a few sentences of your draft.");
    return structured(
      `${PLAN_SYSTEM}\nNow grade the student's draft like a fair teacher. Use 4 rubric areas that fit a ${ESSAY_KINDS[kind]} (for Regents-style tasks use: Content & Analysis, Command of Evidence, Coherence/Organization/Style, Control of Conventions; score 1–4 or 1–6 as the Regents does). Quote the student's exact words in "quote". In "how_to_fix", explain the fix and give at most a short example phrase; never rewrite whole sentences or paragraphs for them. Max 5 fixes and 6 grammar notes.`,
      [{ type: "text", text: `${grade}. Type: ${ESSAY_KINDS[kind]}.\nAssignment: ${prompt || "(not given)"}\n${sources ? `Sources/notes:\n${sources}\n` : ""}\nStudent draft:\n"""${draft}"""` }],
      FEEDBACK_SCHEMA,
      8000,
    );
  }
  if (!prompt) throw new BadRequest("Paste the assignment or prompt first.");
  return structured(
    `${PLAN_SYSTEM}\nMake a plan for a ${ESSAY_KINDS[kind]}. "understand" = what the prompt is really asking, in 1–2 sentences. 3 thesis options (one sentence each, different angles). Outline parts with a goal, 2–4 bullet ideas, and a sentence starter (just the first few words). Evidence tips should say what to look for in their sources (quote them if provided). End with a short checklist.`,
    [{ type: "text", text: `${grade}. Type: ${ESSAY_KINDS[kind]}.\nAssignment / prompt: ${prompt}\n${body.stance ? `Student's idea or side: ${cleanText(body.stance, 500)}\n` : ""}${sources ? `Sources/notes:\n${sources}` : ""}` }],
    PLAN_SCHEMA,
    8000,
  );
}

/** Maps SDK errors to a status code and a student-friendly message. */
export function describeError(err) {
  if (err instanceof BadRequest) return { status: 400, message: err.message };
  if (err instanceof ProviderError) {
    if (err.status === 429) return { status: 429, message: "The free AI is busy or out of free uses for today. Try again in a bit." };
    if (err.status === 401 || err.status === 403) return { status: 500, message: "The AI key on this site isn't working. (Site owner: check your API key.)" };
    return { status: 502, message: "The AI hit a snag. Please try again." };
  }
  if (err instanceof Anthropic.RateLimitError) return { status: 429, message: "Boro is super busy right now — try again in a minute." };
  if (err instanceof Anthropic.AuthenticationError) return { status: 500, message: "The AI tutor isn't set up yet (missing or invalid API key)." };
  if (err instanceof Anthropic.APIStatusError) return { status: 502, message: "The AI tutor hit a snag. Please try again." };
  if (err instanceof Anthropic.APIConnectionError) return { status: 503, message: "Couldn't reach the AI tutor. Check your connection." };
  if (err instanceof SyntaxError) return { status: 502, message: "The AI returned something unexpected. Try again." };
  return { status: 500, message: "Something went wrong." };
}
