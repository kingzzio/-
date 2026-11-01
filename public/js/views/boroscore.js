// BoroScore: mastery practice. Your score climbs toward 100 as you get questions right; it climbs slower
// (and wrong answers cost more) the higher you go. 90+ is the Challenge Zone.
import { state, save, addXp, recordAnswer } from "../store.js";
import { esc, toast, confetti, celebrateBadges } from "../ui.js";
import { icon } from "../icons.js";
import { getTopic, buildQuiz, topics, subjects } from "../content.js";
import { askBoro } from "./study.js";

const gain = (s) => (s < 50 ? 10 : s < 80 ? 6 : s < 90 ? 3 : 2);
const loss = (s) => (s < 50 ? 4 : s < 80 ? 6 : s < 90 ? 8 : 12);
const zone = (s) => (s >= 100 ? "Mastered" : s >= 90 ? "Challenge Zone" : s >= 80 ? "Excellent" : s >= 50 ? "Getting there" : "Warming up");

// Topics with unlimited generated questions, or enough hand-written ones to practice.
export const scoreable = () => topics.filter((t) => t.gen?.length || t.qs.length >= 8);
const best = (id) => state.boroscore?.[id]?.best || 0;

export function boroscoreList(root, _p, query) {
  const subject = query.s || "math";
  const list = scoreable().filter((t) => t.subject === subject);
  root.innerHTML = `
    <a class="back" href="#/learn">${icon("back", 18)} Learn</a>
    <h1 class="page-title">${icon("gauge", 26)} BoroScore</h1>
    <p class="lead">Get your score to <strong>100</strong> to master a skill. It climbs fast at first, then slower. Past 90 you're in the <strong>Challenge Zone</strong>, where a miss costs more.</p>
    <div class="chip-row">${subjects.map((s) => `<a class="chip ${s.id === subject ? "on" : ""}" href="#/boroscore?s=${s.id}">${s.emoji} ${esc(s.name)}</a>`).join("")}</div>
    <div class="list" style="margin-top:12px">${list
      .map((t) => {
        const b = best(t.id);
        return `<a class="row" href="#/boroscore/${t.id}"><span class="score-pill ${b >= 100 ? "max" : b >= 90 ? "hot" : ""}">${b >= 100 ? "★" : b}</span><span class="grow"><strong>${esc(t.name)}</strong><small>${esc(t.course)}${t.gen?.length ? " · unlimited" : ""}</small></span><span class="chev">${icon("chevron")}</span></a>`;
      })
      .join("") || `<div class="empty"><p class="muted">No skills here yet.</p></div>`}</div>`;
}

