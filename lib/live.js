// BrainBoro Live: a Kahoot-style game. The host's device runs the show; players join with a PIN and
// poll for state. Everything lives in the key-value store, so it works on serverless (no websockets).
import { createHash, randomBytes, randomInt } from "node:crypto";
import * as db from "./db.js";

export class LiveError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const TTL = 6 * 3600; // games disappear after 6 hours
const MAX_PLAYERS = 200;
const GRACE_MS = 1500; // network slack after the timer ends
const hash = (s) => createHash("sha256").update(String(s)).digest("hex");
const clean = (s, max) => String(s ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
const key = (pin, part = "") => `live:${pin}${part ? `:${part}` : ""}`;

async function touch(pin, ...parts) {
  await Promise.all([key(pin), ...parts.map((p) => key(pin, p))].map((k) => db.expire(k, TTL)));
}

async function load(pin) {
  if (!/^\d{6}$/.test(String(pin || ""))) throw new LiveError("Game PINs are 6 digits.");
  const game = await db.get(key(pin));
  if (!game) throw new LiveError("No game with that PIN. Check it with the host.", 404);
  return game;
}

function checkHost(game, hostKey) {
  if (!hostKey || hash(hostKey) !== game.hostHash) throw new LiveError("Only the host can do that.", 403);
}

function cleanQuestions(list) {
  if (!Array.isArray(list)) throw new LiveError("No questions.");
  const qs = list.slice(0, 30).map((q) => {
    const choices = Array.isArray(q?.choices) ? q.choices.slice(0, 4).map((c) => clean(c, 140)) : [];
    const a = Number(q?.a);
    if (!clean(q?.q, 600) || choices.length < 2 || !Number.isInteger(a) || a < 0 || a >= choices.length) throw new LiveError("A question is missing its choices or answer.");
    return { q: clean(q.q, 600), choices, a, exp: clean(q.exp, 400) };
  });
  if (qs.length < 1) throw new LiveError("Add at least one question.");
  return qs;
}

async function create({ title, questions, seconds }) {
  const qs = cleanQuestions(questions);
  const hostKey = randomBytes(18).toString("base64url");
  for (let tries = 0; tries < 8; tries++) {
    const pin = String(randomInt(100000, 1000000));
    const game = { title: clean(title, 80) || "BrainBoro Live", questions: qs, seconds: Math.min(60, Math.max(10, Number(seconds) || 20)), phase: "lobby", index: -1, startedAt: 0, hostHash: hash(hostKey), createdAt: Date.now() };
    if (await db.setNew(key(pin), game)) {
      await touch(pin);
      return { pin, hostKey };
    }
  }
  throw new LiveError("Couldn't make a game right now. Try again.", 503);
}

async function players(pin) {
  return (await db.smembers(key(pin, "players"))).map((m) => {
    const i = m.indexOf("|");
    return { id: m.slice(0, i), name: m.slice(i + 1) };
  });
}

async function join({ pin, name }) {
  const game = await load(pin);
  name = clean(name, 20);
  if (!name) throw new LiveError("Pick a nickname.");
  const list = await players(pin);
  if (list.length >= MAX_PLAYERS) throw new LiveError("This game is full.");
  if (list.some((p) => p.name.toLowerCase() === name.toLowerCase())) throw new LiveError("Someone already has that nickname. Pick another.");
  if (game.phase === "done") throw new LiveError("That game already ended.");
  const id = randomBytes(6).toString("hex");
  const secret = randomBytes(12).toString("base64url");
  await db.sadd(key(pin, "players"), `${id}|${name}`);
  await db.set(key(pin, `pk:${id}`), hash(secret));
  await db.zincr(key(pin, "score"), id, 0);
  await touch(pin, "players", `pk:${id}`, "score");
  return { playerId: id, secret, name };
}

async function host({ pin, hostKey, step }) {
  const game = await load(pin);
  checkHost(game, hostKey);
  if (step === "next") {
    if (game.index + 1 >= game.questions.length) game.phase = "done";
    else Object.assign(game, { phase: "question", index: game.index + 1, startedAt: Date.now() });
  } else if (step === "reveal") {
    if (game.phase === "question") game.phase = "reveal";
  } else if (step === "end") game.phase = "done";
  else throw new LiveError("Unknown step.");
  await db.set(key(pin), game);
  await touch(pin);
  return view(pin, game, { host: true });
}

async function answer({ pin, playerId, secret, choice }) {
  const game = await load(pin);
  if (hash(secret) !== (await db.get(key(pin, `pk:${playerId}`)))) throw new LiveError("Rejoin the game.", 403);
  if (game.phase !== "question") throw new LiveError("Time's up for that question.");
  const q = game.questions[game.index];
  const elapsed = Date.now() - game.startedAt;
  if (elapsed > game.seconds * 1000 + GRACE_MS) throw new LiveError("Time's up for that question.");
  choice = Number(choice);
  if (!Number.isInteger(choice) || choice < 0 || choice >= q.choices.length) throw new LiveError("Pick an answer.");
  // One answer per player per question (atomic).
  if (!(await db.setNew(key(pin, `a:${game.index}:${playerId}`), { choice, elapsed }))) throw new LiveError("You already answered.");
  const correct = choice === q.a;
  // Kahoot-style: right answers earn 500–1000 points, more for speed.
  const points = correct ? Math.round(1000 - 500 * Math.min(1, elapsed / (game.seconds * 1000))) : 0;
  await Promise.all([
    db.zincr(key(pin, `dist:${game.index}`), String(choice), 1),
    correct && db.zincr(key(pin, "score"), playerId, points),
    db.set(key(pin, `last:${playerId}`), { index: game.index, correct, points }),
  ]);
  await touch(pin, `a:${game.index}:${playerId}`, `dist:${game.index}`, `last:${playerId}`);
  return { ok: true };
}

/** What a screen should show right now. Hosts also get the answer counts; players get their own result. */
async function view(pin, game, { host = false, playerId } = {}) {
  const q = game.questions[game.index];
  const out = { pin, title: game.title, phase: game.phase, index: game.index, total: game.questions.length, seconds: game.seconds, now: Date.now() };
  const list = await players(pin);
  out.playerCount = list.length;
  if (game.phase === "lobby") out.players = list.map((p) => p.name).slice(-60);
  if (q && game.phase !== "lobby") {
    out.question = { q: q.q, choices: q.choices };
    out.endsAt = game.startedAt + game.seconds * 1000;
    const dist = Object.fromEntries(await db.ztop(key(pin, `dist:${game.index}`), 4));
    out.answered = Object.values(dist).reduce((a, b) => a + b, 0);
    if (game.phase !== "question") Object.assign(out, { answer: q.a, exp: q.exp, dist: q.choices.map((_, i) => dist[i] || 0) });
  }
  if (game.phase !== "question" || host) {
    const names = new Map(list.map((p) => [p.id, p.name]));
    const top = await db.ztop(key(pin, "score"), MAX_PLAYERS);
    out.leaders = top.slice(0, game.phase === "done" ? 10 : 5).map(([id, score]) => ({ name: names.get(id) || "?", score }));
    if (playerId) {
      const rank = top.findIndex(([id]) => id === playerId);
      out.me = { rank: rank + 1, score: rank >= 0 ? top[rank][1] : 0 };
    }
  }
  if (playerId && game.phase !== "lobby") {
    const last = await db.get(key(pin, `last:${playerId}`));
    out.myAnswer = last?.index === game.index ? (game.phase === "question" ? { locked: true } : last) : null;
  }
  return out;
}

export async function handleLive(body) {
  switch (body?.action) {
    case "create":
      return create(body);
    case "join":
      return join(body);
    case "host":
      return host(body);
    case "answer":
      return answer(body);
    case "state": {
      const game = await load(body.pin);
      if (body.hostKey) checkHost(game, body.hostKey);
      return view(body.pin, game, { host: Boolean(body.hostKey), playerId: body.playerId });
    }
    default:
      throw new LiveError("Unknown action.");
  }
}
