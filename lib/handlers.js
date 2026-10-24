// HTTP handlers shared by server.js (local) and the Vercel functions in /api.
import { aiConfigured, describeError, generateCheatCode, generateQuiz, generateSteps, rateLimited, streamTutor } from "./tutor.js";
import { checkoutUrl, premiumEnabled, redeem, verifyToken } from "./premium.js";
import { FeedError, fetchFeed } from "./calendar.js";

const MAX_BODY = 6_000_000;

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body; // Vercel pre-parses JSON
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw Object.assign(new Error("too large"), { status: 413 });
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

const isPremium = (req) => verifyToken(String(req.headers["x-brainboro-premium"] || ""));

// Common guard: method, (AI) config, rate limit, body parsing. Returns the body or null if already responded.
async function prepare(req, res, { ai = true, bucket = "ai", limit } = {}) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Use POST." });
    return null;
  }
  if (ai && !aiConfigured()) {
    sendJson(res, 503, { error: "The AI tutor isn't turned on for this site yet. (Set ANTHROPIC_API_KEY on the server.)" });
    return null;
  }
  // Premium members get a bigger hourly AI allowance.
  const max = limit ?? Number(process.env.BRAINBORO_RATE_LIMIT || 40) * (isPremium(req) ? 5 : 1);
  if (rateLimited(`${bucket}:${clientIp(req)}`, max)) {
    sendJson(res, 429, { error: "You've hit the hourly limit. Take a quick break and keep practicing with flashcards!" });
    return null;
  }
  try {
    return await readJson(req);
  } catch (err) {
    sendJson(res, err.status || 400, { error: "Couldn't read that request." });
    return null;
  }
}

function fail(res, err, label) {
  const { status, message } = describeError(err);
  if (status >= 500) console.error(`[${label}]`, err);
  sendJson(res, status, { error: message });
}

export async function tutorHandler(req, res) {
  const body = await prepare(req, res);
  if (!body) return;
  let started = false;
  try {
    await streamTutor(body, (text) => {
      if (!started) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("X-Accel-Buffering", "no");
        started = true;
      }
      res.write(text);
    });
    if (!started) res.statusCode = 200;
    res.end();
  } catch (err) {
    const { status, message } = describeError(err);
    if (status >= 500) console.error("[tutor]", err);
    if (started) res.end(`\n\n⚠️ ${message}`);
    else sendJson(res, status, { error: message });
  }
}

export async function quizHandler(req, res) {
  const body = await prepare(req, res);
  if (!body) return;
  try {
    sendJson(res, 200, { questions: await generateQuiz(body) });
  } catch (err) {
    fail(res, err, "quiz");
  }
}

export async function cheatcodeHandler(req, res) {
  if (!isPremium(req)) return sendJson(res, 402, { error: "Cheat Codes are a Premium feature.", premium: true });
  const body = await prepare(req, res);
  if (!body) return;
  try {
    sendJson(res, 200, await generateCheatCode(body));
  } catch (err) {
    fail(res, err, "cheatcode");
  }
}

export async function stepsHandler(req, res) {
  const body = await prepare(req, res);
  if (!body) return;
  try {
    sendJson(res, 200, { steps: await generateSteps(body) });
  } catch (err) {
    fail(res, err, "steps");
  }
}

export async function calendarHandler(req, res) {
  const body = await prepare(req, res, { ai: false, bucket: "cal", limit: 30 });
  if (!body) return;
  try {
    sendJson(res, 200, { events: await fetchFeed(body.url) });
  } catch (err) {
    if (err instanceof FeedError) return sendJson(res, 400, { error: err.message });
    console.error("[calendar]", err);
    sendJson(res, 502, { error: "Couldn't load that calendar. Check the link and try again." });
  }
}

export async function premiumHandler(req, res) {
  const body = await prepare(req, res, { ai: false, bucket: "redeem", limit: 10 });
  if (!body) return;
  const result = redeem(body.code);
  sendJson(res, result.error ? 400 : 200, result);
}

export function statusHandler(req, res) {
  sendJson(res, 200, { ai: aiConfigured(), premium: premiumEnabled(), checkoutUrl: checkoutUrl(), member: isPremium(req) });
}
