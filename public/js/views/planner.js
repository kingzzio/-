// Homework planner: day view, assignments with steps, focus timer, all-done streak,
// and import from a school calendar feed (Canvas, Schoology, Google Classroom).
import { state, save, addXp, todayKey, isPremium } from "../store.js";
import { esc, toast, confetti, celebrateBadges, post, aiAvailable } from "../ui.js";

const P = () => state.planner;
const DAY = 86400000;
const COLORS = ["#2563eb", "#db2777", "#16a34a", "#ca8a04", "#9333ea", "#0891b2", "#e11d48", "#4f46e5"];
const TYPES = ["Homework", "Quiz", "Test", "Project", "Reading", "Essay", "Lab"];

const uid = () => Math.random().toString(36).slice(2, 10);
const dayOf = (iso) => (iso ? todayKey(new Date(iso)) : "");
const classColor = (name) => COLORS[[...String(name)].reduce((h, c) => h + c.charCodeAt(0), 0) % COLORS.length];
const timeOf = (iso) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function label(key) {
  const today = todayKey();
  if (key === today) return "Today";
  if (key === todayKey(new Date(Date.now() - DAY))) return "Yesterday";
  if (key === todayKey(new Date(Date.now() + DAY))) return "Tomorrow";
  return new Date(`${key}T12:00`).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

// Finishing everything due today extends the planner streak.
function checkAllDone() {
  const today = todayKey();
  const due = P().items.filter((t) => dayOf(t.due) === today);
  if (!due.length || due.some((t) => !t.done) || P().streak.last === today) return false;
  const yesterday = todayKey(new Date(Date.now() - DAY));
  P().streak.count = P().streak.last === yesterday ? P().streak.count + 1 : 1;
  P().streak.last = today;
  return true;
}

export default function planner(root, _p, query) {
  let day = query.day || todayKey();
  let cleanupTimer = null;

  const draw = () => {
    const today = todayKey();
    const items = P()
      .items.filter((t) => dayOf(t.due) === day || (day === today && !t.done && dayOf(t.due) < today))
      .sort((a, b) => a.done - b.done || a.due.localeCompare(b.due));
    const done = items.filter((t) => t.done).length;
    const upcoming = P().items.filter((t) => !t.done && dayOf(t.due) > today).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4);
    root.innerHTML = `
      <div class="plan-head">
        <div class="grow"><h1>${esc(label(day))}</h1><p class="muted small">${items.length ? `${items.length - done} to do · ${done} done` : "Nothing due"}</p></div>
        <button class="icon-btn" id="sync" title="Sync calendar">🔄</button>
        <button class="btn small" id="add">＋ Add</button>
      </div>
      <div class="plan-nav">
        <button class="icon-btn" id="prev" aria-label="Previous day">‹</button>
        ${day !== today ? `<button class="chip" id="today">↩ Back to Today</button>` : `<span class="muted small">${new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</span>`}
        <button class="icon-btn" id="next" aria-label="Next day">›</button>
      </div>
      ${P().streak.count && P().streak.last >= todayKey(new Date(Date.now() - DAY)) ? `<p class="center"><span class="tag">🔥 ${P().streak.count}-day on-time streak</span></p>` : ""}
      <div class="list" id="items">${
        items.length
          ? items.map(itemRow).join("")
          : `<div class="empty small-empty"><div class="big-emoji">📭</div><p><strong>No assignments ${day === today ? "due today" : "this day"}</strong></p><button class="link" id="add2">＋ Add assignment</button></div>`
      }</div>
      ${items.length && done === items.length ? `<div class="card all-done"><div class="big-emoji">🎉</div><h2>All assignments done!</h2><p>Good work today.</p></div>` : ""}
      ${day === today && upcoming.length ? `<section class="section"><div class="section-head"><h2>Look ahead</h2></div><div class="list">${upcoming.map(itemRow).join("")}</div></section>` : ""}
      <section class="section">
        <div class="section-head"><h2>Connect your classes</h2></div>
        <div class="card">
          <p class="small">Paste your <strong>calendar feed link</strong> to import assignments automatically. It's read-only, and your password is never needed.</p>
          <details class="small"><summary>Where do I find it?</summary>
            <ul class="bullets">
              <li><strong>Canvas:</strong> Calendar → bottom right → <em>Calendar Feed</em> → copy the link.</li>
              <li><strong>Schoology:</strong> Calendar → <em>Export</em> → copy the iCal link.</li>
              <li><strong>Google Classroom:</strong> Google Calendar → Settings → your class calendar → <em>Secret address in iCal format</em>.</li>
            </ul>
          </details>
          <div class="composer-row"><input id="feed" placeholder="https://… or webcal://…" aria-label="Calendar feed URL"><button class="btn small" id="connect">Connect</button></div>
          ${P().feeds.length ? `<p class="tiny muted">${P().feeds.length} calendar${P().feeds.length === 1 ? "" : "s"} connected${P().lastSync ? ` · last synced ${new Date(P().lastSync).toLocaleString()}` : ""} · <button class="link tiny" id="disconnect">Disconnect</button></p>` : ""}
        </div>
      </section>
      <section class="section"><div class="grid-2">
        <button class="card tile" id="focus"><div class="tile-emoji">⏱️</div><h3>Start a timer</h3><p>25 minutes of focus</p></button>
        <a class="card tile" href="#/tutor"><div class="tile-emoji">🤖</div><h3>Stuck?</h3><p>Ask Boro for help</p></a>
      </div></section>`;

    const shift = (n) => {
      day = todayKey(new Date(new Date(`${day}T12:00`).getTime() + n * DAY));
      draw();
    };
    root.querySelector("#prev").onclick = () => shift(-1);
    root.querySelector("#next").onclick = () => shift(1);
    root.querySelector("#today")?.addEventListener("click", () => ((day = todayKey()), draw()));
    root.querySelector("#add").onclick = () => editor(null);
    root.querySelector("#add2")?.addEventListener("click", () => editor(null));
    root.querySelector("#sync").onclick = () => sync(true);
    root.querySelector("#focus").onclick = () => focusTimer(null);
    root.querySelector("#connect").onclick = async () => {
      const url = root.querySelector("#feed").value.trim();
      if (!url) return;
      if (!P().feeds.includes(url)) P().feeds.push(url);
      save();
      await sync(true);
    };
    root.querySelector("#disconnect")?.addEventListener("click", () => {
      if (!confirm("Disconnect your calendars? Imported assignments stay.")) return;
      P().feeds = [];
      save();
      draw();
    });
    root.querySelectorAll("[data-check]").forEach((b) => (b.onclick = (e) => (e.stopPropagation(), toggleDone(b.dataset.check))));
    root.querySelectorAll("[data-open]").forEach((b) => {
      b.onclick = () => detail(b.dataset.open);
      b.onkeydown = (e) => e.key === "Enter" && e.target === b && detail(b.dataset.open);
    });
  };

  const toggleDone = (id) => {
    const t = P().items.find((x) => x.id === id);
    if (!t) return;
    t.done = !t.done;
    t.doneAt = t.done ? Date.now() : 0;
    if (t.done) {
      t.steps.forEach((s) => (s.done = true));
      state.stats.tasksDone++;
      const badges = addXp(15);
      if (checkAllDone()) {
        confetti();
        toast(`All done! ${P().streak.count}-day streak`, { emoji: "🔥" });
      }
      celebrateBadges(badges);
    }
    save();
    draw();
  };

  const sync = async (loud) => {
    if (!P().feeds.length) return loud && toast("Connect a calendar first ↓", { emoji: "📅" });
    let added = 0;
    for (const url of P().feeds) {
      try {
        const { events } = await (await post("api/calendar", { url })).json();
        for (const ev of events) {
          const key = `feed:${ev.uid || `${ev.title}|${ev.due}`}`;
          const existing = P().items.find((t) => t.key === key);
          if (existing) {
            existing.due = ev.due;
            existing.title = ev.title;
            continue;
          }
          // Skip stuff that was due more than two weeks ago.
          if (new Date(ev.due).getTime() < Date.now() - 14 * DAY) continue;
          P().items.push({ id: uid(), key, title: ev.title, course: ev.course || "", due: ev.due, type: guessType(ev.title), priority: "Medium", points: "", steps: [], notes: ev.notes || "", url: ev.url || "", done: false, source: "calendar" });
          added++;
        }
      } catch (err) {
        if (loud) toast(err.status === 404 ? "Calendar import needs the BrainBoro server (not available on this site)." : err.message, { emoji: "⚠️" });
        return;
      }
    }
    P().lastSync = Date.now();
    save();
    if (loud) toast(added ? `${added} assignment${added === 1 ? "" : "s"} imported` : "You're up to date", { emoji: "✅" });
    draw();
  };

  // Bottom-sheet editor for a new or existing assignment.
  const editor = (id) => {
    const t = id ? P().items.find((x) => x.id === id) : null;
    const due = t ? new Date(t.due) : new Date(`${day}T23:59`);
    const local = new Date(due.getTime() - due.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const classes = [...new Set(P().items.map((x) => x.course).filter(Boolean))];
    sheet(`
      <h2>${t ? "Edit" : "New"} assignment</h2>
      <label class="field"><span>What is it?</span><input id="e-title" maxlength="120" placeholder="e.g. Systems of equations worksheet" value="${esc(t?.title || "")}"></label>
      <label class="field"><span>Class</span><input id="e-course" list="e-classes" maxlength="40" placeholder="e.g. Algebra II" value="${esc(t?.course || "")}"><datalist id="e-classes">${classes.map((c) => `<option value="${esc(c)}">`).join("")}</datalist></label>
      <div class="grid-2 tight">
        <label class="field"><span>Due</span><input id="e-due" type="datetime-local" value="${local}"></label>
        <label class="field"><span>Type</span><select id="e-type">${TYPES.map((x) => `<option ${t?.type === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
        <label class="field"><span>Priority</span><select id="e-pri">${["Low", "Medium", "High"].map((x) => `<option ${(t?.priority || "Medium") === x ? "selected" : ""}>${x}</option>`).join("")}</select></label>
        <label class="field"><span>Worth (pts)</span><input id="e-pts" inputmode="numeric" maxlength="5" value="${esc(t?.points || "")}"></label>
      </div>
      <label class="field"><span>Notes</span><textarea id="e-notes" rows="3" maxlength="600" placeholder="e.g. Problems 1–12, show your work">${esc(t?.notes || "")}</textarea></label>
      <button class="btn big" id="e-save">${t ? "Save" : "Add assignment"}</button>`, (box, closeSheet) => {
      box.querySelector("#e-title").focus();
      box.querySelector("#e-save").onclick = () => {
        const title = box.querySelector("#e-title").value.trim();
        if (!title) return box.querySelector("#e-title").focus();
        const dueVal = box.querySelector("#e-due").value;
        const data = {
          title,
          course: box.querySelector("#e-course").value.trim(),
          due: dueVal ? new Date(dueVal).toISOString() : new Date(`${day}T23:59`).toISOString(),
          type: box.querySelector("#e-type").value,
          priority: box.querySelector("#e-pri").value,
          points: box.querySelector("#e-pts").value.replace(/\D/g, ""),
          notes: box.querySelector("#e-notes").value.trim(),
        };
        if (t) Object.assign(t, data);
        else P().items.push({ id: uid(), key: "", steps: [], done: false, source: "manual", ...data });
        save();
        closeSheet();
        day = dayOf(data.due);
        draw();
      };
    });
  };

  const detail = (id) => {
    const t = P().items.find((x) => x.id === id);
    if (!t) return;
    const render = (box, closeSheet) => {
      const doneSteps = t.steps.filter((s) => s.done).length;
      box.innerHTML = `
        <div class="sheet-top"><button class="icon-btn" id="d-edit" aria-label="Edit">✏️</button><button class="icon-btn" id="d-x" aria-label="Close">✕</button></div>
        <span class="eyebrow" style="--accent:${classColor(t.course)}">${esc(t.course || "No class")}</span>
        <h2>${esc(t.title)}</h2>
        <dl class="facts">
          <div><dt>Due</dt><dd class="${!t.done && new Date(t.due) < new Date() ? "late" : ""}">${esc(label(dayOf(t.due)))} at ${timeOf(t.due)}</dd></div>
          <div><dt>Type</dt><dd>${esc(t.type)}</dd></div>
          <div><dt>Priority</dt><dd class="pri-${t.priority.toLowerCase()}">${esc(t.priority)}</dd></div>
          ${t.points ? `<div><dt>Worth</dt><dd>${esc(t.points)} pts</dd></div>` : ""}
        </dl>
        <div class="section-head"><h3>Steps</h3><span class="muted small">${doneSteps} of ${t.steps.length}</span></div>
        ${t.steps.length ? `<div class="bar thin"><div class="bar-fill" style="width:${(doneSteps / t.steps.length) * 100}%"></div></div>` : ""}
        <div class="steps">${t.steps.map((s, n) => `<div class="step ${s.done ? "done" : ""}"><button class="check ${s.done ? "on" : ""}" data-step="${n}" aria-label="Toggle step">${s.done ? "✓" : ""}</button><span class="grow">${esc(s.t)}</span><button class="icon-btn sm" data-rm="${n}" aria-label="Remove step">✕</button></div>`).join("")}
          <div class="step add"><span class="muted">＋</span><input id="d-step" maxlength="80" placeholder="Add a step…" aria-label="Add a step"></div>
        </div>
        <div class="btn-row wrap">
          <button class="btn ghost small" id="d-ai">✨ Break into steps</button>
          <button class="btn ghost small" id="d-help">🤖 Help me with this</button>
          <button class="btn ghost small" id="d-timer">⏱️ Focus timer</button>
        </div>
        ${t.notes ? `<h3>Notes</h3><p class="small">${esc(t.notes).replace(/\n/g, "<br>")}</p>` : ""}
        ${/^https?:\/\//i.test(t.url || "") ? `<p class="small"><a class="link" href="${esc(t.url)}" target="_blank" rel="noopener">Open in your class site ↗</a></p>` : ""}
        <button class="btn big" id="d-done">${t.done ? "↩ Mark as not done" : "✓ Mark as complete"}</button>
        <button class="btn danger big" id="d-del">Delete assignment</button>`;
      const rerender = () => (save(), render(box, closeSheet), draw());
      box.querySelector("#d-x").onclick = closeSheet;
      box.querySelector("#d-edit").onclick = () => (closeSheet(), editor(t.id));
      box.querySelectorAll("[data-step]").forEach((b) => (b.onclick = () => ((t.steps[b.dataset.step].done = !t.steps[b.dataset.step].done), rerender())));
      box.querySelectorAll("[data-rm]").forEach((b) => (b.onclick = () => (t.steps.splice(Number(b.dataset.rm), 1), rerender())));
      box.querySelector("#d-step").onkeydown = (e) => {
        if (e.key === "Enter" && e.target.value.trim()) {
          t.steps.push({ t: e.target.value.trim(), done: false });
          rerender();
          box.querySelector("#d-step").focus();
        }
      };
      box.querySelector("#d-ai").onclick = async () => {
        if (!isPremium()) return (closeSheet(), (location.hash = "#/premium"));
        if (!(await aiAvailable())) return toast("AI isn't switched on for this site.", { emoji: "🔌" });
        try {
          box.querySelector("#d-ai").disabled = true;
          const { steps } = await (await post("api/steps", { title: t.title, course: t.course, notes: t.notes })).json();
          t.steps.push(...steps.map((s) => ({ t: s, done: false })));
          rerender();
        } catch (err) {
          toast(err.message, { emoji: "⚠️" });
          box.querySelector("#d-ai").disabled = false;
        }
      };
      box.querySelector("#d-help").onclick = () => {
        sessionStorage.setItem("brainboro:ask", JSON.stringify({ mode: "hint", assignment: `${t.title}${t.course ? ` (${t.course})` : ""}`, text: `I'm working on "${t.title}"${t.course ? ` for ${t.course}` : ""}.${t.notes ? ` Details: ${t.notes}` : ""} Can you help me get started? I want to understand how to do it myself.` }));
        closeSheet();
        location.hash = "#/tutor";
      };
      box.querySelector("#d-timer").onclick = () => (closeSheet(), focusTimer(t));
      box.querySelector("#d-done").onclick = () => (closeSheet(), toggleDone(t.id));
      box.querySelector("#d-del").onclick = () => {
        if (!confirm("Delete this assignment?")) return;
        P().items = P().items.filter((x) => x.id !== t.id);
        save();
        closeSheet();
        draw();
      };
    };
    sheet("", render);
  };

  const focusTimer = (t) => {
    cleanupTimer?.();
    let left = 25 * 60, running = true;
    sheet(`<div class="focus"><p class="muted">${t ? esc(t.title) : "Focus session"}</p><div class="focus-time" id="ft">25:00</div>
      <div class="btn-row"><button class="btn ghost" id="fp">Pause</button><button class="btn" id="fs">Stop</button></div>
      <p class="tiny muted">Phone face down. You've got this. 💪</p></div>`, (box, closeSheet) => {
      const iv = setInterval(() => {
        if (!running) return;
        left--;
        box.querySelector("#ft").textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
        if (left <= 0) {
          clearInterval(iv);
          celebrateBadges(addXp(25));
          confetti();
          toast("Focus session done! +25 XP", { emoji: "⏱️" });
          closeSheet();
        }
      }, 1000);
      cleanupTimer = () => clearInterval(iv);
      box.querySelector("#fp").onclick = () => {
        running = !running;
        box.querySelector("#fp").textContent = running ? "Pause" : "Resume";
      };
      box.querySelector("#fs").onclick = closeSheet;
      return () => clearInterval(iv);
    });
  };

  draw();
  // Refresh imported assignments at most every 30 minutes.
  if (P().feeds.length && Date.now() - P().lastSync > 30 * 60000) sync(false);
  return () => {
    cleanupTimer?.();
    document.querySelector(".sheet-wrap")?.remove();
  };
}

function itemRow(t) {
  const late = !t.done && new Date(t.due) < new Date();
  const doneSteps = t.steps.filter((s) => s.done).length;
  return `<div class="row task ${t.done ? "done" : ""}" data-open="${t.id}" role="button" tabindex="0">
    <button class="check ${t.done ? "on" : ""}" data-check="${t.id}" aria-label="${t.done ? "Mark not done" : "Mark done"}" style="--accent:${classColor(t.course)}">${t.done ? "✓" : ""}</button>
    <span class="grow"><strong>${esc(t.title)}</strong>
      <small><span class="dot" style="background:${classColor(t.course)}"></span>${esc(t.course || t.type)}${t.done ? "" : ` · <span class="${late ? "late" : "due"}">${late && dayOf(t.due) !== todayKey() ? esc(label(dayOf(t.due))) : timeOf(t.due)}</span>`}${t.points ? ` · ${esc(t.points)} pts` : ""}${t.steps.length ? ` · ${doneSteps}/${t.steps.length}` : ""}</small></span>
    ${t.priority === "High" && !t.done ? `<span class="flag" title="High priority">🚩</span>` : ""}
  </div>`;
}

function guessType(title) {
  const s = title.toLowerCase();
  if (/\b(test|exam|midterm|final)\b/.test(s)) return "Test";
  if (/\bquiz\b/.test(s)) return "Quiz";
  if (/\blab\b/.test(s)) return "Lab";
  if (/\b(essay|paragraph|draft|paper)\b/.test(s)) return "Essay";
  if (/\b(read|chapter)\b/.test(s)) return "Reading";
  if (/\bproject\b/.test(s)) return "Project";
  return "Homework";
}

// Bottom sheet. `setup(box, close)` wires it up; it may return a cleanup function.
function sheet(html, setup) {
  document.querySelector(".sheet-wrap")?.remove();
  const wrap = document.createElement("div");
  wrap.className = "sheet-wrap";
  wrap.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="sheet-grab"></div><div class="sheet-body">${html}</div></div>`;
  document.body.appendChild(wrap);
  const box = wrap.querySelector(".sheet-body");
  let extra = null;
  const close = () => {
    extra?.();
    wrap.remove();
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => e.key === "Escape" && close();
  document.addEventListener("keydown", onKey);
  wrap.addEventListener("click", (e) => e.target === wrap && close());
  extra = setup(box, close) || null;
}
