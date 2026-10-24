// Score Reveal: turns a practice-test percentage into an estimated scaled score + a shareable image.
import { esc, share, baseUrl, toast } from "./ui.js";

const lerp = (pts, x) => {
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return pts.at(-1)[1];
};

/** Rough, clearly-labelled estimates, good for motivation, not a guarantee. */
export function estimate(examId, pct) {
  const p = Math.max(0, Math.min(1, pct));
  if (examId === "sat") return { label: "Your estimated SAT score", score: Math.round((400 + 1200 * p ** 0.9) / 10) * 10, min: 400, max: 1600 };
  if (examId === "shsat") return { label: "Your estimated SHSAT score", score: Math.round(200 + 500 * p ** 0.95), min: 200, max: 700 };
  if (examId.startsWith("regents")) return { label: "Your estimated Regents score", score: Math.round(lerp([[0, 0], [0.31, 65], [0.66, 85], [1, 100]], p)), min: 0, max: 100 };
  return { label: "Your practice score", score: Math.round(p * 100), min: 0, max: 100, suffix: "%" };
}

const mascot = (p) => (p >= 0.9 ? "👑" : p >= 0.75 ? "😎" : p >= 0.55 ? "💪" : "🌱");

export function revealHtml(exam, pct) {
  const e = estimate(exam.id, pct);
  return `<div class="reveal">
    <span class="label">${esc(e.label)}</span>
    <div class="score-big">${e.score}${e.suffix || ""}</div>
    <div class="range"><span>${e.min}</span><span>${e.max}</span></div>
    <div class="mascot">${mascot(pct)}</div>
    <p class="small" style="color:#4a4570;margin:0">Estimate from your practice test · not an official score</p>
    <div class="btn-row"><button class="btn dark" id="share-score">Share my score</button></div>
  </div>`;
}

/** Draws the score card to a PNG (for Instagram/TikTok stories) and shares or downloads it. */
export async function shareScore(exam, pct, name) {
  const e = estimate(exam.id, pct);
  const W = 1080, H = 1920;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#fbfaff";
  g.fillRect(0, 0, W, H);
  const colors = ["#ff9a9a", "#ffd28a", "#fff59a", "#a6f0b5", "#9fd8ff", "#c6a8ff"];
  colors.forEach((col, i) => {
    g.beginPath();
    g.lineWidth = 60;
    g.strokeStyle = col;
    g.arc(W / 2, 1150, 820 - i * 60, Math.PI, 0);
    g.stroke();
  });
  g.textAlign = "center";
  g.fillStyle = "#1d1840";
  g.font = "700 54px Inter, system-ui, sans-serif";
  g.fillText(e.label, W / 2, 360);
  g.font = "800 300px 'Bricolage Grotesque', Inter, system-ui, sans-serif";
  g.lineWidth = 16;
  g.strokeStyle = "#1d1840";
  g.strokeText(`${e.score}${e.suffix || ""}`, W / 2, 720);
  g.fillStyle = "#fff";
  g.fillText(`${e.score}${e.suffix || ""}`, W / 2, 720);
  g.font = "200px system-ui, sans-serif";
  g.fillText(mascot(pct), W / 2, 1080);
  g.fillStyle = "#1d1840";
  g.font = "700 60px Inter, system-ui, sans-serif";
  g.fillText(`${name || "Me"} · ${exam.name}`, W / 2, 1380);
  g.font = "500 40px Inter, system-ui, sans-serif";
  g.fillStyle = "#6a6488";
  g.fillText("Practice estimate · BrainBoro", W / 2, 1460);
  const grad = g.createLinearGradient(240, 0, 840, 0);
  grad.addColorStop(0, "#6d4aff");
  grad.addColorStop(1, "#ff4f8b");
  g.fillStyle = grad;
  g.beginPath();
  g.roundRect(240, 1600, 600, 130, 65);
  g.fill();
  g.fillStyle = "#fff";
  g.font = "800 56px Inter, system-ui, sans-serif";
  g.fillText("Beat me on BrainBoro", W / 2, 1685);

  const blob = await new Promise((r) => c.toBlob(r, "image/png"));
  const file = new File([blob], "brainboro-score.png", { type: "image/png" });
  const text = `I got ${e.score}${e.suffix || ""} on a ${exam.name} practice test 🧠🔥`;
  try {
    if (navigator.canShare?.({ files: [file] })) return await navigator.share({ files: [file], text, url: `${baseUrl()}#/exam/${exam.id}` });
  } catch (err) {
    if (err?.name === "AbortError") return;
  }
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "brainboro-score.png" });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast("Score card saved. Post it to your story!", { emoji: "📸" });
  share({ title: "BrainBoro", text, url: `${baseUrl()}#/exam/${exam.id}` }).catch(() => {});
}