export function boroscoreRoute(root, { id }) {
  const t = getTopic(id);
  if (!t) return (location.hash = "#/boroscore");
  let score = 0, answered = 0, streak = 0, q = null, recent = [];
  const started = Date.now();
  let clock = null;

  // A fresh question that isn't one of the last few.
  const next = () => {
    for (let tries = 0; tries < 8; tries++) {
      const [cand] = buildQuiz([t.id], 1, Math.floor(Math.random() * 1e9), { generatedOnly: Boolean(t.gen?.length) && Math.random() < 0.7 });
      if (cand && !recent.includes(cand.q)) {
        recent = [...recent.slice(-6), cand.q];
        return cand;
      }
    }
    return buildQuiz([t.id], 1, Date.now())[0];
  };

  const meter = () => `
    <div class="bs-meter ${score >= 90 ? "hot" : ""}">
      <div class="bs-num"><span id="bsn">${score}</span><small>BoroScore</small></div>
      <div class="bs-side">
        <div class="bar"><div class="bar-fill" style="width:${score}%"></div></div>
        <div class="bs-stats"><span>${zone(score)}</span><span>${answered} answered</span><span id="bst">${fmt(Date.now() - started)}</span></div>
      </div>
    </div>`;

  const ask = () => {
    q = next();
    if (!q) return (root.innerHTML = `<div class="empty"><h2>No questions for this skill yet</h2><a class="btn" href="#/boroscore">Pick another</a></div>`);
    root.innerHTML = `
      <div class="study-top"><a class="back" href="#/boroscore?s=${t.subject}" aria-label="Quit">✕</a><p class="small muted grow" style="margin:0">${esc(t.name)}</p>${streak >= 3 ? `<span class="combo hot">🔥 ${streak}</span>` : ""}</div>
      ${meter()}
      ${score >= 90 && score < 100 ? `<p class="bs-zone">⚡ Challenge Zone: prove you've got it</p>` : ""}
      <div class="question">
        <p class="q-text">${esc(q.q).replace(/\n/g, "<br>")}</p>
        <div class="choices">${q.choices.map((c, k) => `<button class="choice" data-k="${k}"><span class="letter">${"ABCD"[k]}</span><span>${esc(c)}</span></button>`).join("")}</div>
        <div id="feedback"></div>
      </div>`;
    root.querySelectorAll(".choice").forEach((b) => (b.onclick = () => choose(Number(b.dataset.k))));
  };

  const choose = (k) => {
    const ok = k === q.a;
    answered++;
    const before = score;
    score = ok ? Math.min(100, score + gain(score)) : Math.max(0, score - loss(score));
    streak = ok ? streak + 1 : 0;
    recordAnswer({ ...q, topicId: q.topicId || t.id }, k);
    root.querySelectorAll(".choice").forEach((b, i) => {
      b.disabled = true;
      if (i === q.a) b.classList.add("right");
      else if (i === k) b.classList.add("wrong");
    });
    const rec = (state.boroscore ||= {});
    rec[t.id] = { best: Math.max(best(t.id), score), at: Date.now() };
    celebrateBadges(addXp(ok ? 2 : 0));
    save();
    animate(before, score);
    if (score >= 100) return setTimeout(mastered, 700);
    const fb = root.querySelector("#feedback");
    if (ok) {
      fb.innerHTML = `<div class="feedback ok"><strong>✓ You got it!</strong> <span class="muted small">+${score - before}</span></div>`;
      setTimeout(ask, 900);
    } else {
      fb.innerHTML = `<div class="feedback no"><strong>Not quite.</strong> The answer is <strong>${esc(q.choices[q.a])}</strong>.${q.exp ? `<p class="small">${esc(q.exp)}</p>` : ""}
        <div class="btn-row"><button class="btn" id="got">Got it, next</button><button class="btn ghost" id="why">Ask Boro why</button></div></div>`;
      fb.querySelector("#got").onclick = ask;
      fb.querySelector("#why").onclick = () => askBoro({ ...q, topicId: q.topicId || t.id }, k);
    }
  };

  // Counts the number up/down so the change feels real.
  const animate = (from, to) => {
    const el = root.querySelector("#bsn");
    const fill = root.querySelector(".bs-meter .bar-fill");
    if (fill) fill.style.width = `${to}%`;
    root.querySelector(".bs-meter")?.classList.toggle("hot", to >= 90);
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / 450);
      if (el) el.textContent = Math.round(from + (to - from) * p);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const mastered = () => {
    confetti(160);
    celebrateBadges(addXp(40));
    toast("+40 XP for mastering a skill", { emoji: "🏆" });
    root.innerHTML = `<div class="empty"><div class="big-emoji">🏆</div><h2>BoroScore 100!</h2><p>You mastered <strong>${esc(t.name)}</strong> in ${answered} questions and ${fmt(Date.now() - started)}.</p>
      <div class="btn-row"><a class="btn" href="#/boroscore?s=${t.subject}">Next skill</a><button class="btn ghost" id="again">Go again</button></div></div>`;
    root.querySelector("#again").onclick = () => ((score = 0), (answered = 0), (streak = 0), ask());
  };

  clock = setInterval(() => {
    const el = root.querySelector("#bst");
    if (el) el.textContent = fmt(Date.now() - started);
  }, 1000);
  ask();
  return () => clearInterval(clock);
}

const fmt = (ms) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
