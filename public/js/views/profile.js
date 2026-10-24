import { state, save, resetAll, levelProgress, levelName, BADGES } from "../store.js";
import { esc, toast } from "../ui.js";
import { exams, getExam, getTopic, topics, subjects } from "../content.js";

export default function profile(root) {
  const p = state.profile;
  const lp = levelProgress();
  const acc = state.stats.answered ? Math.round((state.stats.correct / state.stats.answered) * 100) : 0;
  const bySubject = subjects.map((s) => {
    const ts = topics.filter((t) => t.subject === s.id);
    const answered = ts.reduce((n, t) => n + (state.topics[t.id]?.answered || 0), 0);
    const correct = ts.reduce((n, t) => n + (state.topics[t.id]?.correct || 0), 0);
    return { s, answered, pct: answered ? Math.round((correct / answered) * 100) : 0 };
  });
  root.innerHTML = `
    <section class="hero">
      <div class="hero-top">
        <div class="avatar-lg">${esc(p.avatar)}</div>
        <div class="grow"><h1>${esc(p.name || "Student")}</h1><p class="muted small">${p.grade ? `Grade ${esc(p.grade)} • ` : ""}${esc(getExam(p.exam)?.name || "General study")}</p></div>
      </div>
      <div class="goal">
        <div class="goal-label"><span>Level ${lp.lv} · ${esc(levelName(lp.lv))}</span><span>${lp.toNext} XP to next</span></div>
        <div class="bar"><div class="bar-fill" style="width:${lp.pct}%"></div></div>
      </div>
      <div class="stat-row">
        <div class="stat"><div class="stat-v">🔥 ${state.streak.best}</div><div class="stat-l">best streak</div></div>
        <div class="stat"><div class="stat-v">${state.stats.answered}</div><div class="stat-l">answered</div></div>
        <div class="stat"><div class="stat-v">${acc}%</div><div class="stat-l">accuracy</div></div>
      </div>
    </section>

    <section class="section">
      <div class="section-head"><h2>Badges</h2><span class="muted small">${state.badges.length}/${BADGES.length}</span></div>
      <div class="badges">${BADGES.map((b) => `<div class="badge ${state.badges.includes(b.id) ? "on" : ""}" title="${esc(b.desc)}"><span>${b.emoji}</span><strong>${esc(b.name)}</strong><small>${esc(b.desc)}</small></div>`).join("")}</div>
    </section>

    <section class="section">
      <div class="section-head"><h2>By subject</h2></div>
      ${bySubject.map(({ s, answered, pct }) => `<div class="subj-bar"><span>${s.emoji} ${s.name}</span><div class="bar grow"><div class="bar-fill" style="width:${pct}%;background:${s.color}"></div></div><span class="small muted">${answered ? `${pct}%` : "—"}</span></div>`).join("")}
    </section>

    <section class="section">
      <div class="section-head"><h2>Mistake notebook</h2>${state.mistakes.length ? `<a class="link" href="#/mistakes">Redo them →</a>` : ""}</div>
      ${state.mistakes.length ? `<div class="list">${state.mistakes.slice(0, 5).map((m) => `<div class="row"><span class="grow"><strong>${esc(m.q.split("\n")[0].slice(0, 90))}</strong><small>${esc(getTopic(m.topicId)?.name || "")} • answer: ${esc(m.choices[m.a])}</small></span></div>`).join("")}</div>` : `<p class="muted small">Missed questions land here so you can redo them.</p>`}
    </section>

    ${state.tests.length ? `<section class="section"><div class="section-head"><h2>Practice tests</h2></div><div class="list">${state.tests.slice(0, 6).map((t) => `<div class="row"><span class="grow"><strong>${esc(getExam(t.exam)?.name || t.exam)}${t.section ? ` • ${esc(t.section)}` : ""}</strong><small>${new Date(t.at).toLocaleDateString()}</small></span><span class="ring" style="--p:${t.pct}">${t.pct}%</span></div>`).join("")}</div></section>` : ""}

    <section class="section">
      <div class="section-head"><h2>Settings</h2></div>
      <div class="card settings">
        <label class="field"><span>Name</span><input id="name" maxlength="20" value="${esc(p.name)}"></label>
        <label class="field"><span>Grade</span><select id="grade"><option value="">—</option>${["6", "7", "8", "9", "10", "11", "12"].map((g) => `<option ${p.grade === g ? "selected" : ""}>${g}</option>`).join("")}</select></label>
        <label class="field"><span>My test</span><select id="exam"><option value="">General study</option>${exams.map((e) => `<option value="${e.id}" ${p.exam === e.id ? "selected" : ""}>${esc(e.name)}</option>`).join("")}</select></label>
        <label class="field"><span>Daily goal</span><select id="goal">${[30, 50, 100, 200].map((g) => `<option value="${g}" ${state.goal.daily === g ? "selected" : ""}>${g} XP${g === 30 ? " (chill)" : g === 50 ? " (regular)" : g === 100 ? " (serious)" : " (beast mode)"}</option>`).join("")}</select></label>
        <label class="field"><span>Theme</span><select id="theme"><option value="">Match my device</option><option value="light" ${state.theme === "light" ? "selected" : ""}>Light</option><option value="dark" ${state.theme === "dark" ? "selected" : ""}>Dark</option></select></label>
        <div class="btn-row wrap">
          <button class="btn" id="save">Save</button>
          <button class="btn ghost" id="export">⬇️ Back up progress</button>
          <label class="btn ghost">⬆️ Restore<input type="file" id="import" accept="application/json" hidden></label>
          <button class="btn danger" id="reset">Reset everything</button>
        </div>
        <p class="tiny muted">Your progress is saved on this device only — no account, no tracking. Back it up to move it to another device.</p>
      </div>
    </section>`;

  root.querySelector("#save").onclick = () => {
    p.name = root.querySelector("#name").value.trim();
    p.grade = root.querySelector("#grade").value;
    p.exam = root.querySelector("#exam").value;
    state.goal.daily = Number(root.querySelector("#goal").value);
    state.theme = root.querySelector("#theme").value;
    save();
    window.dispatchEvent(new Event("brainboro:theme"));
    toast("Saved!", { emoji: "✅" });
    profile(root);
  };
  root.querySelector("#export").onclick = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `brainboro-progress-${new Date().toISOString().slice(0, 10)}.json` });
    a.click();
    URL.revokeObjectURL(a.href);
  };
  root.querySelector("#import").onchange = async (e) => {
    try {
      const data = JSON.parse(await e.target.files[0].text());
      if (typeof data !== "object" || !data.profile) throw new Error("bad file");
      resetAll();
      Object.assign(state, data);
      save();
      toast("Progress restored!", { emoji: "✅" });
      window.dispatchEvent(new Event("brainboro:rerender"));
    } catch {
      toast("That doesn't look like a BrainBoro backup.", { emoji: "⚠️" });
    }
  };
  root.querySelector("#reset").onclick = () => {
    if (confirm("Erase ALL progress, XP, streaks and badges on this device?")) {
      resetAll();
      window.dispatchEvent(new Event("brainboro:rerender"));
    }
  };
}
