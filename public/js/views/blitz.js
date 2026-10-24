// Blitz: 60 seconds of rapid-fire math. Every right answer +1, wrong −0. Beat your best, share your score.
import { state, save, addXp } from "../store.js";
import { esc, share, baseUrl, confetti, celebrateBadges } from "../ui.js";
import { icon } from "../icons.js";
import { generateSet, generatorNames } from "../generators.js";

const SECONDS = 60;
// Quick-to-read generators only (no long word problems).
const FAST = ["integers", "order-ops", "one-step", "two-step", "percent-of", "fraction-ops", "exponents", "absolute-value", "radicals", "gcf-lcm", "slope", "angles", "pythagorean", "function-eval", "factoring"].filter((g) => generatorNames.includes(g));

export default function blitz(root, _p, query) {
  let timer = null;
  const intro = () => {
    clearInterval(timer);
    root.innerHTML = `
      <a class="back" href="#/learn">${icon("back", 18)} Learn</a>
      <div class="battle-card">
        <div class="big-emoji">⚡</div>
        <h1>Blitz</h1>
        <p class="lead">${SECONDS} seconds. As many as you can. No calculator.</p>
        ${query.sc ? `<p class="tag" style="--accent:#ff4f8b">${esc((query.n || "A friend").slice(0, 20))} scored ${Number(query.sc) || 0}. Beat it!</p>` : ""}
        <div class="stat-row"><div class="stat"><div class="stat-v">${state.blitz.best}</div><div class="stat-l">your best</div></div><div class="stat"><div class="stat-v">${SECONDS}s</div><div class="stat-l">time</div></div><div class="stat"><div class="stat-v">+5</div><div class="stat-l">XP each</div></div></div>
        <button class="btn big glow" id="go">Start ⚡</button>
      </div>`;
    root.querySelector("#go").onclick = play;
  };

  const play = () => {
    const qs = generateSet(FAST, 120, Date.now());
    let i = 0, score = 0, streak = 0;
    const end = Date.now() + SECONDS * 1000;
    const draw = () => {
      const q = qs[i];
      root.innerHTML = `
        <div class="blitz-top"><div class="blitz-clock" id="clk">${SECONDS}</div><div class="center"><div class="blitz-score">${score}</div><div class="small muted">${streak >= 3 ? `🔥 ${streak} streak` : "score"}</div></div><a class="icon-btn filled" href="#/learn" aria-label="Quit">${icon("x", 20)}</a></div>
        <div class="question"><p class="q-text">${esc(q.q).replace(/\n/g, "<br>")}</p>
        <div class="choices">${q.choices.map((c, k) => `<button class="choice" data-k="${k}"><span class="letter">${"ABCD"[k]}</span><span>${esc(c)}</span></button>`).join("")}</div></div>`;
      tick();
      root.querySelectorAll(".choice").forEach((b) => (b.onclick = () => {
        const ok = Number(b.dataset.k) === q.a;
        b.classList.add(ok ? "right" : "wrong");
        if (ok) (score++, streak++);
        else streak = 0;
        i++;
        setTimeout(draw, ok ? 120 : 380);
      }));
    };
    const tick = () => {
      const left = Math.max(0, end - Date.now());
      const clk = root.querySelector("#clk");
      if (clk) {
        clk.textContent = Math.ceil(left / 1000);
        clk.style.setProperty("--p", (left / (SECONDS * 1000)) * 100);
      }
      if (left <= 0) finish(score);
    };
    timer = setInterval(tick, 200);
    draw();
  };

  const finish = (score) => {
    clearInterval(timer);
    const best = score > state.blitz.best;
    if (best) state.blitz.best = score;
    save();
    celebrateBadges(addXp(score * 5));
    if (best && score) confetti();
    const url = `${baseUrl()}#/blitz?n=${encodeURIComponent(state.profile.name || "A friend")}&sc=${score}`;
    root.innerHTML = `
      <div class="results">
        <div class="big-emoji">${best ? "🏆" : "⚡"}</div>
        <h1>${score}</h1>
        <p class="lead">${best ? "New personal best!" : `Best: ${state.blitz.best}`}${query.sc ? ` · ${esc((query.n || "Your friend").slice(0, 20))}: ${Number(query.sc) || 0}` : ""}</p>
        <div class="btn-row wrap"><button class="btn glow" id="again">Run it back</button><button class="btn ghost" id="share">${icon("share", 18)} Challenge friends</button></div>
      </div>`;
    root.querySelector("#again").onclick = play;
    root.querySelector("#share").onclick = () => share({ title: "BrainBoro Blitz", text: `I got ${score} in a 60-second BrainBoro Blitz ⚡ Beat me:`, url });
  };

  intro();
  return () => clearInterval(timer);
}
