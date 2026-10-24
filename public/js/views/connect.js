// "Connect Your School": pick your platform, sign in, and import assignments + grades.
import { state } from "../store.js";
import { esc, toast, confetti, aiAvailable } from "../ui.js";
import { icon } from "../icons.js";
import { hasGoogle, initAccount } from "../account.js";
import { connectSchool, disconnect } from "../schools.js";

const PLATFORMS = [
  { id: "classroom", name: "Google Classroom", emoji: "🎓", color: "#12a150", note: "NYC public schools" },
  { id: "canvas", name: "Canvas", emoji: "📕", color: "#e5294f" },
  { id: "schoology", name: "Schoology", emoji: "🧢", color: "#0ea5e9", calendar: "In Schoology: Calendar → Export (or the iCal link) → copy the link." },
  { id: "studentvue", name: "StudentVue", emoji: "🪪", color: "#12a150", calendar: "StudentVue doesn't share assignments with other apps. If your teachers post in Google Classroom or Canvas, connect that instead, or add assignments with ＋." },
  { id: "powerschool", name: "PowerSchool", emoji: "⚡", color: "#3a6bff", calendar: "PowerSchool doesn't share assignments with other apps directly. If your school's PowerSchool has a calendar subscription link, paste it below. Otherwise connect Google Classroom/Canvas, or add assignments with ＋." },
  { id: "aeries", name: "Aeries", emoji: "☁️", color: "#ff8a00", calendar: "Aeries doesn't share assignments with other apps directly. Use your class calendar link if your teacher shares one, or add assignments with ＋." },
  { id: "infinite", name: "Infinite Campus", emoji: "🏛️", color: "#6d4aff", calendar: "In Campus Student: Calendar → look for a subscribe/iCal option. If there isn't one, add assignments with ＋." },
  { id: "calendar", name: "Calendar Link", emoji: "📅", color: "#0891b2", calendar: "Paste any assignment calendar link (.ics or webcal://). Canvas: Calendar → Calendar Feed. Google Calendar: Settings → your class calendar → Secret address in iCal format." },
];
const STEPS = ["Checking your sign-in", "Loading courses", "Fetching assignments", "Syncing data"];

