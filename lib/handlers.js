// HTTP handlers shared by server.js (local) and the Vercel functions in /api.
import { aiConfigured, describeError, generateQuiz, rateLimited, streamTutor } from "./tutor.js";

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

// Common guard: method, config, rate limit, body parsing. Returns the body or null if already responded.
async function prepare(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Use POST." });
    return null;
  }
  if (!aiConfigured()) {
    sendJson(res, 503, { error: "The AI tutor isn't turned on for this site yet. (Set ANTHROPIC_API_KEY on the server.)" });
    return null;
  }
  if (rateLimited(clientIp(req))) {
    sendJson(res, 429, { error: "You've hit the hourly AI limit. Take a quick break and keep practicing with flashcards!" });
    return null;
  }
  try {
    return await readJson(req);
  } catch (err) {
    sendJson(res, err.status || 400, { error: "Couldn't read that request." });
    return null;
  }
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
    const questions = await generateQuiz(body);
    sendJson(res, 200, { questions });
  } catch (err) {
    const { status, message } = describeError(err);
    if (status >= 500) console.error("[quiz]", err);
    sendJson(res, status, { error: message });
  }
}

export function statusHandler(req, res) {
  sendJson(res, 200, { ai: aiConfigured() });
}
