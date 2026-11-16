// Admin dashboard: live stats, broadcast (announcements, push, feature switches), events (Double XP,
// event card, challenges, Daily Brain Blast editor, seasons), growth (codes, referrals, settings),
// safety (report queue, nickname filter, action log) and users.
import { esc, toast, post } from "../ui.js";
import { icon } from "../icons.js";
import { isAdmin, initAccount } from "../account.js";
import { exams, topics, examTopicIds } from "../content.js";
import { BADGES } from "../store.js";

const TABS = [["dash", "📊", "Dashboard"], ["broadcast", "📣", "Broadcast"], ["events", "🎮", "Events"], ["growth", "💰", "Growth"], ["safety", "🛡️", "Safety"], ["users", "👥", "Users"]];
const fmtDate = (t) => new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const bars = (rows, { color = "var(--brand)", max } = {}) => {
  const m = max || Math.max(1, ...rows.map((r) => r[1]));
  return rows.length ? rows.map(([label, v]) => `<div class="hbar"><span class="hbar-l">${esc(label)}</span><div class="bar"><div class="bar-fill" style="width:${Math.max(2, (v / m) * 100)}%;background:${color}"></div></div><b>${v.toLocaleString()}</b></div>`).join("") : `<p class="small muted">No data yet.</p>`;
};
const cols = (vals, labels, { color = "var(--brand)", h = 90 } = {}) => {
  const m = Math.max(1, ...vals);
  return `<div class="cols">${vals.map((v, i) => `<div class="col-i" title="${esc(labels[i])}: ${v}"><div class="col-b" style="height:${Math.max(2, (v / m) * h)}px;background:${color}"></div><span>${esc(labels[i])}</span></div>`).join("")}</div>`;
};

