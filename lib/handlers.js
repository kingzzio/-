// HTTP handlers shared by server.js (local) and the Vercel functions in /api.
import { aiConfigured, describeError, generateCheatCode, generateQuiz, generateSolve, generateSteps, rateLimited, streamTutor } from "./tutor.js";
import { checkoutUrl, premiumEnabled, redeem, verifyToken } from "./premium.js";
import { FeedError, fetchFeed } from "./calendar.js";
import { importCanvas } from "./canvas.js";
import { AuthError, currentUser, googleClientId, hasPremium, publicUser } from "./auth.js";
import { handleAdmin, handleAuth, handleMe, leaderboard } from "./accounts.js";

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

function sendJson(res, status, data, cookie) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (cookie) res.setHeader("Set-Cookie", cookie);
  res.end(JSON.stringify(data));
}

// Blocks other websites from posting to our API with the student's cookies.
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === (req.headers["x-forwarded-host"] || req.headers.host);
  } catch {
    return false;
  }
}

async function isPremium(req) {
  if (verifyToken(String(req.headers["x-brainboro-premium"] || ""))) return true;
  return hasPremium(await currentUser(req).catch(() => null));
}

// Common guard: method, (AI) config, rate limit, body parsing. Returns the body or null if already responded.
async function prepare(req, res, { ai = true, bucket = "ai", limit } = {}) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Use POST." });
    return null;
  }
  if (!sameOrigin(req)) {
    sendJson(res, 403, { error: "Not allowed." });
    return null;
  }
  if (ai && !aiConfigured()) {
    sendJson(res, 503, { error: "The AI isn't turned on for this site yet. (Set ANTHROPIC_API_KEY on the server.)" });
    return null;
  }
  // Premium members get a bigger hourly AI allowance.
  const max = limit ?? Number(process.env.BRAINBORO_RATE_LIMIT || 40) * ((await isPremium(req)) ? 5 : 1);
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
  if (err instanceof AuthError) return sendJson(res, err.status, { error: err.message });
  if (err instanceof FeedError) return sendJson(res, 400, { error: err.message });
  const { status, message } = describeError(err);
  if (status >= 500) console.error(`[${label}]`, err);
  sendJson(res, status, { error: message });
}

// Wraps a JSON endpoint: guard, run, respond.
const endpoint = (label, run, opts) => async (req, res) => {
  const body = await prepare(req, res, opts);
  if (!body) return;
  try {
    sendJson(res, 200, await run(body, req));
  } catch (err) {
    fail(res, err, label);
  }
};

const premiumOnly = (label, run) => async (req, res) => {
  if (!(await isPremium(req))) return sendJson(res, 402, { error: "That's a Premium feature.", premium: true });
  return endpoint(label, run)(req, res);
};

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

export const quizHandler = endpoint("quiz", async (body) => ({ questions: await generateQuiz(body) }));
export const cheatcodeHandler = premiumOnly("cheatcode", generateCheatCode);
// Free accounts get a few Solves a day as a taste; Premium is unlimited (within the hourly AI cap).
const FREE_SOLVES = Number(process.env.BRAINBORO_FREE_SOLVES || 3);
export const solveHandler = async (req, res) => {
  if (!(await isPremium(req)) && rateLimited(`solvefree:${clientIp(req)}`, FREE_SOLVES, 86400000)) {
    return sendJson(res, 402, { error: `You've used your ${FREE_SOLVES} free Solves today. Go Premium for unlimited.`, premium: true });
  }
  return endpoint("solve", generateSolve)(req, res);
};
export const stepsHandler = premiumOnly("steps", async (body) => ({ steps: await generateSteps(body) }));
export const calendarHandler = endpoint("calendar", async (body) => ({ events: await fetchFeed(body.url) }), { ai: false, bucket: "cal", limit: 30 });
export const canvasHandler = endpoint("canvas", importCanvas, { ai: false, bucket: "cal", limit: 30 });
export const premiumHandler = endpoint("premium", async (body) => {
  const result = redeem(body.code);
  if (result.error) throw new AuthError(result.error);
  return result;
}, { ai: false, bucket: "redeem", limit: 10 });

export async function authHandler(req, res) {
  const body = await prepare(req, res, { ai: false, bucket: "auth", limit: 30 });
  if (!body) return;
  try {
    const { user, cookie } = await handleAuth(body);
    sendJson(res, 200, { user: publicUser(user) }, cookie);
  } catch (err) {
    fail(res, err, "auth");
  }
}

export async function meHandler(req, res) {
  try {
    if (req.method === "GET") return sendJson(res, 200, await handleMe(req, null));
    const body = await prepare(req, res, { ai: false, bucket: "me", limit: 600 });
    if (!body) return;
    sendJson(res, 200, await handleMe(req, body));
  } catch (err) {
    fail(res, err, "me");
  }
}

export async function adminHandler(req, res) {
  try {
    if (req.method === "GET") return sendJson(res, 200, await handleAdmin(req, null));
    const body = await prepare(req, res, { ai: false, bucket: "admin", limit: 300 });
    if (!body) return;
    sendJson(res, 200, await handleAdmin(req, body));
  } catch (err) {
    fail(res, err, "admin");
  }
}

export async function leaderboardHandler(req, res) {
  try {
    sendJson(res, 200, await leaderboard(await currentUser(req).catch(() => null)));
  } catch (err) {
    fail(res, err, "leaderboard");
  }
}

export async function statusHandler(req, res) {
  sendJson(res, 200, { ai: aiConfigured(), premium: premiumEnabled(), checkoutUrl: checkoutUrl(), member: await isPremium(req), googleClientId: googleClientId() });
}
