// Progress pages: Stats (charts + heatmap), BrainBoro Wrapped (shareable monthly recap card),
// Badges gallery, and a printable progress report for parents/teachers.
import { state, BADGES, level, levelName, mastery, todayKey } from "../store.js";
import { esc, share } from "../ui.js";
import { icon } from "../icons.js";
import { topics, getTopic, subjects } from "../content.js";

const DAY = 86400000;
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const dayRows = (n) => Array.from({ length: n }, (_, i) => {
  const d = new Date(Date.now() - (n - 1 - i) * DAY);
  const k = todayKey(d);
  return { k, d, ...(state.history[k] || { xp: 0, answered: 0, correct: 0 }) };
});

function topicStats() {
  return topics
    .map((t) => ({ t, s: state.topics[t.id], m: mastery(t.id) }))
    .filter((x) => x.s?.answered >= 3);
}

export function statsView(root) {
  const days = dayRows(84);
  const week = days.slice(-7);
  const maxXp = Math.max(10, ...week.map((d) => d.xp));
  const ts = topicStats();
  const best = [...ts].sort((a, b) => b.m - a.m).slice(0, 4);
  const worst = [...ts].sort((a, b) => a.m - b.m).slice(0, 4);
  const bySubject = subjects.map((s) => {
    const list = ts.filter((x) => x.t.subject === s.id);
    const a = list.reduce((n, x) => n + x.s.answered, 0), c = list.reduce((n, x) => n + x.s.correct, 0);
    return { s, a, p: pct(c, a) };
  });
  const tests = state.tests.slice(0, 12).reverse();
  const lvl = level();
  root.innerHTML = `
    <a class="back" href="#/me">${icon("back", 18)} Me</a>
    <h1 class="page-title">📈 Your stats</h1>
    <div class="stat-grid">
      <div class="stat big"><div class="stat-v">${state.xp.toLocaleString()}</div><div class="stat-l">total XP · Lv ${lvl} ${levelName(lvl)}</div></div>
      <div class="stat"><div class="stat-v">${state.stats.answered.toLocaleString()}</div><div class="stat-l">questions</div></div>
      <div class="stat"><div class="stat-v">${pct(state.stats.correct, state.stats.answered)}%</div><div class="stat-l">accuracy</div></div>
      <div class="stat"><div class="stat-v">${state.streak.best}</div><div class="stat-l">best streak</div></div>
      <div class="stat"><div class="stat-v">${state.coins}</div><div class="stat-l">coins</div></div>
    </div>

    <section class="section"><div class="section-head"><h2>This week</h2><span class="muted small">${week.reduce((n, d) => n + d.xp, 0)} XP</span></div>
      <div class="card"><div class="bars7">${week.map((d) => `<div class="b7"><div class="b7-bar" style="height:${Math.max(4, (d.xp / maxXp) * 110)}px" title="${d.xp} XP"></div><span>${d.d.toLocaleDateString(undefined, { weekday: "narrow" })}</span></div>`).join("")}</div></div>
    </section>

    <section class="section"><div class="section-head"><h2>Last 12 weeks</h2></div>
      <div class="card heat-wrap"><div class="heat">${days.map((d) => `<i class="h${d.xp === 0 ? 0 : d.xp < 30 ? 1 : d.xp < 80 ? 2 : d.xp < 150 ? 3 : 4}" title="${d.k}: ${d.xp} XP"></i>`).join("")}</div>
      <p class="tiny muted" style="margin:8px 0 0">Each square is a day. Darker = more XP.</p></div>
    </section>

    <section class="section"><div class="section-head"><h2>By subject</h2></div>
      <div class="card">${bySubject.map(({ s, a, p }) => `<div class="ft-row"><span class="grow"><strong>${s.emoji} ${esc(s.name)}</strong><small>${a} answered</small></span><div class="bar ft-bar"><div class="bar-fill" style="width:${a ? p : 0}%"></div></div><strong class="ft-pct">${a ? `${p}%` : "—"}</strong></div>`).join("")}</div>
    </section>

    ${tests.length > 1 ? `<section class="section"><div class="section-head"><h2>Practice test scores</h2></div><div class="card">${sparkline(tests.map((t) => t.pct))}<p class="tiny muted" style="margin:6px 0 0">Your last ${tests.length} timed tests, oldest to newest.</p></div></section>` : ""}

    ${ts.length ? `<div class="grid-2">
      <div class="card"><h3>💪 Strongest</h3>${best.map((x) => `<a class="mini-row" href="#/topic/${x.t.id}"><span>${esc(x.t.name)}</span><b>${x.m}%</b></a>`).join("")}</div>
      <div class="card"><h3>🎯 Work on</h3>${worst.map((x) => `<a class="mini-row" href="#/topic/${x.t.id}"><span>${esc(x.t.name)}</span><b>${x.m}%</b></a>`).join("")}</div>
    </div>` : `<div class="card"><p class="muted">Answer a few questions in different topics and your strongest and weakest topics show up here.</p></div>`}

    <div class="btn-row wrap" style="margin-top:14px"><a class="btn" href="#/wrapped">🎁 My Wrapped</a><a class="btn ghost" href="#/badges">🏅 Badges</a><a class="btn ghost" href="#/report">🖨️ Progress report</a></div>`;
}

