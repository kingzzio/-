// Tiny key-value store.
// - On Vercel (or anywhere): set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
//   (or Vercel KV's KV_REST_API_URL + KV_REST_API_TOKEN) for a free hosted Redis.
// - Otherwise data is kept in data/db.json next to the app (fine for one server; not for serverless).
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REST_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
const FILE = process.env.BRAINBORO_DB_FILE || join(dirname(fileURLToPath(import.meta.url)), "..", "data", "db.json");

export const dbKind = () => (REST_URL && REST_TOKEN ? "redis" : "file");

// ---------- Redis over REST ----------
async function redis(...command) {
  const res = await fetch(REST_URL, { method: "POST", headers: { Authorization: `Bearer ${REST_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify(command) });
  const data = await res.json();
  if (data.error) throw new Error(`db: ${data.error}`);
  return data.result;
}

// ---------- JSON file ----------
let mem = null;
let writing = Promise.resolve();
async function file() {
  if (mem) return mem;
  try {
    mem = JSON.parse(await readFile(FILE, "utf8"));
  } catch {
    mem = { kv: {}, sets: {}, zsets: {} };
  }
  return mem;
}
function persist() {
  writing = writing.then(async () => {
    await mkdir(dirname(FILE), { recursive: true });
    const tmp = `${FILE}.tmp`;
    await writeFile(tmp, JSON.stringify(mem));
    await rename(tmp, FILE);
  });
  return writing;
}

export async function get(key) {
  if (dbKind() === "redis") {
    const v = await redis("GET", key);
    return v == null ? null : JSON.parse(v);
  }
  const db = await file();
  return db.kv[key] ?? null;
}

export async function set(key, value) {
  if (dbKind() === "redis") return redis("SET", key, JSON.stringify(value));
  const db = await file();
  db.kv[key] = value;
  await persist();
}

/** Sets key only if it doesn't exist yet. Returns true if it was set. */
export async function setNew(key, value) {
  if (dbKind() === "redis") return (await redis("SET", key, JSON.stringify(value), "NX")) === "OK";
  const db = await file();
  if (key in db.kv) return false;
  db.kv[key] = value;
  await persist();
  return true;
}

export async function del(key) {
  if (dbKind() === "redis") return redis("DEL", key);
  const db = await file();
  delete db.kv[key];
  await persist();
}

export async function sadd(key, member) {
  if (dbKind() === "redis") return redis("SADD", key, member);
  const db = await file();
  const s = new Set(db.sets[key] || []);
  s.add(member);
  db.sets[key] = [...s];
  await persist();
}

export async function smembers(key) {
  if (dbKind() === "redis") return (await redis("SMEMBERS", key)) || [];
  return (await file()).sets[key] || [];
}

// Sorted sets for leaderboards.
export async function zset(key, member, score) {
  if (dbKind() === "redis") return redis("ZADD", key, score, member);
  const db = await file();
  (db.zsets[key] ||= {})[member] = score;
  await persist();
}

export async function zincr(key, member, by) {
  if (dbKind() === "redis") return redis("ZINCRBY", key, by, member);
  const db = await file();
  const z = (db.zsets[key] ||= {});
  z[member] = (z[member] || 0) + by;
  await persist();
}

export async function ztop(key, n) {
  if (dbKind() === "redis") {
    const flat = (await redis("ZRANGE", key, 0, n - 1, "REV", "WITHSCORES")) || [];
    const out = [];
    for (let i = 0; i < flat.length; i += 2) out.push([flat[i], Number(flat[i + 1])]);
    return out;
  }
  const z = (await file()).zsets[key] || {};
  return Object.entries(z)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}
