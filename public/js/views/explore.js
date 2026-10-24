import { state, mastery, cardKnown } from "../store.js";
import { esc } from "../ui.js";
import { topics, subjects, getTopic, search, examsForTopic, subjectOf, cardId } from "../content.js";
import { topicRow } from "./home.js";

const GRADES = [6, 7, 8, 9, 10, 11, 12];

export function explore(root, _params, query) {
  const f = { s: query.s || "", g: query.g || "", q: query.q || "" };
  root.innerHTML = `
    <h1 class="page-title">Explore</h1>
    <div class="search"><span>🔎</span><input id="q" type="search" placeholder="Search: slope, theme, mitosis, Brown v. Board…" value="${esc(f.q)}" aria-label="Search topics"></div>
    <div class="chip-row" id="subj">${[{ id: "", name: "All", emoji: "✨" }, ...subjects].map((s) => `<button class="chip ${f.s === s.id ? "on" : ""}" data-s="${s.id}">${s.emoji} ${s.name}</button>`).join("")}</div>
    <div class="chip-row" id="grade"><button class="chip ${!f.g ? "on" : ""}" data-g="">All grades</button>${GRADES.map((g) => `<button class="chip ${f.g == g ? "on" : ""}" data-g="${g}">${g}th</button>`).join("")}</div>
    <a class="card banner" href="#/curriculum"><span class="em">🗺️</span><span class="grow"><strong>Find your class curriculum</strong><small>Eureka, Illustrative Math, Amplify, enVision & more → jump to your exact unit</small></span><span class="chev">›</span></a>
    <div id="results"></div>`;

  const results = root.querySelector("#results");
  const draw = () => {
    let list = f.q ? search(f.q) : topics;
    if (f.s) list = list.filter((t) => t.subject === f.s);
    if (f.g) list = list.filter((t) => t.grades.includes(Number(f.g)));
    if (!list.length) {
      results.innerHTML = `<div class="empty"><div class="big-emoji">🤔</div><p>No topics match. Try another word — or <a href="#/tutor">ask Boro</a>.</p></div>`;
      return;
    }
    if (f.q) {
      results.innerHTML = `<div class="list">${list.map(topicRow).join("")}</div>`;
      return;
    }
    const groups = new Map();
    for (const t of list) (groups.get(t.course) || groups.set(t.course, []).get(t.course)).push(t);
    results.innerHTML = [...groups]
      .map(([course, ts]) => `<section class="section"><div class="section-head"><h2>${esc(course)}</h2><span class="muted small">${ts.length} topics</span></div><div class="list">${ts.map(topicRow).join("")}</div></section>`)
      .join("");
  };
  const sync = () => history.replaceState(null, "", `#/explore?${new URLSearchParams(Object.entries(f).filter(([, v]) => v))}`);

  root.querySelector("#q").addEventListener("input", (e) => {
    f.q = e.target.value;
    sync();
    draw();
  });
  root.querySelectorAll("[data-s]").forEach((b) =>
    b.addEventListener("click", () => {
      f.s = b.dataset.s;
      root.querySelectorAll("[data-s]").forEach((x) => x.classList.toggle("on", x === b));
      sync();
      draw();
    }),
  );
  root.querySelectorAll("[data-g]").forEach((b) =>
    b.addEventListener("click", () => {
      f.g = b.dataset.g;
      root.querySelectorAll("[data-g]").forEach((x) => x.classList.toggle("on", x === b));
      sync();
      draw();
    }),
  );
  draw();
}

export function topicPage(root, { id }) {
  const t = getTopic(id);
  if (!t) {
    root.innerHTML = `<div class="empty"><h2>Topic not found</h2><a class="btn" href="#/explore">Explore</a></div>`;
    return;
  }
  const s = subjectOf(t.subject);
  const m = mastery(t.id);
  const known = t.cards.filter((_, i) => cardKnown(cardId(t.id, i))).length;
  const stats = state.topics[t.id];
  const related = examsForTopic(t.id);
  const siblings = topics.filter((x) => x.course === t.course && x.id !== t.id).slice(0, 5);

  root.innerHTML = `
    <a class="back" href="#/explore?s=${t.subject}">← ${esc(s.name)}</a>
    <section class="topic-hero" style="--accent:${s.color}">
      <span class="eyebrow">${s.emoji} ${esc(t.course)} • ${esc(t.unit)}</span>
      <h1>${esc(t.name)}</h1>
      <p>${esc(t.desc)}</p>
      <div class="chip-row">${related.map((e) => `<a class="tag" href="#/exam/${e.id}" style="--accent:${e.color}">${e.emoji} ${esc(e.name)}</a>`).join("")}</div>
      <div class="stat-row">
        <div class="stat"><div class="stat-v">${m === null ? "—" : `${m}%`}</div><div class="stat-l">mastery</div></div>
        <div class="stat"><div class="stat-v">${known}/${t.cards.length}</div><div class="stat-l">cards known</div></div>
        <div class="stat"><div class="stat-v">${stats ? stats.answered : 0}</div><div class="stat-l">answered</div></div>
      </div>
    </section>

    <div class="actions">
      <a class="action" href="#/flash/${t.id}"><span class="em">🃏</span><strong>Flashcards</strong><small>${t.cards.length} cards</small></a>
      <a class="action" href="#/quiz/${t.id}"><span class="em">✅</span><strong>Quiz</strong><small>10 questions</small></a>
      ${t.gen?.length ? `<a class="action" href="#/practice/${t.id}"><span class="em">♾️</span><strong>Unlimited practice</strong><small>Fresh problems every time</small></a>` : ""}
      <a class="action" href="#/quiz/${t.id}?ai=1"><span class="em">✨</span><strong>AI quiz</strong><small>Brand-new questions</small></a>
      <a class="action" href="#/battle?t=${t.id}"><span class="em">🥊</span><strong>Battle a friend</strong><small>Same questions, who wins?</small></a>
      <a class="action" href="#/tutor?topic=${encodeURIComponent(t.id)}"><span class="em">🤖</span><strong>Ask Boro</strong><small>Explain it to me</small></a>
    </div>

    <section class="section">
      <div class="section-head"><h2>Key ideas</h2></div>
      <div class="notes">${t.cards.map(([a, b]) => `<div class="note"><strong>${esc(a)}</strong><span>${esc(b)}</span></div>`).join("")}</div>
    </section>

    ${siblings.length ? `<section class="section"><div class="section-head"><h2>More in ${esc(t.course)}</h2></div><div class="list">${siblings.map(topicRow).join("")}</div></section>` : ""}`;
}