function sparkline(vals) {
  const w = 300, h = 80, max = 100;
  const pts = vals.map((v, i) => `${(i / Math.max(1, vals.length - 1)) * w},${h - (v / max) * (h - 8) - 4}`).join(" ");
  return `<svg viewBox="0 0 ${w} ${h}" class="spark" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="var(--brand)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>${vals.map((v, i) => `<circle cx="${(i / Math.max(1, vals.length - 1)) * w}" cy="${h - (v / max) * (h - 8) - 4}" r="4" fill="var(--brand)"/>`).join("")}</svg>`;
}

// ---------- Wrapped ----------
export function wrappedView(root) {
  const now = new Date();
  const monthDays = dayRows(now.getDate());
  const xp = monthDays.reduce((n, d) => n + d.xp, 0);
  const answered = monthDays.reduce((n, d) => n + d.answered, 0);
  const correct = monthDays.reduce((n, d) => n + d.correct, 0);
  const active = monthDays.filter((d) => d.xp > 0).length;
  const fav = topicStats().sort((a, b) => b.s.answered - a.s.answered)[0];
  const month = now.toLocaleDateString(undefined, { month: "long" });
  const data = { month, xp, answered, acc: pct(correct, answered), active, streak: state.streak.best, fav: fav?.t.name || "Getting started", name: state.profile.name || "Student", avatar: state.profile.avatar };
  root.innerHTML = `
    <a class="back" href="#/stats">${icon("back", 18)} Stats</a>
    <h1 class="page-title">🎁 Your ${esc(month)} Wrapped</h1>
    <canvas id="wc" width="1080" height="1920" class="wrapped-canvas"></canvas>
    <div class="btn-row wrap" style="justify-content:center"><button class="btn" id="sh">${icon("share", 18)} Share to story</button><button class="btn ghost" id="dl">Save image</button></div>`;
  const c = root.querySelector("#wc");
  drawWrapped(c, data);
  const blob = () => new Promise((r) => c.toBlob(r, "image/png"));
  root.querySelector("#dl").onclick = async () => {
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(await blob()), download: `brainboro-wrapped-${month}.png` });
    a.click();
  };
  root.querySelector("#sh").onclick = async () => {
    const file = new File([await blob()], "brainboro-wrapped.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) navigator.share({ files: [file], title: "My BrainBoro Wrapped" }).catch(() => {});
    else share({ title: "BrainBoro Wrapped", text: `My ${month} on BrainBoro: ${xp} XP, ${answered} questions, ${data.acc}% right 🧠🔥`, url: location.origin });
  };
}

