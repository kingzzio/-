import { state, save, mastery } from "../store.js";
import { esc } from "../ui.js";
import { exams, getExam, getTopic, buildQuiz, examTopicIds } from "../content.js";
import { runQuiz } from "./study.js";
import { topicRow } from "./home.js";
import { resourceCard } from "./resources.js";
import { resourcesFor } from "../data/resources.js";

const groups = [
  ["High school admissions", ["shsat", "tachs"]],
  ["Math Regents", ["regents-alg1", "regents-geo", "regents-alg2"]],
  ["Science Regents", ["regents-bio", "regents-es", "regents-chem", "regents-phys"]],
  ["ELA & Social Studies Regents", ["regents-ela", "regents-global", "regents-us"]],
  ["College", ["sat"]],
];

export function examList(root) {
  root.innerHTML = `
    <h1 class="page-title">Tests</h1>
    <p class="lead">Pick your test for timed practice, section drills and strategy tips.</p>
    ${groups
      .map(
        ([name, ids]) => `<section class="section"><div class="section-head"><h2>${name}</h2></div><div class="list">${ids
          .map(getExam)
          .map((e) => {
            const ids2 = examTopicIds(e);
            const m = ids2.map(mastery).filter((x) => x !== null);
            const avg = m.length ? Math.round(m.reduce((a, b) => a + b, 0) / ids2.length) : null;
            return `<a class="row exam-row" href="#/exam/${e.id}" style="--accent:${e.color}"><span class="em">${e.emoji}</span><span class="grow"><strong>${esc(e.name)}${state.profile.exam === e.id ? ` <span class="badge-new">your test</span>` : ""}</strong><small>${esc(e.full)}</small></span>${avg === null ? `<span class="chev">›</span>` : `<span class="ring" style="--p:${avg}">${avg}%</span>`}</a>`;
          })
          .join("")}</div></section>`,
      )
      .join("")}`;
}

export function examPage(root, { id }) {
  const e = getExam(id);
  if (!e) {
    root.innerHTML = `<div class="empty"><h2>Test not found</h2><a class="btn" href="#/exams">All tests</a></div>`;
    return;
  }
  const best = state.tests.filter((t) => t.exam === e.id).sort((a, b) => b.pct - a.pct)[0];
  root.innerHTML = `
    <a class="back" href="#/exams">← Tests</a>
    <section class="topic-hero" style="--accent:${e.color}">
      <span class="eyebrow">${e.emoji} ${esc(e.full)}</span>
      <h1>${esc(e.name)}</h1>
      <p>${esc(e.who)}</p>
      <div class="btn-row wrap">
        <a class="btn" href="#/test/${e.id}">⏱️ Timed practice test (${e.mock.questions} Qs, ${e.mock.minutes} min)</a>
        ${state.profile.exam === e.id ? `<span class="tag">⭐ Your test</span>` : `<button class="btn ghost" id="set">⭐ Make this my test</button>`}
      </div>
      ${best ? `<p class="small">Best practice score: <strong>${best.pct}%</strong> (${best.correct}/${best.total})</p>` : ""}
    </section>

    <div class="grid-2">
      <a class="card tile" href="#/battle?e=${e.id}"><div class="tile-emoji">🥊</div><h3>Battle a friend</h3><p>10 ${esc(e.name)} questions</p></a>
      <a class="card tile" href="#/tutor?exam=${e.id}"><div class="tile-emoji">🤖</div><h3>Ask Boro</h3><p>Strategy & explanations</p></a>
    </div>

    ${e.sections
      .map(
        (s, n) => `<section class="section">
        <div class="section-head"><h2>${esc(s.name)}</h2><a class="link" href="#/test/${e.id}?section=${n}">Drill this section →</a></div>
        <div class="list">${s.topics.map(getTopic).filter(Boolean).map(topicRow).join("")}</div>
      </section>`,
      )
      .join("")}

    <section class="section"><div class="section-head"><h2>📋 Format</h2></div><ul class="bullets">${e.format.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></section>
    <section class="section"><div class="section-head"><h2>💡 Strategy tips</h2></div><ul class="bullets">${e.tips.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></section>
    ${resourcesFor({ exam: e.id }).length ? `<section class="section"><div class="section-head"><h2>📂 Free official practice</h2><a class="link" href="#/resources?exam=${e.id}">All →</a></div><div class="list">${resourcesFor({ exam: e.id }).map(resourceCard).join("")}</div></section>` : ""}
    ${e.schools ? `<section class="section"><div class="section-head"><h2>🏫 Schools</h2></div><ul class="bullets">${e.schools.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></section>` : ""}
    <p class="small muted">Formats and dates change — always confirm with the official source: <a href="${e.official.url}" target="_blank" rel="noopener">${esc(e.official.label)} ↗</a></p>`;
  root.querySelector("#set")?.addEventListener("click", () => {
    state.profile.exam = e.id;
    save();
    examPage(root, { id });
  });
}

export function testRoute(root, { id }, query) {
  const e = getExam(id);
  if (!e) return;
  const section = query.section !== undefined ? e.sections[Number(query.section)] : null;
  const ids = section ? section.topics : examTopicIds(e);
  const n = section ? Math.min(15, e.mock.questions) : e.mock.questions;
  const minutes = section ? Math.max(10, Math.round((e.mock.minutes * n) / e.mock.questions)) : e.mock.minutes;
  const title = `${e.name}${section ? ` • ${section.name}` : " practice test"}`;

  root.innerHTML = `
    <a class="back" href="#/exam/${e.id}">← ${esc(e.name)}</a>
    <div class="battle-card">
      <div class="big-emoji">⏱️</div>
      <h1>${esc(title)}</h1>
      <p class="lead">${n} questions • ${minutes} minutes</p>
      <ul class="bullets left">
        <li>No hints or answers until the end — just like the real thing.</li>
        <li>You can skip and keep moving. ${e.id === "shsat" ? "No calculator!" : ""}</li>
        <li>Keys: <kbd>1</kbd>–<kbd>4</kbd> to choose, <kbd>Enter</kbd> for next.</li>
      </ul>
      <button class="btn big" id="go">Start test</button>
    </div>`;
  let cleanup = null;
  root.querySelector("#go").onclick = () => {
    cleanup = runQuiz(root, buildQuiz(ids, n), {
      title,
      mode: "test",
      minutes,
      showTopic: true,
      back: `#/exam/${e.id}`,
      onFinish: (r, extra) => {
        const pct = Math.round((r.correct / r.total) * 100);
        state.tests.unshift({ exam: e.id, section: section?.name || "", correct: r.correct, total: r.total, pct, at: Date.now() });
        state.tests = state.tests.slice(0, 50);
        save();
        // Per-topic breakdown shows where to study next.
        const by = new Map();
        for (const a of r.answers) {
          const t = by.get(a.q.topicId) || { n: 0, ok: 0 };
          t.n++;
          if (a.ok) t.ok++;
          by.set(a.q.topicId, t);
        }
        const weak = [...by].filter(([, v]) => v.ok < v.n).sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n).slice(0, 4);
        extra.innerHTML = weak.length
          ? `<div class="card"><h3>Study these next</h3><div class="list">${weak.map(([tid, v]) => { const t = getTopic(tid); return t ? `<a class="row" href="#/topic/${t.id}"><span class="grow"><strong>${esc(t.name)}</strong><small>${v.ok}/${v.n} correct</small></span><span class="chev">›</span></a>` : ""; }).join("")}</div></div>`
          : "";
      },
    });
  };
  return () => cleanup?.();
}
