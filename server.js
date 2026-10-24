// Local dev / self-hosting server: serves /public and the /api routes.
// Run: ANTHROPIC_API_KEY=sk-... npm start   (the app works without a key; only AI features need it)
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, gzipSync, constants } from "node:zlib";
import * as h from "./lib/handlers.js";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "public");
const port = Number(process.env.PORT || 3000);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};
const COMPRESSIBLE = new Set([".html", ".js", ".css", ".json", ".map", ".webmanifest", ".svg"]);
const routes = Object.fromEntries(
  ["tutor", "quiz", "status", "cheatcode", "solve", "answer", "essay", "steps", "calendar", "canvas", "premium", "auth", "me", "admin", "leaderboard"].map((n) => [`/api/${n}`, h[`${n}Handler`]]),
);

// Compressed copies, keyed by path + modified time, so each file is only compressed once.
const cache = new Map();
async function compressed(file, encoding) {
  const { mtimeMs } = await stat(file);
  const key = `${file}|${encoding}`;
  const hit = cache.get(key);
  if (hit && hit.mtimeMs === mtimeMs) return hit.body;
  const raw = await readFile(file);
  const body = encoding === "br" ? brotliCompressSync(raw, { params: { [constants.BROTLI_PARAM_QUALITY]: 9 } }) : gzipSync(raw, { level: 9 });
  cache.set(key, { mtimeMs, body });
  return body;
}

async function sendFile(req, res, file) {
  const ext = extname(file);
  res.setHeader("Content-Type", types[ext] || "application/octet-stream");
  // Versioned assets (?v=…) never change, so phones can keep them forever.
  const versioned = /[?&]v=/.test(req.url) || file.includes(`${join("public", "dist")}`);
  res.setHeader("Cache-Control", versioned ? "public, max-age=31536000, immutable" : "no-cache");
  if (ext === ".js" || ext === ".html") res.setHeader("X-Content-Type-Options", "nosniff");
  const accept = String(req.headers["accept-encoding"] || "");
  const encoding = COMPRESSIBLE.has(ext) ? (/\bbr\b/.test(accept) ? "br" : /\bgzip\b/.test(accept) ? "gzip" : "") : "";
  if (encoding) {
    res.setHeader("Content-Encoding", encoding);
    res.setHeader("Vary", "Accept-Encoding");
    return res.end(await compressed(file, encoding));
  }
  res.end(await readFile(file));
}

createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const route = routes[url.pathname];
  if (route) return route(req, res);

  const path = normalize(join(root, decodeURIComponent(url.pathname)));
  if (!path.startsWith(root)) {
    res.statusCode = 403;
    return res.end();
  }
  try {
    const file = (await stat(path)).isDirectory() ? join(path, "index.html") : path;
    await sendFile(req, res, file);
  } catch {
    // SPA fallback
    await sendFile(req, res, join(root, "index.html")).catch(() => res.end());
  }
}).listen(port, () => console.log(`BrainBoro running at http://localhost:${port}`));
