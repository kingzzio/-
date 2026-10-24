// Essay Coach: plan (thesis options, outline, evidence) → write your draft → rubric feedback.
import { state, save, addXp } from "../store.js";
import { esc, toast, post, aiAvailable, celebrateBadges } from "../ui.js";
import { icon } from "../icons.js";

const KINDS = [
  ["argument", "Argument"],
  ["analysis", "Text analysis"],
  ["short", "Short response"],
  ["literary", "Literary essay"],
  ["dbq", "History DBQ"],
  ["research", "Research"],
  ["narrative", "Personal / application"],
];

export default function essay(root, _p, query) {
  const e = (state.essay ||= { kind: "argument", prompt: "", stance: "", sources: "", draft: "", plan: null, feedback: null });
  if (query.prompt) e.prompt = query.prompt;
  let tab = e.plan && !e.feedback ? "write" : e.feedback ? "feedback" : "plan";
  const persist = () => save();
  const words = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);

  const draw = () => {
    root.innerHTML = `
      <h1 class="page-title">Essay Coach</h1>
      <p class="lead">Plan it, write it in your own voice, and get graded on a rubric before your teacher does.</p>
      <div class="seg">${["plan", "write", "feedback"].map((t, i) => `<button class="${tab === t ? "on" : ""}" data-tab="${t}">${i + 1}. ${t === "plan" ? "Plan" : t === "write" ? "Write" : "Feedback"}</button>`).join("")}</div>
      <div id="body"></div>`;
    root.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => ((tab = b.dataset.tab), draw())));
    const body = root.querySelector("#body");
    if (tab === "plan") drawPlan(body);
    else if (tab === "write") drawWrite(body);
    else drawFeedback(body);
  };

  const drawPlan = (body) => {
    body.innerHTML = `
      <div class="field"><span>What kind of writing?</span><div class="chip-row">${KINDS.map(([k, n]) => `<button class="chip ${e.kind === k ? "on" : ""}" data-k="${k}">${n}</button>`).join("")}</div></div>
      <label class="field"><span>The assignment or prompt</span><textarea id="prompt" rows="4" maxlength="3000" placeholder="Paste exactly what your teacher asked, e.g. “Should schools ban phones? Use at least 3 sources.”">${esc(e.prompt)}</textarea></label>
      <label class="field"><span>Your idea or side <small>(optional)</small></span><input id="stance" maxlength="500" placeholder="e.g. I think phones should be allowed at lunch" value="${esc(e.stance)}"></label>
      <label class="field"><span>Sources or notes <small>(optional: paste quotes, the text, your notes)</small></span><textarea id="sources" rows="3" maxlength="8000">${esc(e.sources)}</textarea></label>
      <button class="btn big glow" id="go">${icon("spark", 20)} Make my plan</button>
      ${e.plan ? planHtml(e.plan) : ""}`;
    body.querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => (keep(body), (e.kind = b.dataset.k), persist(), drawPlan(body))));
    body.querySelector("#go").onclick = async () => {
      keep(body);
      if (!e.prompt.trim()) return toast("Paste the prompt first.", { emoji: "✍️" });
      if (!(await aiAvailable())) return toast("AI isn't switched on for this site yet.", { emoji: "🔌" });
      const btn = body.querySelector("#go");
      btn.disabled = true;
      btn.textContent = "Planning…";
      try {
        e.plan = await (await post("api/essay", { mode: "plan", kind: e.kind, prompt: e.prompt, stance: e.stance, sources: e.sources, grade: state.profile.grade })).json();
        e.feedback = null;
        persist();
        celebrateBadges(addXp(10));
        drawPlan(body);
        body.querySelector(".plan")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (err) {
        toast(err.message, { emoji: "⚠️" });
        btn.disabled = false;
        btn.innerHTML = `${icon("spark", 20)} Make my plan`;
      }
    };
    body.querySelectorAll("[data-thesis]").forEach((b) => (b.onclick = () => {
      e.thesis = e.plan.thesis_options[Number(b.dataset.thesis)];
      persist();
      toast("Thesis picked. Now write it in your own words.", { emoji: "✅" });
      tab = "write";
      draw();
    }));
  };

  const keep = (body) => {
    for (const k of ["prompt", "stance", "sources"]) {
      const el = body.querySelector(`#${k}`);
      if (el) e[k] = el.value;
    }
  };

  const planHtml = (p) => `
    <section class="plan">
      <div class="card"><span class="eyebrow">What they're really asking</span><p style="margin:0">${esc(p.understand)}</p></div>
      <div class="section-head"><h2>Pick a thesis</h2></div>
      <div class="list">${p.thesis_options.map((t, i) => `<button class="row" data-thesis="${i}" style="width:100%;text-align:left"><span class="unit-n">${i + 1}</span><span class="grow">${esc(t)}</span><span class="chev">${icon("chevron")}</span></button>`).join("")}</div>
      <div class="section-head"><h2>Outline</h2></div>
      <div class="units">${p.outline.map((o, i) => `<div class="unit"><div class="unit-head"><span class="unit-n">${i + 1}</span><strong>${esc(o.part)}</strong></div><p class="small muted" style="margin:0 0 6px">${esc(o.goal)}</p><ul class="bullets small">${o.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul><p class="small" style="margin:8px 0 0">✏️ Start with: <em>“${esc(o.starter)}…”</em></p></div>`).join("")}</div>
      <div class="grid-2">
        <div class="card"><h3>🔎 Evidence to find</h3><ul class="bullets small">${p.evidence_tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>
        <div class="card"><h3>⚖️ Counterclaim</h3><p class="small" style="margin:0">${esc(p.counterclaim)}</p></div>
      </div>
      <div class="card"><h3>💬 Strong words to use</h3><div class="chip-row wrap">${p.words_to_use.map((w) => `<span class="chip">${esc(w)}</span>`).join("")}</div></div>
      <div class="card" style="margin-top:10px"><h3>✅ Before you turn it in</h3><ul class="bullets small">${p.checklist.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>
      <button class="btn big" data-tab-go="write">Start writing →</button>
    </section>`;

  const drawWrite = (body) => {
    body.innerHTML = `
      ${e.thesis ? `<div class="tip">🎯 Your thesis idea: <strong>${esc(e.thesis)}</strong></div>` : ""}
      ${e.plan ? `<details class="card" style="margin-top:10px"><summary>Show my outline</summary><ol class="bullets small">${e.plan.outline.map((o) => `<li><strong>${esc(o.part)}:</strong> ${esc(o.bullets.join("; "))}</li>`).join("")}</ol></details>` : ""}
      <label class="field"><span>Your draft</span><textarea id="draft" rows="14" maxlength="12000" placeholder="Write here. It saves automatically.">${esc(e.draft)}</textarea></label>
      <p class="small muted" id="wc">${words(e.draft)} words</p>
      <button class="btn big glow" id="grade">${icon("check", 20)} Grade my draft</button>`;
    const ta = body.querySelector("#draft");
    let t = null;
    ta.oninput = () => {
      body.querySelector("#wc").textContent = `${words(ta.value)} words`;
      e.draft = ta.value;
      clearTimeout(t);
      t = setTimeout(persist, 600);
    };
    body.querySelector("#grade").onclick = async () => {
      e.draft = ta.value;
      persist();
      if (words(e.draft) < 20) return toast("Write a bit more first (20+ words).", { emoji: "✍️" });
      if (!(await aiAvailable())) return toast("AI isn't switched on for this site yet.", { emoji: "🔌" });
      const btn = body.querySelector("#grade");
      btn.disabled = true;
      btn.textContent = "Grading…";
      try {
        e.feedback = await (await post("api/essay", { mode: "feedback", kind: e.kind, prompt: e.prompt, sources: e.sources, draft: e.draft, grade: state.profile.grade })).json();
        persist();
        celebrateBadges(addXp(15));
        tab = "feedback";
        draw();
      } catch (err) {
        toast(err.message, { emoji: "⚠️" });
        btn.disabled = false;
        btn.innerHTML = `${icon("check", 20)} Grade my draft`;
      }
    };
  };

  const drawFeedback = (body) => {
    const f = e.feedback;
    if (!f) {
      body.innerHTML = `<div class="empty"><div class="big-emoji">📝</div><p>Write a draft, then tap <strong>Grade my draft</strong>.</p><button class="btn" data-tab-go="write">Go to Write</button></div>`;
      return;
    }
    body.innerHTML = `
      <div class="card"><p style="margin:0">${esc(f.overall)}</p></div>
      <div class="section-head"><h2>Rubric</h2></div>
      <div class="card">${f.scores.map((s) => `<div style="margin:6px 0 12px"><div class="goal-label" style="color:var(--text)"><span>${esc(s.area)}</span><span>${s.score}/${s.out_of}</span></div><div class="bar"><div class="bar-fill" style="width:${(s.score / Math.max(1, s.out_of)) * 100}%"></div></div><p class="small muted" style="margin:6px 0 0">${esc(s.why)}</p></div>`).join("")}</div>
      ${f.strengths.length ? `<div class="section-head"><h2>💪 What's working</h2></div><div class="card"><ul class="bullets small">${f.strengths.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div>` : ""}
      <div class="section-head"><h2>🔧 Fix these</h2></div>
      <div class="list loose">${f.fixes.map((x) => `<div class="review no"><p class="small"><em>“${esc(x.quote)}”</em></p><p><strong>${esc(x.problem)}</strong></p><p class="small muted">${esc(x.how_to_fix)}</p></div>`).join("")}</div>
      ${f.grammar.length ? `<div class="section-head"><h2>✏️ Grammar & wording</h2></div><div class="list">${f.grammar.map((g) => `<div class="row"><span class="grow"><small><s>${esc(g.quote)}</s></small><strong>${esc(g.fix)}</strong></span></div>`).join("")}</div>` : ""}
      <div class="tip" style="margin-top:14px">👉 <strong>Next step:</strong> ${esc(f.next_step)}</div>
      <button class="btn big" data-tab-go="write">Revise my draft →</button>`;
  };

  // "Start writing →" / "Revise →" buttons switch tabs.
  const onClick = (ev) => {
    const go = ev.target.closest("[data-tab-go]");
    if (go) ((tab = go.dataset.tabGo), draw(), scrollTo(0, 0));
  };
  root.addEventListener("click", onClick);
  draw();
  return () => root.removeEventListener("click", onClick);
}