export default function connect(root, _p, query) {
  const draw = () => {
    const conns = state.planner.connections || [];
    root.innerHTML = `
      <a class="back" href="#/planner">${icon("back", 18)} Planner</a>
      <div class="center"><div class="big-ic">${icon("learn", 34)}</div><h1>Connect your school</h1><p class="lead">Choose your school's platform to sync assignments and grades.</p></div>
      ${conns.length ? `<section class="section"><div class="section-head"><h2>Connected</h2></div><div class="list">${conns.map((c) => `<button class="row" data-open="${esc(c.id)}" style="width:100%;text-align:left"><span class="em">${PLATFORMS.find((p) => p.id === c.type)?.emoji || "📅"}</span><span class="grow"><strong>${esc(c.label)}</strong><small>${esc(c.school || "")}${c.lastSync ? ` · synced ${timeAgo(c.lastSync)}` : ""}</small></span><span class="ok-pill">${icon("check", 14)} Connected</span></button>`).join("")}</div></section>` : ""}
      <div class="lms-grid">${PLATFORMS.map((p) => `<button class="lms" data-p="${p.id}" style="--accent:${p.color}"><span class="lms-ic">${p.emoji}</span>${esc(p.name)}${p.note ? `<small>${esc(p.note)}</small>` : ""}</button>`).join("")}</div>
      <p class="tiny muted center">Read-only. BrainBoro can see your assignments and grades but can't submit anything or change your classes.</p>`;
    root.querySelectorAll("[data-p]").forEach((b) => (b.onclick = () => flow(PLATFORMS.find((p) => p.id === b.dataset.p))));
    root.querySelectorAll("[data-open]").forEach((b) => (b.onclick = () => result(conns.find((c) => c.id === b.dataset.open))));
  };

  const flow = async (p) => {
    if (p.id === "classroom") {
      await initAccount();
      if (!hasGoogle()) return form(p, `<div class="card warn small">Google Classroom needs Google sign-in to be set up on this site (the site owner adds a Google Client ID, see the README). Until then, use your Classroom calendar link: Google Calendar → Settings → your class calendar → <em>Secret address in iCal format</em>.</div>`, true);
      return run(p, {});
    }
    if (p.id === "canvas") return canvasForm(p);
    return form(p, `<p class="small">${esc(p.calendar)}</p>`, true);
  };

  const canvasForm = (p) => {
    root.innerHTML = `
      <button class="back link" id="bk">${icon("back", 18)} Back</button>
      <h1>Canvas</h1>
      <label class="field"><span>Your school's Canvas address</span><input id="dom" inputmode="url" autocomplete="off" placeholder="yourschool.instructure.com" value="${esc(query.domain || "")}"></label>
      <label class="field"><span>Access token</span><input id="tok" autocomplete="off" placeholder="Paste your token"></label>
      <details class="small"><summary>How do I get a token?</summary><ol class="bullets">
        <li>Log in to Canvas on a computer.</li><li>Click <strong>Account → Settings</strong>.</li><li>Scroll to <strong>Approved Integrations</strong> → <strong>＋ New Access Token</strong>.</li><li>Name it “BrainBoro”, generate it, and copy it here.</li></ol>
        <p class="tiny muted">The token stays on this device. If your school turned tokens off, use <strong>Calendar Link</strong> instead (Canvas → Calendar → Calendar Feed).</p></details>
      <button class="btn big glow" id="go">Connect Canvas</button>`;
    root.querySelector("#bk").onclick = draw;
    root.querySelector("#go").onclick = () => {
      const domain = root.querySelector("#dom").value.trim();
      const token = root.querySelector("#tok").value.trim();
      if (!domain || !token) return toast("Enter your Canvas address and token.", { emoji: "✍️" });
      run(p, { domain, token, label: "Canvas" });
    };
  };

  const form = (p, help, withUrl) => {
    root.innerHTML = `
      <button class="back link" id="bk">${icon("back", 18)} Back</button>
      <h1>${esc(p.name)}</h1>
      ${help}
      ${withUrl ? `<label class="field"><span>Calendar link</span><input id="url" inputmode="url" autocomplete="off" placeholder="https://… or webcal://…"></label><button class="btn big glow" id="go">Connect</button>` : ""}
      <a class="btn big ghost" href="#/planner">Add assignments myself</a>`;
    root.querySelector("#bk").onclick = draw;
    root.querySelector("#go")?.addEventListener("click", () => {
      const url = root.querySelector("#url").value.trim();
      if (!url) return;
      run({ ...p, id: "calendar" }, { url, label: p.name === "Calendar Link" ? "Calendar link" : `${p.name} calendar` });
    });
  };

  const run = async (p, fields) => {
    root.innerHTML = `
      <div class="center"><div class="big-ic">${icon("shield", 34)}</div><h2 id="ct">Connecting to ${esc(p.name)}</h2><p class="muted" id="cs">Checking your sign-in</p></div>
      <div class="connect-steps">${STEPS.map((s, i) => `<div class="cstep" data-i="${i}"><span class="cdot"></span><span>${s}</span><span class="when"></span></div>`).join("")}</div>`;
    const onStep = (i) => {
      root.querySelectorAll(".cstep").forEach((el) => {
        const n = Number(el.dataset.i);
        el.className = `cstep ${n < i ? "done" : n === i ? "active" : ""}`;
        el.querySelector(".cdot").innerHTML = n < i ? icon("check", 14) : "";
        el.querySelector(".when").textContent = n < i ? "Done" : "";
      });
      const t = root.querySelector("#cs");
      if (t) t.textContent = STEPS[Math.min(i, STEPS.length - 1)];
      if (i === 2 && root.querySelector("#ct")) root.querySelector("#ct").textContent = "Fetching assignments";
    };
    try {
      const { conn, added } = await connectSchool(p.id === "canvas" || p.id === "classroom" ? p.id : "calendar", fields, onStep);
      confetti(60);
      result(conn, added);
    } catch (err) {
      toast(err.status === 404 ? "Connecting needs the BrainBoro server (not available on this copy)." : err.message, { emoji: "⚠️", ms: 5000 });
      draw();
    }
  };

  const result = (c, added) => {
    const grades = c.grades || [];
    root.innerHTML = `
      <button class="back link" id="bk">${icon("back", 18)} Back</button>
      <div class="sheet-top"><div class="grow"><h1>${esc(c.label)}</h1><p class="muted small">${esc([c.student, c.school].filter(Boolean).join(" · "))}</p></div><span class="ok-pill">${icon("check", 14)} Connected</span></div>
      ${grades.length ? `<section class="section"><div class="section-head"><h3 class="muted small">YOUR GRADES</h3></div><div class="list">${grades.map((g) => `<div class="row grade-row"><span class="row-dot" style="--accent:${g.percent == null ? "var(--line)" : g.percent >= 80 ? "var(--good)" : g.percent >= 70 ? "#d97706" : "var(--bad)"}"></span><span class="grow"><strong>${esc(g.course)}</strong><small>${esc(g.code || "")}</small></span><span class="pct">${g.percent == null ? "—" : `${g.percent}%`}<small>${esc(g.letter || "")}</small></span></div>`).join("")}</div></section>` : ""}
      <p class="tiny muted center">Last synced ${timeAgo(c.lastSync)}</p>
      <div class="note-ok">${icon("check", 18)} ${c.count || 0} assignment${c.count === 1 ? "" : "s"} imported${added ? ` (${added} new)` : ""}</div>
      <button class="btn big ghost" id="sync">${icon("sync", 18)} Sync now</button>
      <a class="btn big" href="#/planner">See my assignments</a>
      <button class="btn big danger" id="out">${icon("logout", 18)} Disconnect</button>`;
    root.querySelector("#bk").onclick = draw;
    root.querySelector("#sync").onclick = () => run(PLATFORMS.find((p) => p.id === c.type) || PLATFORMS.at(-1), c);
    root.querySelector("#out").onclick = () => {
      if (!confirm(`Disconnect ${c.label}? Imported assignments stay in your planner.`)) return;
      disconnect(c.id);
      draw();
    };
  };

  aiAvailable(); // warm up the status call
  if (query.p) flow(PLATFORMS.find((p) => p.id === query.p) || PLATFORMS[0]);
  else draw();
}

function timeAgo(t) {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return s <= 1 ? "just now" : `${s} seconds ago`;
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} hr ago`;
  return new Date(t).toLocaleDateString();
}
