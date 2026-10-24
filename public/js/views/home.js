import { state, levelProgress, levelName, xpToday, dueCount, todayKey, mastery, isPremium } from "../store.js";
import { esc } from "../ui.js";
import { icon } from "../icons.js";
import { exams, getExam, getTopic, examTopicIds, subjects, topics } from "../content.js";
import { user } from "../account.js";

const BORO_COLORS = { Manhattan: "#6d4aff", Brooklyn: "#ff4f8b", Queens: "#12a150", "The Bronx": "#ff8a00", "Staten Island": "#0ea5e9" };

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Up late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function home(root) {
  const p = state.profile;
  const u = user();
  const lp = levelProgress();
  const goalPct = Math.min(100, Math.round((xpToday() / state.goal.daily) * 100));
  const exam = getExam(p.exam);
  const daily = state.daily[todayKey()];
  const due = dueCount();
  const today = todayKey();
  const tasks = (state.planner.items || []).filter((t) => todayKey(new Date(t.due)) === today);
  const done = tasks.filter((t) => t.done).length;
  const recent = Object.entries(state.topics)
    .sort((a, b) => b[1].last - a[1].last)
    .slice(0, 3)
    .map(([id]) => getTopic(id))
    .filter(Boolean);
  // Weakest topics for your test = what to study next.
  const focus = exam
    ? examTopicIds(exam).map(getTopic).filter(Boolean).sort((a, b) => (mastery(a.id) ?? -1) - (mastery(b.id) ?? -1)).slice(0, 5)
    : topics.filter((t) => t.grades.includes(Number(p.grade))).slice(0, 5);

  root.innerHTML = `
  <div class="hello">
    <div class="avatar-lg">${u?.picture ? `<img src="${esc(u.picture)}" alt="" referrerpolicy="no-referrer">` : esc(p.avatar)}</div>
    <div class="grow"><p class="muted small">${greeting()} 👋</p><h1>${esc(p.name || u?.name || "Hey there")}</h1></div>
  </div>

  <a class="card" href="#/planner">
    <div class="today-head"><strong>Today</strong><span class="small muted">${tasks.length ? `${tasks.length - done} left` : "Nothing due"}</span></div>
    <div class="today">
      <div class="today-cell"><div class="v">${tasks.length - done}</div><div class="l">To do</div></div>
      <div class="today-cell"><div class="v">${done}</div><div class="l">Done</div></div>
      <div class="today-cell"><div class="v">${tasks.length ? `${Math.round((done / tasks.length) * 100)}%` : "—"}</div><div class="l">Progress</div></div>
    </div>
    <div class="goal"><div class="goal-label"><span>Daily goal · Lv ${lp.lv} ${esc(levelName(lp.lv))}</span><span>${xpToday()} / ${state.goal.daily} XP</span></div><div class="bar"><div class="bar-fill" style="width:${goalPct}%"></div></div></div>
  </a>

  <a class="card daily ${daily ? "done" : ""}" href="#/daily">
    <div class="daily-emoji">${daily ? "✅" : "⚡"}</div>
    <div class="grow">
      <h2>Daily Brain Blast</h2>
      <p>${daily ? `You got ${daily.score}/5. Send it to a friend 👀` : `5 questions · same for everyone today${exam ? ` · ${esc(exam.name)}` : ""} · +50 XP`}</p>
    </div>
    <span class="chev">${icon("chevron")}</span>
  </a>

  <nav class="quick" aria-label="Quick actions">
    <a href="#/solve" style="--accent:linear-gradient(135deg,#6d4aff,#ff4f8b)"><span class="q-ic">${icon("camera", 26)}</span><span>Solve</span></a>
    <a href="#/cheats" style="--accent:#172043"><span class="q-ic">${icon("game", 26)}</span><span>Cheat Codes</span></a>
    <a href="#/battle" style="--accent:#ff4f8b"><span class="q-ic">${icon("sword", 26)}</span><span>Battle</span></a>
    <a href="#/blitz" style="--accent:#ff8a00"><span class="q-ic">${icon("bolt", 26)}</span><span>Blitz</span></a>
  </nav>

  ${due ? `<a class="card banner" href="#/review"><span class="tile-ic" style="--accent:#12a150">🃏</span><span class="grow"><strong>${due} flashcard${due === 1 ? "" : "s"} ready to review</strong><small>Spaced repetition: review right before you'd forget</small></span><span class="chev">${icon("chevron")}</span></a>` : ""}

  ${exam ? `
  <section class="section">
    <div class="section-head"><h2>${exam.emoji} ${esc(exam.name)}</h2><a href="#/exam/${exam.id}" class="link">Open</a></div>
    <div class="row-scroll">
      <a class="card pill-card accent" style="--accent:${exam.color}" href="#/test/${exam.id}"><strong>⏱️ Timed practice test</strong><span>${exam.mock.questions} Qs · ${exam.mock.minutes} min · get your score</span></a>
      ${focus.map((t) => { const m = mastery(t.id); return `<a class="card pill-card" href="#/topic/${t.id}"><strong>${esc(t.name)}</strong><span>${m === null ? "Not started" : `${m}% mastery`}</span></a>`; }).join("")}
    </div>
  </section>` : ""}

  <section class="section" id="wars">
    <div class="section-head"><h2>🏆 Borough Wars</h2><a href="#/leaderboard" class="link">Standings</a></div>
    <a class="card" href="#/leaderboard"><div class="boro-bars" id="wars-bars"><p class="small muted">Which borough studies hardest? Earn XP for yours this week.</p></div></a>
  </section>

  ${recent.length ? `<section class="section"><div class="section-head"><h2>Jump back in</h2></div><div class="list">${recent.map(topicRow).join("")}</div></section>` : ""}

  ${!exam ? `<section class="section"><div class="section-head"><h2>For ${p.grade ? `grade ${esc(p.grade)}` : "you"}</h2><a href="#/learn" class="link">All</a></div><div class="list">${focus.map(topicRow).join("")}</div></section>` : ""}

  <section class="section">
    <div class="section-head"><h2>Tests</h2><a href="#/exams" class="link">All</a></div>
    <div class="row-scroll">${exams.map((e) => `<a class="card exam-mini" style="--accent:${e.color}" href="#/exam/${e.id}"><span class="em">${e.emoji}</span><strong>${esc(e.name)}</strong></a>`).join("")}</div>
  </section>

  ${!u ? `<a class="card banner" href="#/login"><span class="tile-ic">${icon("user")}</span><span class="grow"><strong>Save your progress</strong><small>Make a free account with Google or email</small></span><span class="chev">${icon("chevron")}</span></a>` : ""}
  ${isPremium() ? "" : `<a class="card banner premium-banner" href="#/premium"><span class="tile-ic" style="--accent:#ffb648">${icon("crown")}</span><span class="grow"><strong>Go Premium</strong><small>Solve any homework, every Cheat Code, 5× more Boro</small></span><span class="chev">${icon("chevron")}</span></a>`}`;

  // Borough Wars standings load in the background.
  fetch("api/leaderboard", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((lb) => {
      const box = root.querySelector("#wars-bars");
      if (!lb || !box) return;
      const max = Math.max(1, ...lb.boroughs.map((b) => b.xp));
      box.innerHTML = lb.boroughs.map((b) => `<div class="boro-bar" style="--accent:${BORO_COLORS[b.name]}"><span>${esc(b.name)}</span><div class="bar"><div class="bar-fill" style="width:${Math.max(3, (b.xp / max) * 100)}%"></div></div><span>${b.xp.toLocaleString()}</span></div>`).join("");
    })
    .catch(() => {});
}

export { BORO_COLORS };

export function topicRow(t) {
  const m = mastery(t.id);
  const color = subjects.find((s) => s.id === t.subject).color;
  return `<a class="row" href="#/topic/${t.id}">
    <span class="row-dot" style="--accent:${color}"></span>
    <span class="grow"><strong>${esc(t.name)}</strong><small>${esc(t.course)} · ${esc(t.unit)}</small></span>
    ${m === null ? `<span class="badge-new">new</span>` : `<span class="ring" style="--p:${m};--accent:${color}">${m}%</span>`}
  </a>`;
}
