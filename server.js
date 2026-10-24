// Local dev / self-hosting server: serves /public and the /api routes.
// Run: ANTHROPIC_API_KEY=sk-... npm start   (the app works without a key; only AI features need it)
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { quizHandler, statusHandler, tutorHandler } from "./lib/handlers.js";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "public");
const port = Number(process.env.PORT || 3000);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};
const routes = { "/api/tutor": tutorHandler, "/api/quiz": quizHandler, "/api/status": statusHandler };

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
    const data = await readFile(file);
    res.setHeader("Content-Type", types[extname(file)] || "application/octet-stream");
    res.end(data);
  } catch {
    // SPA fallback
    res.setHeader("Content-Type", types[".html"]);
    res.end(await readFile(join(root, "index.html")));
  }
}).listen(port, () => console.log(`BrainBoro running at http://localhost:${port}`));
