// Small UI helpers: escaping, safe markdown, toasts, confetti, sharing, and the AI API client.
import { state } from "./store.js";

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Minimal, safe markdown: escapes first, then applies a few formatting rules. */
export function md(text) {
  const lines = esc(text).split("\n");
  let html = "";
  let list = null;
  const inline = (s) =>
    s
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  const close = () => {
    if (list) html += `</${list}>`;
    list = null;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    let m;
    if ((m = line.match(/^\s*[-*•]\s+(.*)/))) {
      if (list !== "ul") (close(), (html += "<ul>"), (list = "ul"));
      html += `<li>${inline(m[1])}</li>`;
    } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)/))) {
      if (list !== "ol") (close(), (html += "<ol>"), (list = "ol"));
      html += `<li>${inline(m[1])}</li>`;
    } else if ((m = line.match(/^#{1,4}\s+(.*)/))) {
      close();
      html += `<p class="md-h">${inline(m[1])}</p>`;
    } else if (line.trim() === "") {
      close();
    } else {
      close();
      html += `<p>${inline(line)}</p>`;
    }
  }
  close();
  return html;
}

export function toast(message, { emoji = "✨", ms = 2600 } = {}) {
  const box = document.getElementById("toasts");
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<span>${esc(emoji)}</span><span>${esc(message)}</span>`;
  box.appendChild(el);
  while (box.children.length > 3) box.firstElementChild.remove();
  setTimeout(() => el.classList.add("out"), ms);
  setTimeout(() => el.remove(), ms + 400);
}

export function celebrateBadges(badges) {
  badges.forEach((b, i) => setTimeout(() => toast(`Badge unlocked: ${b.name}`, { emoji: b.emoji, ms: 3500 }), i * 700));
  if (badges.length) confetti();
}

export function confetti(count = 120) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.createElement("canvas");
  canvas.className = "confetti";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const W = (canvas.width = innerWidth), H = (canvas.height = innerHeight);
  const colors = ["#ff5d8f", "#ffd23f", "#3bceac", "#7b5cff", "#00b4ff", "#ff8c42"];
  const bits = Array.from({ length: count }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.4, y: H * 0.35, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4,
    s: 4 + Math.random() * 6, c: colors[(Math.random() * colors.length) | 0], r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
  }));
  let frame = 0;
  (function tick() {
    ctx.clearRect(0, 0, W, H);
    for (const b of bits) {
      b.vy += 0.35; b.x += b.vx; b.y += b.vy; b.r += b.vr; b.vx *= 0.99;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = b.c; ctx.fillRect(-b.s / 2, -b.s / 2, b.s, b.s * 0.6); ctx.restore();
    }
    if (++frame < 160) requestAnimationFrame(tick);
    else canvas.remove();
  })();
}

export async function share({ title, text, url }) {
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return;
    }
  } catch (err) {
    if (err?.name === "AbortError") return;
  }
  try {
    await navigator.clipboard.writeText(`${text} ${url}`.trim());
    toast("Link copied — send it to your friends!", { emoji: "📋" });
  } catch {
    prompt("Copy this link:", url);
  }
}

export const baseUrl = () => `${location.origin}${location.pathname}`;

// ---------- AI API client ----------
let statusPromise = null;
/** { ai, premium, checkoutUrl, member } from the server; all false when there's no server (static hosting). */
export function serverStatus() {
  statusPromise ??= fetch("api/status", { cache: "no-store", headers: premiumHeader() })
    .then((res) => (res.ok ? res.json() : {}))
    .catch(() => ({}));
  return statusPromise;
}
export const resetServerStatus = () => (statusPromise = null);
export const aiAvailable = async () => (await serverStatus()).ai === true;

function premiumHeader() {
  const token = state.premium?.token;
  return token ? { "X-BrainBoro-Premium": token } : {};
}

async function errorFrom(res) {
  try {
    const data = await res.json();
    return Object.assign(new Error(data.error || `Error ${res.status}`), { premium: data.premium === true, status: res.status });
  } catch {
    return Object.assign(new Error(`Error ${res.status}`), { status: res.status });
  }
}

export async function post(path, payload, signal) {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", ...premiumHeader() }, body: JSON.stringify(payload), signal });
  if (!res.ok) throw await errorFrom(res);
  return res;
}

/** Streams a tutor reply; onText receives the full text so far. */
export async function streamTutor(payload, onText, signal) {
  const res = await post("api/tutor", payload, signal);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    onText(text);
  }
  return text;
}

export async function aiQuiz(payload) {
  const { questions } = await (await post("api/quiz", payload)).json();
  return questions.map((q) => ({ q: q.question, choices: q.choices, a: q.answer_index, exp: q.explanation, ai: true }));
}

/** Downscales an image file and returns { mediaType, data } base64 for the tutor. */
export function readImage(file, max = 1400) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      const dataUrl = c.toDataURL("image/jpeg", 0.85);
      resolve({ mediaType: "image/jpeg", data: dataUrl.split(",")[1], preview: dataUrl });
    };
    img.onerror = () => reject(new Error("Couldn't read that image."));
    img.src = url;
  });
}