export default function admin(root, _p, query) {
  let data = null;
  let tab = TABS.some((t) => t[0] === query.tab) ? query.tab : "dash";
  let q = "";

  const load = async () => {
    await initAccount();
    if (!isAdmin()) {
      root.innerHTML = `<div class="empty"><div class="big-emoji">🔒</div><h2>Admins only</h2><p class="muted">Sign in with the admin Google account to open this page.</p><a class="btn" href="#/login?next=admin">Log in</a></div>`;
      return;
    }
    try {
      data = await (await fetch("api/admin", { cache: "no-store" })).json();
      if (data.error) throw new Error(data.error);
      draw();
    } catch (err) {
      root.innerHTML = `<div class="empty"><h2>Couldn't load admin data</h2><p class="muted">${esc(err.message)}</p></div>`;
    }
  };
  const act = async (body, msg) => {
    try {
      const out = await (await post("api/admin", body)).json();
      if (msg) toast(msg, { emoji: "✅" });
      return out;
    } catch (err) {
      toast(err.message, { emoji: "⚠️" });
      return null;
    }
  };
  const reload = async () => {
    data = await (await fetch("api/admin", { cache: "no-store" })).json();
    draw();
  };

  const draw = () => {
    const s = data.stats;
    root.innerHTML = `
      <a class="back" href="#/me">${icon("back", 18)} Me</a>
      <h1 class="page-title" style="display:flex;align-items:center;gap:8px">${icon("shield", 26)} Admin</h1>
      <div class="admin-tabs">${TABS.map(([id, em, label]) => `<button class="${tab === id ? "on" : ""}" data-tab="${id}"><span>${em}</span>${label}${id === "safety" && data.reports.length ? `<i class="dot-n">${data.reports.length}</i>` : ""}</button>`).join("")}</div>
      ${s.db === "file" ? `<div class="card warn small"><strong>Heads up:</strong> accounts are saved in a local file. On Vercel that resets, so add a free Upstash Redis (see the README) before you launch.</div>` : ""}
      <div id="pane"></div>`;
    root.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => {
      tab = b.dataset.tab;
      history.replaceState(null, "", `#/admin?tab=${tab}`);
      draw();
    }));
    ({ dash, broadcast, events, growth, safety, users })[tab](root.querySelector("#pane"));
  };

  // ---------- Dashboard ----------
  const dash = (el) => {
    const s = data.stats, d = data.dashboard;
    const dayLabels = d.days.map((x) => new Date(`${x}T12:00`).toLocaleDateString(undefined, { weekday: "short" }));
    const aiPct = Math.min(100, Math.round((d.ai.today / d.ai.alert) * 100));
    el.innerHTML = `
      <div class="admin-stats">
        <div class="stat"><div class="stat-v">${s.users}</div><div class="stat-l">accounts</div></div>
        <div class="stat"><div class="stat-v">${d.dau[6]}</div><div class="stat-l">active today</div></div>
        <div class="stat live-stat"><div class="stat-v"><span class="live-dot"></span> ${d.online}</div><div class="stat-l">online now</div></div>
        <div class="stat"><div class="stat-v">${s.newToday}</div><div class="stat-l">new today</div></div>
        <div class="stat"><div class="stat-v">${s.premium}</div><div class="stat-l">premium</div></div>
        <div class="stat"><div class="stat-v">${(d.answers[6].ok + d.answers[6].no).toLocaleString()}</div><div class="stat-l">answers today</div></div>
      </div>
      <div class="card ${aiPct >= 90 ? "warn" : ""}" style="margin-top:12px"><div class="section-head" style="margin:0"><strong>🤖 AI meter</strong><span class="small muted">${s.ai?.length ? esc(s.ai.join(" → ")) : "AI off"} · <a class="link" href="#/aicheck">Test</a></span></div>
        <div class="bar" style="margin:8px 0 4px"><div class="bar-fill" style="width:${aiPct}%;background:${aiPct >= 90 ? "var(--bad)" : aiPct >= 70 ? "var(--brand-3)" : "var(--good)"}"></div></div>
        <small class="muted">${d.ai.today.toLocaleString()} AI requests today · alert at ${d.ai.alert.toLocaleString()}${aiPct >= 90 ? " · Close to the free limit: consider turning AI off in Broadcast → Feature switches, or add a Groq key." : ""}</small></div>
      <div class="grid-2">
        <div class="card"><h3>Daily active (7 days)</h3>${cols(d.dau, dayLabels)}</div>
        <div class="card"><h3>New sign-ups</h3>${cols(d.signups, dayLabels, { color: "var(--brand-2)" })}</div>
      </div>
      <div class="card"><h3>Questions answered</h3>${cols(d.answers.map((a) => a.ok + a.no), dayLabels, { color: "var(--good)" })}<p class="tiny muted" style="margin:6px 0 0">Today: ${d.answers[6].ok} right, ${d.answers[6].no} wrong (${d.answers[6].ok + d.answers[6].no ? Math.round((d.answers[6].ok / (d.answers[6].ok + d.answers[6].no)) * 100) : 0}% correct)</p></div>
      <div class="card"><h3>⏰ Busiest hours today (NY time)</h3>${cols(d.hours, d.hours.map((_, h) => (h % 6 === 0 ? `${h % 12 || 12}${h < 12 ? "a" : "p"}` : "")), { color: "#0ea5e9", h: 60 })}</div>
      <div class="card"><h3>🔥 Most-used features (7 days)</h3>${bars(d.features)}</div>
      <div class="grid-2">
        <div class="card"><h3>🗽 Students by borough</h3>${bars(d.boroughs, { color: "#ff4f8b" })}</div>
        <div class="card"><h3>🏫 Top schools</h3>${bars(d.schools, { color: "#12a150" })}${d.partners.length ? `<h3 style="margin-top:12px">🤝 Partner schools</h3>${bars(d.partners, { color: "#f59e0b" })}` : ""}</div>
      </div>
      <div class="card"><h3>🩺 Content health: most-missed questions</h3><p class="tiny muted">Questions answered at least 5 times. A very high miss rate can mean a hard topic, or a wrong answer key worth checking.</p>
        ${d.missed.length ? d.missed.map((m) => `<div class="miss"><span class="miss-rate ${m.rate >= 75 ? "hot" : ""}">${m.rate}%</span><span class="grow small">${esc(m.q)}<small class="muted"> · ${m.miss}/${m.tot} missed${m.topic ? ` · ${esc(m.topic)}` : ""}</small></span></div>`).join("") : `<p class="small muted">Not enough answers yet.</p>`}</div>
      <p class="tiny muted">Stats are anonymous counts. Students' chats, photos and essays are never visible here.</p>`;
  };

  // ---------- Broadcast ----------
  const broadcast = (el) => {
    const c = data.config;
    const a = c.announcement;
    el.innerHTML = `
      <div class="card"><h3>📣 Announcement banner</h3><p class="small muted">Shows at the top of everyone's app.</p>
        ${a ? `<div class="bnr ${esc(a.tone)}" style="margin:8px 0"><span>${esc(a.text)}</span></div><p class="tiny muted">${a.until ? `Until ${fmtDate(a.until)}` : "No end date"}</p>` : ""}
        <label class="field"><span>Message</span><input id="at" maxlength="200" placeholder="🎉 Regis HSPT practice is live!" value="${esc(a?.text || "")}"></label>
        <div class="grid-2 tight"><label class="field"><span>Style</span><select id="ato">${[["info", "📣 Info"], ["party", "🎉 Celebrate"], ["warn", "⚠️ Warning"]].map(([v, l]) => `<option value="${v}" ${a?.tone === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
        <label class="field"><span>Show for (days, 0 = until cleared)</span><input id="ad" type="number" min="0" max="365" value="3"></label></div>
        <label class="field"><span>Link (optional, e.g. #/scholarships)</span><input id="al" maxlength="120" value="${esc(a?.link || "")}"></label>
        <div class="btn-row"><button class="btn" id="asave">Publish</button>${a ? `<button class="btn ghost" id="aclr">Clear</button>` : ""}</div></div>

      <div class="card"><h3>🔔 Push notification</h3><p class="small muted">${data.pushSubs} device${data.pushSubs === 1 ? "" : "s"} signed up (students turn this on in Settings).</p>
        <label class="field"><span>Title</span><input id="pt" maxlength="60" placeholder="Your Brain Blast is ready ⚡"></label>
        <label class="field"><span>Message</span><input id="pb" maxlength="160" placeholder="5 new questions. Keep that streak alive!"></label>
        <label class="field"><span>Opens (optional)</span><input id="pu" maxlength="120" placeholder="#/daily"></label>
        <button class="btn" id="psend">Send to everyone</button></div>

      <div class="card"><h3>🎛️ Feature switches</h3><p class="small muted">Pause a feature for everyone instantly, no code needed.</p>
        <div class="list">${Object.entries(data.features).map(([k, label]) => `<label class="row set-row"><span class="grow"><strong>${esc(label)}</strong>${k === "ai" ? `<small>Turns off Snap &amp; Answer, Boro, Coach, Essay Coach and lessons at once</small>` : ""}</span><input type="checkbox" class="switch" data-flag="${k}" ${c.flags?.[k] === false ? "" : "checked"}></label>`).join("")}</div></div>`;
    el.querySelector("#asave").onclick = async () => {
      if (await act({ action: "announce", text: el.querySelector("#at").value, tone: el.querySelector("#ato").value, days: Number(el.querySelector("#ad").value), link: el.querySelector("#al").value }, "Announcement published")) reload();
    };
    el.querySelector("#aclr")?.addEventListener("click", async () => (await act({ action: "announce", text: "" }, "Announcement cleared")) && reload());
    el.querySelector("#psend").onclick = async (e) => {
      if (!confirm(`Send this notification to ${data.pushSubs} devices?`)) return;
      e.target.disabled = true;
      const out = await act({ action: "push", title: el.querySelector("#pt").value, body: el.querySelector("#pb").value, url: el.querySelector("#pu").value });
      e.target.disabled = false;
      if (out) toast(`Sent to ${out.sent} device${out.sent === 1 ? "" : "s"}${out.gone ? ` (${out.gone} old ones removed)` : ""}`, { emoji: "🔔" });
    };
    el.querySelectorAll("[data-flag]").forEach((cb) => (cb.onchange = async () => {
      if (await act({ action: "flag", name: cb.dataset.flag, on: cb.checked }, `${data.features[cb.dataset.flag]} ${cb.checked ? "ON" : "OFF"}`)) data.config.flags = { ...data.config.flags, [cb.dataset.flag]: cb.checked };
    }));
  };

  // ---------- Events ----------
  const topicOptions = () => `<optgroup label="Whole test">${exams.map((e) => `<option value="exam:${e.id}">${esc(e.name)}</option>`).join("")}</optgroup><optgroup label="One topic">${topics.map((t) => `<option value="topic:${t.id}">${esc(t.course)}: ${esc(t.name)}</option>`).join("")}</optgroup>`;
  const events = (el) => {
    const c = data.config;
    const boost = c.xpBoost && c.xpBoost.until > Date.now() ? c.xpBoost : null;
    const ch = c.challenge && c.challenge.end > Date.now() ? c.challenge : null;
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    el.innerHTML = `
      <div class="card"><h3>⚡ Double XP</h3>${boost ? `<p><span class="tag">${boost.mult}× XP live until ${fmtDate(boost.until)}</span></p><button class="btn ghost" id="xend">End now</button>` : `
        <div class="grid-2 tight"><label class="field"><span>How long</span><select id="xh"><option value="24">24 hours</option><option value="48" selected>A weekend (48h)</option><option value="72">3 days</option><option value="168">1 week</option></select></label>
        <label class="field"><span>Boost</span><select id="xm"><option value="2">2× XP</option><option value="3">3× XP</option></select></label></div>
        <label class="field"><span>Name</span><input id="xl" maxlength="40" value="Double XP Weekend"></label><button class="btn" id="xgo">Start boost</button>`}</div>

      <div class="card"><h3>🏁 Challenge</h3>${ch ? `<p><strong>${esc(ch.emoji)} ${esc(ch.title)}</strong><br><small class="muted">Ends ${fmtDate(ch.end)} · ${ch.count} questions</small></p><button class="btn ghost" id="cend">End challenge</button>` : `
        <div class="grid-2 tight"><label class="field"><span>Title</span><input id="ct" maxlength="60" placeholder="SHSAT Sprint Week"></label><label class="field"><span>Emoji</span><input id="ce" maxlength="4" value="🏁"></label></div>
        <label class="field"><span>Description</span><input id="cdsc" maxlength="160" placeholder="15 questions. Top score by Sunday wins bragging rights."></label>
        <label class="field"><span>Questions from</span><select id="cs">${topicOptions()}</select></label>
        <div class="grid-2 tight"><label class="field"><span>Questions</span><input id="cn" type="number" min="5" max="30" value="15"></label><label class="field"><span>Runs for (days)</span><input id="cdays" type="number" min="1" max="30" value="7"></label></div>
        <button class="btn" id="cgo">Launch challenge</button>`}</div>

      <div class="card"><h3>🎉 Event card</h3><p class="small muted">A card on everyone's home screen, e.g. a citywide BrainBoro Live trivia night.</p>
        ${c.event ? `<p><strong>${esc(c.event.title)}</strong> · ${fmtDate(c.event.when)}</p>` : ""}
        <label class="field"><span>Title</span><input id="et" maxlength="80" placeholder="Citywide Trivia Night" value="${esc(c.event?.title || "")}"></label>
        <div class="grid-2 tight"><label class="field"><span>When</span><input id="ew" type="datetime-local"></label><label class="field"><span>Link</span><input id="el" maxlength="120" placeholder="#/live" value="${esc(c.event?.link || "")}"></label></div>
        <label class="field"><span>Details</span><input id="ed" maxlength="200" value="${esc(c.event?.desc || "")}"></label>
        <div class="btn-row"><button class="btn" id="ego">Post event</button>${c.event ? `<button class="btn ghost" id="eclr">Remove</button>` : ""}<a class="btn ghost" href="#/live">Host a Live game</a></div></div>

      <div class="card"><h3>⚡ Daily Brain Blast editor</h3><p class="small muted">Write a day's 5 questions yourself. Everyone gets them that day.</p>
        <label class="field"><span>Date</span><input id="dd" type="date" value="${tomorrow}"></label>
        <div id="dqs">${Array.from({ length: 5 }, (_, i) => `<div class="dq"><strong>Question ${i + 1}</strong><input data-q="${i}" maxlength="400" placeholder="Question">${[0, 1, 2, 3].map((k) => `<label class="dq-choice"><input type="radio" name="a${i}" value="${k}" ${k === 0 ? "checked" : ""} title="Correct answer"><input data-c="${i}-${k}" maxlength="140" placeholder="Choice ${"ABCD"[k]}${k < 2 ? "" : " (optional)"}"></label>`).join("")}<input data-e="${i}" maxlength="300" placeholder="Explanation (optional)"></div>`).join("")}</div>
        <p class="tiny muted">Pick the correct answer with the circle next to it.</p>
        <div class="btn-row"><button class="btn" id="dgo">Save that day's Blast</button><button class="btn ghost" id="dclr">Clear that day</button></div>
        ${Object.keys(c.daily || {}).length ? `<p class="small">Custom days: ${Object.keys(c.daily).sort().map(esc).join(", ")}</p>` : ""}</div>

      <div class="card"><h3>🏆 Seasons</h3><p class="small muted">End the Borough Wars season: the leading borough gets a trophy on the leaderboard's Trophy Wall. You're on season ${c.season}.</p>
        <button class="btn" id="season">End season ${c.season} & crown a winner</button>
        ${(c.trophies || []).length ? `<div class="list" style="margin-top:10px">${c.trophies.map((t) => `<div class="row"><span class="tile-ic" style="--accent:#f5b301">🏆</span><span class="grow"><strong>Season ${t.season}: ${esc(t.borough)}</strong><small>${t.top?.length ? `MVPs: ${t.top.map(esc).join(", ")}` : ""} · ${new Date(t.at).toLocaleDateString()}</small></span></div>`).join("")}</div>` : ""}</div>`;
    el.querySelector("#xgo")?.addEventListener("click", async () => (await act({ action: "xpBoost", hours: Number(el.querySelector("#xh").value), mult: Number(el.querySelector("#xm").value), label: el.querySelector("#xl").value }, "XP boost is live! ⚡")) && reload());
    el.querySelector("#xend")?.addEventListener("click", async () => (await act({ action: "xpBoost", hours: 0 }, "Boost ended")) && reload());
    el.querySelector("#cgo")?.addEventListener("click", async () => {
      const [kind, id] = el.querySelector("#cs").value.split(":");
      const list = kind === "exam" ? examTopicIds(exams.find((e) => e.id === id)) : [id];
      if (await act({ action: "challenge", title: el.querySelector("#ct").value, emoji: el.querySelector("#ce").value, desc: el.querySelector("#cdsc").value, topics: list.slice(0, 12), count: Number(el.querySelector("#cn").value), days: Number(el.querySelector("#cdays").value) }, "Challenge launched 🏁")) reload();
    });
    el.querySelector("#cend")?.addEventListener("click", async () => confirm("End the challenge now?") && (await act({ action: "challenge", end: true }, "Challenge ended")) && reload());
    el.querySelector("#ego").onclick = async () => {
      const when = el.querySelector("#ew").value;
      if (!when) return toast("Pick a date and time.", { emoji: "📅" });
      if (await act({ action: "event", title: el.querySelector("#et").value, when: new Date(when).toISOString(), link: el.querySelector("#el").value, desc: el.querySelector("#ed").value }, "Event posted")) reload();
    };
    el.querySelector("#eclr")?.addEventListener("click", async () => (await act({ action: "event", title: "" }, "Event removed")) && reload());
    el.querySelector("#dgo").onclick = async () => {
      const questions = Array.from({ length: 5 }, (_, i) => {
        const choices = [0, 1, 2, 3].map((k) => el.querySelector(`[data-c="${i}-${k}"]`).value.trim());
        const a = Number(el.querySelector(`input[name="a${i}"]:checked`).value);
        const kept = choices.map((c, k) => [c, k]).filter(([c]) => c);
        return { q: el.querySelector(`[data-q="${i}"]`).value.trim(), choices: kept.map(([c]) => c), a: kept.findIndex(([, k]) => k === a), exp: el.querySelector(`[data-e="${i}"]`).value.trim() };
      });
      if (await act({ action: "daily", date: el.querySelector("#dd").value, questions }, "Daily Brain Blast saved")) reload();
    };
    el.querySelector("#dclr").onclick = async () => (await act({ action: "daily", date: el.querySelector("#dd").value, clear: true }, "Cleared")) && reload();
    el.querySelector("#season").onclick = async () => {
      if (!confirm(`End season ${c.season}? The current top borough gets a trophy.`)) return;
      const out = await act({ action: "endSeason" });
      if (out) {
        toast(`🏆 ${out.trophy.borough} wins season ${out.trophy.season}!`, { emoji: "🏆", ms: 4000 });
        reload();
      }
    };
  };

  // ---------- Growth ----------
  const growth = (el) => {
    const c = data.config;
    el.innerHTML = `
      <div class="card"><h3>🎟️ Make codes</h3>
        <div class="seg wide" id="kind"><button class="on" data-k="single">One-time codes</button><button data-k="promo">Promo code</button><button data-k="partner">School partner</button></div>
        <div id="kf"></div><button class="btn" id="mk">Create</button><div id="codes"></div></div>
      <div class="card"><h3>📋 Your codes</h3>${data.codes.length ? `<div class="code-table">${data.codes.map((x) => `<div class="code-row"><code>${esc(x.code)}</code><span class="tag">${x.kind === "partner" ? `🏫 ${esc(x.partner)}` : x.kind === "promo" ? "📣 promo" : "🎟️ one-time"}</span><small>${x.used}/${x.maxUses} used · ${x.days}d${x.expires ? ` · expires ${new Date(x.expires).toLocaleDateString()}` : ""}</small></div>`).join("")}</div>` : `<p class="small muted">No codes yet.</p>`}</div>
      <div class="card"><h3>🎁 Top inviters</h3>${data.referrals.length ? data.referrals.map((r, i) => `<div class="live-lead"><span>${i + 1}. ${esc(r.name)} <small class="muted">${esc(r.email)}</small></span><strong>${r.n} friends</strong></div>`).join("") : `<p class="small muted">No referrals yet. Students share their link from Me → Invite friends.</p>`}</div>
      <div class="card"><h3>⚙️ Growth settings</h3>
        <div class="grid-2 tight"><label class="field"><span>Referral reward (Premium days each, 0 = off)</span><input id="rd" type="number" min="0" max="60" value="${c.referralDays}"></label>
        <label class="field"><span>AI meter alert (requests/day)</span><input id="aa" type="number" min="10" value="${c.aiAlert}"></label></div>
        <button class="btn" id="gs">Save settings</button></div>
      <div class="card"><h3>👑 Premium</h3><p>${data.stats.premium} premium account${data.stats.premium === 1 ? "" : "s"} out of ${data.stats.users}. Codes used: ${data.codes.reduce((n, x) => n + x.used, 0)}.</p></div>`;
    let kind = "single";
    const fields = () => {
      el.querySelector("#kf").innerHTML = kind === "single"
        ? `<div class="grid-2 tight"><label class="field"><span>How many</span><input id="cn" type="number" min="1" max="100" value="5"></label><label class="field"><span>Premium days each</span><input id="cd" type="number" min="1" max="3650" value="31"></label></div><p class="tiny muted">Each code works once. Send them to people who paid.</p>`
        : `<div class="grid-2 tight"><label class="field"><span>Code name</span><input id="cname" maxlength="24" placeholder="${kind === "partner" ? "PS123" : "FREEWEEK"}"></label><label class="field"><span>Premium days</span><input id="cd" type="number" min="1" max="3650" value="${kind === "partner" ? 300 : 7}"></label></div>
           <div class="grid-2 tight"><label class="field"><span>Max uses</span><input id="cmax" type="number" min="1" value="${kind === "partner" ? 35 : 100}"></label><label class="field"><span>Code expires in (days, 0 = never)</span><input id="cexp" type="number" min="0" value="${kind === "partner" ? 0 : 14}"></label></div>
           ${kind === "partner" ? `<label class="field"><span>School / teacher name</span><input id="cpart" maxlength="60" placeholder="PS 123 – Ms. Rivera's class"></label><p class="tiny muted">Give one code to a teacher: their whole class gets Premium, and you can see the school on the dashboard.</p>` : `<p class="tiny muted">One code anyone can use (each person once), until it hits the max or expires.</p>`}`;
    };
    fields();
    el.querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => {
      kind = b.dataset.k;
      el.querySelectorAll("[data-k]").forEach((x) => x.classList.toggle("on", x === b));
      fields();
    }));
    el.querySelector("#mk").onclick = async () => {
      const v = (id) => el.querySelector(id)?.value;
      const out = await act({ action: "createCodes", kind, count: v("#cn"), days: v("#cd"), name: v("#cname"), maxUses: v("#cmax"), expiresDays: Number(v("#cexp")) || 0, partner: v("#cpart") });
      if (!out) return;
      el.querySelector("#codes").innerHTML = `<p class="small muted" style="margin-top:12px">Link form: <code>…/#/premium?code=CODE</code></p><div class="codes">${out.codes.map(esc).join("\n")}</div><button class="btn small ghost" id="cp" style="margin-top:8px">Copy</button>`;
      el.querySelector("#cp").onclick = () => navigator.clipboard.writeText(out.codes.join("\n")).then(() => toast("Copied", { emoji: "📋" }));
      const fresh = await (await fetch("api/admin", { cache: "no-store" })).json();
      data.codes = fresh.codes;
    };
    el.querySelector("#gs").onclick = async () => (await act({ action: "settings", referralDays: Number(el.querySelector("#rd").value), aiAlert: Number(el.querySelector("#aa").value) }, "Saved")) && reload();
  };

  // ---------- Safety ----------
  const safety = (el) => {
    const KIND = { ai: "🤖 AI answer", question: "❓ Question", nickname: "🏷️ Nickname", bug: "🐞 Bug", other: "💬 Other" };
    el.innerHTML = `
      <div class="card"><h3>🚩 Report queue</h3>${data.reports.length ? data.reports.map((r) => `<div class="report"><div class="report-top"><span class="tag">${KIND[r.kind] || r.kind}</span><small class="muted">${fmtDate(r.at)} · ${esc(r.by)}${r.route ? ` · ${esc(r.route)}` : ""}</small></div>${r.text ? `<p>${esc(r.text)}</p>` : ""}${r.context ? `<p class="small muted report-ctx">${esc(r.context)}</p>` : ""}<button class="btn small ghost" data-res="${r.id}">✓ Resolve</button></div>`).join("") : `<p class="small muted">Nothing to review. 🎉</p>`}</div>
      <div class="card"><h3>🧼 Nickname filter</h3><p class="small muted">Blocks rude names in sign-ups, Live games, squads and challenges. A built-in list is always on; add your own words here (comma or new line separated).</p>
        <textarea id="bw" rows="3" class="big-text">${esc((data.config.badWords || []).join(", "))}</textarea><button class="btn" id="bws">Save filter</button></div>
      <div class="card"><h3>📜 Admin action log</h3>${data.log.length ? `<div class="log">${data.log.map((l) => `<div class="log-row"><small class="muted">${fmtDate(l.at)}</small><span><strong>${esc(l.action)}</strong> ${esc(l.detail)}</span><small class="muted">${esc(l.by)}</small></div>`).join("")}</div>` : `<p class="small muted">Nothing yet.</p>`}</div>
      <p class="tiny muted">Privacy by design: admins can't read students' Boro chats, homework photos or essays.</p>`;
    el.querySelectorAll("[data-res]").forEach((b) => (b.onclick = async () => (await act({ action: "resolveReport", id: b.dataset.res }, "Resolved")) && reload()));
    el.querySelector("#bws").onclick = async () => (await act({ action: "badWords", words: el.querySelector("#bw").value }, "Filter saved")) && reload();
  };

  // ---------- Users ----------
  const users = (el) => {
    const list = data.users.filter((u) => !q || `${u.name} ${u.email} ${u.borough} ${u.school} ${u.partner}`.toLowerCase().includes(q));
    el.innerHTML = `
      <div class="search">${icon("search", 18)}<input id="uq" placeholder="Search name, email, borough, school" value="${esc(q)}"></div>
      <p class="small muted">${list.length} of ${data.users.length} accounts · ${data.stats.google} use Google sign-in · ${BADGES.length} badges in the app</p>
      <div class="list">${list.slice(0, 200).map((u) => `
        <div class="row user-row">
          <span class="hud-avatar">${u.picture ? `<img src="${esc(u.picture)}" alt="" referrerpolicy="no-referrer">` : "👤"}</span>
          <span class="grow"><strong>${esc(u.name || "—")} ${u.admin ? `<span class="pill-premium pill-admin">admin</span>` : u.premium ? `<span class="pill-premium">premium</span>` : ""}${u.banned ? ` <span class="tag" style="--accent:var(--bad)">disabled</span>` : ""}</strong>
          <small>${esc(u.email)} · ${esc(u.borough || "no borough")}${u.partner ? ` · 🏫 ${esc(u.partner)}` : ""} · ${u.weekXp} XP this week · joined ${new Date(u.createdAt).toLocaleDateString()}</small></span>
          ${u.admin ? "" : `<span class="btns"><button class="btn small ghost" data-prem="${u.id}">${u.premium ? "−Premium" : "+30 days"}</button><button class="btn small danger" data-ban="${u.id}" data-v="${u.banned ? "" : "1"}">${u.banned ? "Enable" : "Disable"}</button></span>`}
        </div>`).join("")}</div>`;
    el.querySelector("#uq").oninput = (e) => {
      q = e.target.value.toLowerCase();
      const pos = e.target.selectionStart;
      users(el);
      const box = el.querySelector("#uq");
      box.focus();
      box.setSelectionRange(pos, pos);
    };
    el.querySelectorAll("[data-prem]").forEach((b) => (b.onclick = async () => {
      const u = data.users.find((x) => x.id === b.dataset.prem);
      if (await act({ action: "setPremium", id: u.id, days: u.premium ? 0 : 30 }, u.premium ? "Premium removed" : "30 days of Premium added")) reload();
    }));
    el.querySelectorAll("[data-ban]").forEach((b) => (b.onclick = async () => {
      if (b.dataset.v && !confirm("Disable this account? They won't be able to log in.")) return;
      if (await act({ action: "setBanned", id: b.dataset.ban, banned: Boolean(b.dataset.v) }, b.dataset.v ? "Account disabled" : "Account enabled")) reload();
    }));
  };

  root.innerHTML = `<div class="empty"><div class="spinner"></div></div>`;
  load();
}
