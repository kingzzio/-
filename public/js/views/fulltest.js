// Full-length practice tests: every section in order, each on its own timer, like test day.
// Ends with a section-by-section report (with the SSAT's −¼ guessing penalty where it applies).
import { state, save, addXp } from "../store.js";
import { esc, confetti, celebrateBadges, toast, aiAvailable, aiQuiz } from "../ui.js";
import { getExam, buildQuiz, examTopicIds } from "../content.js";
import { runQuiz } from "./study.js";

const fmt = (ms) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export default function fullTest(root, { id }) {
  const e = getExam(id);
  if (!e?.fullTest) {
    root.innerHTML = `<div class="empty"><h2>No full-length test for this exam yet</h2><a class="btn" href="#/exams">All tests</a></div>`;
    return;
  }
  let cleanup = null;
  const penalty = e.scoring?.penalty || 0;

  const intro = () => {
    const totalQ = e.fullTest.reduce((a, s) => a + s.questions, 0);
    const totalM = e.fullTest.reduce((a, s) => a + s.minutes, 0);
    root.innerHTML = `
      <a class="back" href="#/exam/${e.id}">← ${esc(e.name)}</a>
      <div class="battle-card">
        <div class="big-emoji">📝</div>
        <h1>${esc(e.name)} full practice test</h1>
        <p class="lead">${e.fullTest.length} timed sections, like the real thing.</p>
        <div class="list ft-sections">${e.fullTest.map((s, n) => `<div class="row"><span class="ft-n">${n + 1}</span><span class="grow"><strong>${esc(s.name)}</strong><small>${s.questions} questions · ${s.minutes} min</small></span></div>`).join("")}</div>
        <ul class="bullets left">
          <li>${penalty ? `Scoring like the real ${esc(e.name)}: +1 right, −${penalty === 0.25 ? "¼" : penalty} wrong, 0 blank. Only guess if you can cut a choice.` : "No guessing penalty: answer every question, even with a guess."}</li>
          <li>The pace coach in the corner tells you if you're on track to finish.</li>
          <li>Short break screen between sections. Your report comes at the end.</li>
        </ul>
        <div class="btn-row wrap" style="justify-content:center">
          <button class="btn big" data-scale="1">Full length (${totalQ} Qs · ${Math.round(totalM)} min)</button>
          <button class="btn ghost" data-scale="0.5">Half length (${Math.round(totalQ / 2)} Qs · ${Math.round(totalM / 2)} min)</button>
        </div>
      </div>`;
    root.querySelectorAll("[data-scale]").forEach((b) => (b.onclick = () => start(Number(b.dataset.scale))));
  };

  const start = (scale) => {
    const results = [];
    const runSection = async (k) => {
      const sec = e.fullTest[k];
      const topics = sec.all ? examTopicIds(e) : e.sections[sec.from ?? k].topics;
      const n = Math.max(5, Math.round(sec.questions * scale));
      const minutes = Math.max(4, Math.round(sec.minutes * scale));
      const qs = await topUp(buildQuiz(topics, n), n, sec);
      cleanup = runQuiz(root, qs, {
        title: `${e.name} · ${sec.name} (${k + 1}/${e.fullTest.length})`,
        mode: "test",
        minutes: (minutes * qs.length) / n,
        silent: true,
        back: `#/exam/${e.id}`,
        onFinish: (r) => {
          results.push({ ...r, name: sec.name, from: sec.all ? null : sec.from ?? k });
          if (k + 1 < e.fullTest.length) pause(k + 1, results, scale, runSection);
          else report(results, scale);
        },
      });
    };
    runSection(0);
  };

  // Small question banks (e.g. AP Psychology) get topped up with AI-written questions when AI is on.
  const topUp = async (qs, n, sec) => {
    if (qs.length >= n || !(await aiAvailable())) return qs;
    root.innerHTML = `<div class="empty"><div class="spinner"></div><p>Writing more ${esc(e.name)} ${esc(sec.name)} questions…</p></div>`;
    const extra = [];
    for (let tries = 0; tries < 3 && qs.length + extra.length < n; tries++) {
      try {
        extra.push(...(await aiQuiz({ topic: `${e.name}: ${sec.name}${tries ? " (new questions, different subtopics)" : ""}`, count: Math.min(10, n - qs.length - extra.length), grade: state.profile.grade })));
      } catch {
        break;
      }
    }
    return [...qs, ...extra];
  };

  const pause = (k, results, scale, runSection) => {
    const last = results[results.length - 1];
    const next = e.fullTest[k];
    root.innerHTML = `
      <div class="battle-card">
        <div class="big-emoji">☕</div>
        <h1>${esc(last.name)} done</h1>
        <p class="lead">Take a breath. Scores come at the end, like the real test.</p>
        <div class="card"><strong>Up next: ${esc(next.name)}</strong><p class="small muted">${Math.max(5, Math.round(next.questions * scale))} questions · ${Math.max(4, Math.round(next.minutes * scale))} minutes</p></div>
        <button class="btn big" id="go">Start ${esc(next.name)} →</button>
      </div>`;
    root.querySelector("#go").onclick = () => runSection(k);
  };

  const report = (results, scale) => {
    let right = 0, total = 0, wrong = 0, blank = 0;
    const rows = results.map((r, n) => {
      const w = r.answers.filter((a) => a.picked !== null && !a.ok).length;
      const b = r.answers.filter((a) => a.picked === null).length;
      right += r.correct;
      total += r.total;
      wrong += w;
      blank += b;
      const pct = r.total ? Math.round((r.correct / r.total) * 100) : 0;
      return { ...r, w, b, pct, n };
    });
    const raw = penalty ? right - penalty * wrong : right;
    const pct = total ? Math.round((right / total) * 100) : 0;
    const weakest = rows.length > 1 ? [...rows].sort((a, b) => a.pct - b.pct)[0] : null;
    state.tests.unshift({ exam: e.id, section: scale === 1 ? "Full test" : "Half test", correct: right, total, pct, at: Date.now() });
    state.tests = state.tests.slice(0, 50);
    celebrateBadges(addXp(60 + right * 2));
    save();
    if (pct >= 80) confetti(160);
    root.innerHTML = `
      <div class="results">
        <div class="big-emoji">${pct >= 90 ? "🏆" : pct >= 75 ? "🔥" : pct >= 60 ? "💪" : "🌱"}</div>
        <h1>${right}/${total}</h1>
        <p class="lead">${esc(e.name)} ${scale === 1 ? "full" : "half"}-length practice${penalty ? ` · raw score ${raw % 1 ? raw.toFixed(2) : raw} after the −¼ penalty` : ""}</p>
        <div class="stat-row">
          <div class="stat"><div class="stat-v">${pct}%</div><div class="stat-l">correct</div></div>
          <div class="stat"><div class="stat-v">${wrong}</div><div class="stat-l">wrong</div></div>
          <div class="stat"><div class="stat-v">${blank}</div><div class="stat-l">blank</div></div>
        </div>
        <div class="card ft-report">${rows
          .map(
            (r) => `<div class="ft-row"><span class="grow"><strong>${esc(r.name)}</strong><small>${r.correct}/${r.total} · ${fmt(r.timeMs)}${r.b ? ` · ${r.b} blank` : ""}</small></span>
            <div class="bar ft-bar"><div class="bar-fill" style="width:${r.pct}%;background:${r.pct >= 80 ? "var(--good)" : r.pct >= 60 ? "var(--brand-3)" : "var(--bad)"}"></div></div><strong class="ft-pct">${r.pct}%</strong></div>`,
          )
          .join("")}</div>
        ${!penalty && blank ? `<div class="card warn small">You left <strong>${blank}</strong> blank. On the ${esc(e.name)} there's no penalty for guessing, so those were free chances. Always bubble something.</div>` : ""}
        ${weakest ? `<div class="card"><strong>Biggest win available: ${esc(weakest.name)}</strong><p class="small muted">Your lowest section at ${weakest.pct}%. A focused drill there moves your total the most.</p><a class="btn" href="#/test/${e.id}${weakest.from === null ? "" : `?section=${weakest.from}`}">Drill ${esc(weakest.name)} →</a></div>` : ""}
        <p class="tiny muted">Practice score from BrainBoro questions, not an official scaled score or percentile.</p>
        <div class="btn-row wrap"><button class="btn ghost" id="again">Take another</button><a class="btn ghost" href="#/exam/${e.id}">Done</a></div>
      </div>`;
    root.querySelector("#again").onclick = intro;
    toast("Full test saved to your progress", { emoji: "📈" });
  };

  intro();
  return () => cleanup?.();
}