function drawWrapped(c, d) {
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 1080, 1920);
  grad.addColorStop(0, "#2a1065");
  grad.addColorStop(0.55, "#6d4aff");
  grad.addColorStop(1, "#ff4f8b");
  g.fillStyle = grad;
  g.fillRect(0, 0, 1080, 1920);
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(255,255,255,${0.04 + (i % 5) * 0.015})`;
    g.beginPath();
    g.arc((i * 263) % 1080, (i * 419) % 1920, 20 + (i % 7) * 18, 0, Math.PI * 2);
    g.fill();
  }
  const font = (w, s) => `${w} ${s}px Inter, system-ui, sans-serif`;
  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.font = font(800, 64);
  g.fillText("🧠 BrainBoro", 540, 170);
  g.font = font(600, 46);
  g.globalAlpha = 0.85;
  g.fillText(`${d.month} Wrapped`, 540, 250);
  g.globalAlpha = 1;
  g.font = font(400, 150);
  g.fillText(d.avatar, 540, 470);
  g.font = font(800, 72);
  g.fillText(d.name, 540, 590);
  const tiles = [["XP earned", d.xp.toLocaleString()], ["Questions", d.answered.toLocaleString()], ["Accuracy", `${d.acc}%`], ["Days studied", d.active], ["Best streak", `${d.streak} 🔥`]];
  tiles.forEach(([l, v], i) => {
    const y = 700 + i * 190;
    g.fillStyle = "rgba(255,255,255,0.14)";
    roundRect(g, 120, y, 840, 160, 40);
    g.fill();
    g.fillStyle = "#fff";
    g.textAlign = "left";
    g.font = font(600, 44);
    g.fillText(l, 180, y + 95);
    g.textAlign = "right";
    g.font = font(800, 76);
    g.fillText(String(v), 900, y + 105);
  });
  g.textAlign = "center";
  g.font = font(600, 40);
  g.fillText("Most practiced:", 540, 1700);
  g.font = font(800, 52);
  g.fillText(d.fav.length > 30 ? `${d.fav.slice(0, 28)}…` : d.fav, 540, 1770);
  g.font = font(500, 34);
  g.globalAlpha = 0.8;
  g.fillText("Free test prep for NYC students", 540, 1860);
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// ---------- Badges ----------
export function badgesView(root) {
  const have = new Set(state.badges);
  root.innerHTML = `
    <a class="back" href="#/me">${icon("back", 18)} Me</a>
    <h1 class="page-title">🏅 Badges</h1>
    <p class="lead">${have.size} of ${BADGES.length} unlocked.</p>
    <div class="badge-grid">${BADGES.map((b) => `<div class="badge-tile ${have.has(b.id) ? "on" : ""}"><span class="badge-em">${have.has(b.id) ? b.emoji : "🔒"}</span><strong>${esc(b.name)}</strong><small>${esc(b.desc)}</small></div>`).join("")}</div>`;
}

// ---------- Printable report ----------
export function reportView(root) {
  const ts = topicStats().sort((a, b) => b.s.answered - a.s.answered).slice(0, 15);
  const days = dayRows(30);
  root.innerHTML = `
    <div class="no-print"><a class="back" href="#/stats">${icon("back", 18)} Stats</a></div>
    <div class="report-sheet">
      <h1>🧠 BrainBoro Progress Report</h1>
      <p><strong>${esc(state.profile.name || "Student")}</strong>${state.profile.grade ? ` · Grade ${esc(state.profile.grade)}` : ""} · ${new Date().toLocaleDateString()}</p>
      <table class="rep-table"><tr><th>Level</th><td>${level()} (${levelName()})</td><th>Total XP</th><td>${state.xp.toLocaleString()}</td></tr>
      <tr><th>Questions answered</th><td>${state.stats.answered}</td><th>Accuracy</th><td>${pct(state.stats.correct, state.stats.answered)}%</td></tr>
      <tr><th>Days studied (last 30)</th><td>${days.filter((d) => d.xp > 0).length}</td><th>Best streak</th><td>${state.streak.best} days</td></tr>
      <tr><th>Flashcards reviewed</th><td>${state.stats.cardsReviewed}</td><th>Practice tests</th><td>${state.tests.length}</td></tr></table>
      <h2>Topics</h2>
      ${ts.length ? `<table class="rep-table"><tr><th>Topic</th><th>Answered</th><th>Accuracy</th><th>Mastery</th></tr>${ts.map((x) => `<tr><td>${esc(x.t.name)}</td><td>${x.s.answered}</td><td>${pct(x.s.correct, x.s.answered)}%</td><td>${x.m}%</td></tr>`).join("")}</table>` : `<p>No topic practice yet.</p>`}
      ${state.tests.length ? `<h2>Recent practice tests</h2><table class="rep-table"><tr><th>Date</th><th>Test</th><th>Score</th></tr>${state.tests.slice(0, 8).map((t) => `<tr><td>${new Date(t.at).toLocaleDateString()}</td><td>${esc((getTopic(t.exam)?.name || t.exam).toUpperCase())} ${esc(t.section || "")}</td><td>${t.correct}/${t.total} (${t.pct}%)</td></tr>`).join("")}</table>` : ""}
      <p class="tiny muted">Practice results from BrainBoro, not official scores.</p>
    </div>
    <div class="btn-row no-print"><button class="btn" id="pr">🖨️ Print or save as PDF</button></div>`;
  root.querySelector("#pr").onclick = () => window.print();
}
