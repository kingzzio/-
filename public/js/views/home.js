import { state, levelProgress, levelName, xpToday, dueCount, todayKey, streakAlive, mastery } from "../store.js";
import { esc } from "../ui.js";
import { exams, getExam, getTopic, examTopicIds, subjects, topics } from "../content.js";

const greetings = ["Let's get that brain buzzing", "Small steps, big scores", "Future Stuy kid? Let's see", "Your streak misses you", "Time to level up"];

export default function home(root) {
  const p = state.profile;
  const lp = levelProgress();
  const goalPct = Math.min(100, Math.round((xpToday() / state.goal.daily) * 100));
  const exam = getExam(p.exam);
  const daily = state.daily[todayKey()];
  const due = dueCount();
  const recent = Object.entries(state.topics)
    .sort((a, b) => b[1].last - a[1].last)
    .slice(0, 3)
    .map(([id]) => getTopic(id))
    .filter(Boolean);
  // Weakest topics for your exam = what to study next.
  const focus = exam
    ? examTopicIds(exam)
        .map(getTopic)
        .filter(Boolean)
        .sort((a, b) => (mastery(a.id) ?? -1) - (mastery(b.id) ?? -1))
        .slice(0, 4)
    : topics.filter((t) => t.grades.includes(Number(p.grade))).slice(0, 4);

  root.innerHTML = `
  <section class="hero">
    <div class="hero-top">
      <div class="avatar-lg">${esc(p.avatar)}</div>
      <div>
        <p class="muted small">${esc(greetings[new Date().getDate() % greetings.length])}</p>
        <h1>Hey ${esc(p.name || "there")}!</h1>
      </div>
    </div>
    <div class="stat-row">
      <div class="stat"><div class="stat-v"><span class="${streakAlive() && state.streak.count ? "flame" : "flame off"}">🔥</span> ${streakAlive() ? state.streak.count : 0}</div><div class="stat-l">day streak</div></div>
      <div class="stat"><div class="stat-v">⚡ ${lp.lv}</div><div class="stat-l">${esc(levelName(lp.lv))}</div></div>
      <div class="stat"><div class="stat-v">💎 ${state.xp}</div><div class="stat-l">total XP</div></div>
    </div>
    <div class="goal">
      <div class="goal-label"><span>Daily goal</span><span>${xpToday()} / ${state.goal.daily} XP</span></div>
      <div class="bar"><div class="bar-fill" style="width:${goalPct}%"></div></div>
    </div>
  </section>

  <a class="card daily ${daily ? "done" : ""}" href="#/daily">
    <div class="daily-emoji">${daily ? "✅" : "⚡"}</div>
    <div class="grow">
      <h2>Daily Brain Blast</h2>
      <p>${daily ? `You scored ${daily.score}/5 today. Come back tomorrow — or challenge a friend!` : `5 questions • same for everyone today${exam ? ` • ${esc(exam.name)}` : ""} • +50 XP`}</p>
    </div>
    <span class="chev">›</span>
  </a>

  <div class="grid-2">
    <a class="card tile" href="#/review"><div class="tile-emoji">🃏</div><h3>Review cards</h3><p>${due ? `${due} card${due === 1 ? "" : "s"} due` : "All caught up!"}</p></a>
    <a class="card tile" href="#/battle"><div class="tile-emoji">🥊</div><h3>Brain Battle</h3><p>Challenge a friend</p></a>
    <a class="card tile" href="#/tutor"><div class="tile-emoji">🤖</div><h3>Ask Boro</h3><p>AI homework help</p></a>
    <a class="card tile" href="#/curriculum"><div class="tile-emoji">🗺️</div><h3>My curriculum</h3><p>Find your class units</p></a>
  </div>

  ${exam ? `
  <section class="section">
    <div class="section-head"><h2>${exam.emoji} ${esc(exam.name)} prep</h2><a href="#/exam/${exam.id}" class="link">Open →</a></div>
    <div class="row-scroll">
      <a class="card pill-card accent" style="--accent:${exam.color}" href="#/test/${exam.id}"><strong>⏱️ Timed practice test</strong><span>${exam.mock.questions} Qs • ${exam.mock.minutes} min</span></a>
      ${focus.map((t) => topicChip(t)).join("")}
    </div>
  </section>` : ""}

  ${recent.length ? `
  <section class="section">
    <div class="section-head"><h2>Jump back in</h2></div>
    <div class="list">${recent.map((t) => topicRow(t)).join("")}</div>
  </section>` : ""}

  ${!exam ? `
  <section class="section">
    <div class="section-head"><h2>For ${p.grade ? `grade ${esc(p.grade)}` : "you"}</h2><a href="#/explore" class="link">See all →</a></div>
    <div class="list">${focus.map((t) => topicRow(t)).join("")}</div>
  </section>` : ""}

  <section class="section">
    <div class="section-head"><h2>All tests</h2><a href="#/exams" class="link">See all →</a></div>
    <div class="row-scroll">${exams.map((e) => `<a class="card exam-mini" style="--accent:${e.color}" href="#/exam/${e.id}"><span class="em">${e.emoji}</span><strong>${esc(e.name)}</strong></a>`).join("")}</div>
  </section>

  <section class="section">
    <div class="section-head"><h2>Subjects</h2></div>
    <div class="grid-4">${subjects.map((s) => `<a class="card subj" style="--accent:${s.color}" href="#/explore?s=${s.id}"><span class="em">${s.emoji}</span>${s.name}</a>`).join("")}</div>
  </section>`;
}

export function topicRow(t) {
  const m = mastery(t.id);
  return `<a class="row" href="#/topic/${t.id}">
    <span class="row-dot" style="--accent:${subjects.find((s) => s.id === t.subject).color}"></span>
    <span class="grow"><strong>${esc(t.name)}</strong><small>${esc(t.course)} • ${esc(t.unit)}</small></span>
    ${m === null ? `<span class="badge-new">new</span>` : `<span class="ring" style="--p:${m}">${m}%</span>`}
  </a>`;
}

function topicChip(t) {
  const m = mastery(t.id);
  return `<a class="card pill-card" href="#/topic/${t.id}"><strong>${esc(t.name)}</strong><span>${m === null ? "Not started" : `${m}% mastery`}</span></a>`;
}
