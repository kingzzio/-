import { state, save, resetAll, levelProgress, levelName, BADGES, isPremium } from "../store.js";
import { esc, toast } from "../ui.js";
import { icon } from "../icons.js";
import { exams, getExam, getTopic, topics, subjects } from "../content.js";
import { user, isAdmin, logout, syncNow } from "../account.js";
import { BOROUGHS, loginCard } from "./auth.js";

export default function profile(root) {
  const p = state.profile;
  const u = user();
  const lp = levelProgress();
  const acc = state.stats.answered ? Math.round((state.stats.correct / state.stats.answered) * 100) : 0;
  const bySubject = subjects.map((s) => {
    const ts = topics.filter((t) => t.subject === s.id);
    const answered = ts.reduce((n, t) => n + (state.topics[t.id]?.answered || 0), 0);
    const correct = ts.reduce((n, t) => n + (state.topics[t.id]?.correct || 0), 0);
    return { s, answered, pct: answered ? Math.round((correct / answered) * 100) : 0 };
  });
  root.innerHTML = `
    <div class="profile-head">
      <div class="avatar-lg">${u?.picture ? `<img src="${esc(u.picture)}" alt="" referrerpolicy="no-referrer">` : esc(p.avatar)}</div>
      <div class="grow"><h1 style="margin:0">${esc(p.name || u?.name || "Student")}</h1>
        <p class="muted small" style="margin:2px 0 0">${u ? esc(u.email) : "Guest · progress saved on this device"}</p>
        <p style="margin:6px 0 0">${u?.admin ? `<span class="pill-premium pill-admin">${icon("shield", 12)} Admin</span> ` : ""}${isPremium() ? `<span class="pill-premium">👑 Premium</span>` : ""}</p></div>
    </div>
    <div class="card" style="margin-top:14px">
      <div class="goal" style="margin:0"><div class="goal-label"><span>Level ${lp.lv} · ${esc(levelName(lp.lv))}</span><span>${lp.toNext} XP to next</span></div><div class="bar"><div class="bar-fill" style="width:${lp.pct}%"></div></div></div>
      <div class="stat-row">
        <div class="stat"><div class="stat-v">🔥 ${state.streak.best}</div><div class="stat-l">best streak</div></div>
        <div class="stat"><div class="stat-v">${state.stats.answered}</div><div class="stat-l">answered</div></div>
        <div class="stat"><div class="stat-v">${acc}%</div><div class="stat-l">accuracy</div></div>
      </div>
    </div>
    ${u ? "" : loginCard("Save your progress & join Borough Wars", "me")}
    <div class="list" style="margin-top:14px">
      ${isAdmin() ? `<a class="row" href="#/admin"><span class="tile-ic" style="--accent:#13111f">${icon("shield")}</span><span class="grow"><strong>Admin dashboard</strong><small>Users, Premium, codes</small></span><span class="chev">${icon("chevron")}</span></a>` : ""}
      <a class="row" href="#/premium"><span class="tile-ic" style="--accent:#ffb648">${icon("crown")}</span><span class="grow"><strong>${isPremium() ? "Premium" : "Go Premium"}</strong><small>${isPremium() ? (u?.admin ? "All features unlocked (admin)" : "Thanks for the support!") : "Solve, Cheat Codes, 5× Boro"}</small></span><span class="chev">${icon("chevron")}</span></a>
      <a class="row" href="#/leaderboard"><span class="tile-ic" style="--accent:#ff4f8b">${icon("trophy")}</span><span class="grow"><strong>Borough Wars</strong><small>${u?.borough ? `Repping ${esc(u.borough)}` : "Pick your borough"}</small></span><span class="chev">${icon("chevron")}</span></a>
      <a class="row" href="#/connect"><span class="tile-ic" style="--accent:#12a150">${icon("link")}</span><span class="grow"><strong>School connections</strong><small>${(state.planner.connections || []).length ? (state.planner.connections || []).map((c) => esc(c.label)).join(", ") : "Google Classroom, Canvas & more"}</small></span><span class="chev">${icon("chevron")}</span></a>
    </div>

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
        ${u ? `<label class="field"><span>Borough</span><select id="boro"><option value="">—</option>${BOROUGHS.map((b) => `<option ${u.borough === b ? "selected" : ""}>${esc(b)}</option>`).join("")}</select></label>` : ""}
        <label class="field"><span>My test</span><select id="exam"><option value="">General study</option>${exams.map((e) => `<option value="${e.id}" ${p.exam === e.id ? "selected" : ""}>${esc(e.name)}</option>`).join("")}</select></label>
        <label class="field"><span>Daily goal</span><select id="goal">${[30, 50, 100, 200].map((g) => `<option value="${g}" ${state.goal.daily === g ? "selected" : ""}>${g} XP${g === 30 ? " (chill)" : g === 50 ? " (regular)" : g === 100 ? " (serious)" : " (beast mode)"}</option>`).join("")}</select></label>
        <label class="field"><span>Theme</span><select id="theme"><option value="">Match my device</option><option value="light" ${state.theme === "light" ? "selected" : ""}>Light</option><option value="dark" ${state.theme === "dark" ? "selected" : ""}>Dark</option></select></label>
        <div class="btn-row wrap">
          <button class="btn" id="save">Save</button>
          <button class="btn ghost" id="export">⬇️ Back up progress</button>
          <label class="btn ghost">⬆️ Restore<input type="file" id="import" accept="application/json" hidden></label>
          ${u ? `<button class="btn ghost" id="logout">${icon("logout", 18)} Log out</button>` : ""}
          <button class="btn danger" id="reset">Reset everything</button>
        </div>
        <p class="tiny muted">${u ? "Your progress syncs to your account automatically." : "Your progress is saved on this device only. Make an account to keep it on every device."}</p>
      </div>
    </section>`;

  root.querySelector("#save").onclick = () => {
    p.name = root.querySelector("#name").value.trim();
    p.grade = root.querySelector("#grade").value;
    p.exam = root.querySelector("#exam").value;
    state.goal.daily = Number(root.querySelector("#goal").value);
    state.theme = root.querySelector("#theme").value;
    save();
    if (u) syncNow({ name: p.name || undefined, borough: root.querySelector("#boro")?.value || undefined });
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
  root.querySelector("#logout")?.addEventListener("click", async () => {
    await logout();
    toast("Logged out", { emoji: "👋" });
    profile(root);
  });
  root.querySelector("#reset").onclick = () => {
    if (confirm("Erase ALL progress, XP, streaks and badges on this device?")) {
      resetAll();
      window.dispatchEvent(new Event("brainboro:rerender"));
    }
  };
}
