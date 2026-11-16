// Social: invite friends (both get Premium days), the admin's challenge with its leaderboard, and study squads.
import { state, save, addXp } from "../store.js";
import { esc, toast, post, share, baseUrl } from "../ui.js";
import { icon } from "../icons.js";
import { buildQuiz } from "../content.js";
import { user, initAccount } from "../account.js";
import { appConfig, device } from "../appconfig.js";
import { runQuiz } from "./study.js";
import { loginCard } from "./auth.js";

const call = async (body) => (await post("api/app", { device: device(), ...body })).json();

// ---------- Invite ----------
export async function inviteView(root) {
  root.innerHTML = `<div class="empty"><div class="spinner"></div></div>`;
  await initAccount();
  const days = appConfig().referralDays ?? 7;
  const inv = state.invite;
  if (!user() || !inv) {
    root.innerHTML = `<a class="back" href="#/me">${icon("back", 18)} Me</a><h1 class="page-title">🎁 Invite friends</h1>${loginCard("Log in to get your invite link", "invite")}`;
    return;
  }
  const link = `${baseUrl()}#/login?ref=${inv.code}`;
  root.innerHTML = `
    <a class="back" href="#/me">${icon("back", 18)} Me</a>
    <div class="invite-hero"><div class="big-emoji">🎁</div><h1>Invite friends, get Premium</h1>
    <p class="lead">${days ? `When a friend signs up with your link, you <strong>both</strong> get ${days} days of Premium.` : "Share BrainBoro with your friends!"}</p></div>
    <div class="card center"><span class="small muted">Your code</span><div class="invite-code">${esc(inv.code)}</div>
      <div class="btn-row" style="justify-content:center"><button class="btn" id="sh">${icon("share", 18)} Share my link</button><button class="btn ghost" id="cp">${icon("link", 18)} Copy</button></div></div>
    <div class="stat-row"><div class="stat"><div class="stat-v">${inv.count}</div><div class="stat-l">friends joined</div></div><div class="stat"><div class="stat-v">${inv.count * days}</div><div class="stat-l">Premium days earned</div></div></div>`;
  root.querySelector("#sh").onclick = () => share({ title: "BrainBoro", text: "I'm using BrainBoro for test prep 🧠 Join with my link and we both get free Premium:", url: link });
  root.querySelector("#cp").onclick = () => navigator.clipboard?.writeText(link).then(() => toast("Link copied", { emoji: "📋" }));
}

// ---------- Challenge ----------
export function challengeView(root) {
  const ch = appConfig().challenge;
  if (!ch) {
    root.innerHTML = `<a class="back" href="#/">${icon("back", 18)} Home</a><div class="empty"><div class="big-emoji">🏁</div><h2>No challenge right now</h2><p class="muted">Watch the home screen. The next one drops soon!</p></div>`;
    return;
  }
  const left = Math.max(0, Math.ceil((ch.end - Date.now()) / 86400000));
  let cleanup = null;
  const intro = async () => {
    root.innerHTML = `
      <a class="back" href="#/">${icon("back", 18)} Home</a>
      <div class="challenge-hero"><div class="big-emoji">${esc(ch.emoji)}</div><h1>${esc(ch.title)}</h1><p>${esc(ch.desc || "")}</p><span class="tag">${left} day${left === 1 ? "" : "s"} left · ${ch.count} questions</span></div>
      <button class="btn big" id="go" style="width:100%">Play the challenge</button>
      <section class="section"><div class="section-head"><h2>🏆 Leaderboard</h2></div><div id="lb" class="card"><div class="spinner"></div></div></section>`;
    root.querySelector("#go").onclick = play;
    try {
      board(await call({ action: "challengeBoard", id: ch.id }));
    } catch {
      root.querySelector("#lb").innerHTML = `<p class="muted small">Leaderboard unavailable offline.</p>`;
    }
  };
  const board = (b) => {
    const el = root.querySelector("#lb");
    if (el) el.innerHTML = b.leaders.length ? b.leaders.map((l, i) => `<div class="live-lead ${l.me ? "me" : ""}"><span>${["🥇", "🥈", "🥉"][i] || `${i + 1}.`} ${esc(l.name)}${l.me ? " (you)" : ""}</span><strong>${l.score}/${ch.count}</strong></div>`).join("") : `<p class="muted small">Be the first on the board!</p>`;
  };
  const play = () => {
    const qs = ch.questions?.length ? ch.questions : buildQuiz(ch.topics, ch.count, `${ch.id}`);
    cleanup = runQuiz(root, qs, {
      title: ch.title,
      back: "#/challenge",
      onFinish: async (r, extra) => {
        addXp(r.correct * 3);
        try {
          const b = await call({ action: "challengeScore", id: ch.id, score: r.correct, total: qs.length });
          extra.innerHTML = `<div class="card" style="text-align:left"><h3>🏆 Challenge leaderboard</h3><div id="lb"></div></div>`;
          board(b);
        } catch (err) {
          toast(err.message, { emoji: "⚠️" });
        }
      },
    });
  };
  intro();
  return () => cleanup?.();
}

export function challengeCard() {
  const ch = appConfig().challenge;
  return ch ? `<a class="card banner challenge-card" href="#/challenge"><span class="tile-ic" style="--accent:#f59e0b">${esc(ch.emoji)}</span><span class="grow"><strong>${esc(ch.title)}</strong><small>Limited-time challenge · climb the leaderboard</small></span><span class="chev">${icon("chevron")}</span></a>` : "";
}
export function eventCard() {
  const ev = appConfig().event;
  if (!ev) return "";
  const when = new Date(ev.when);
  return `<${ev.link ? `a href="${esc(ev.link)}"` : "div"} class="card banner event-card"><span class="tile-ic" style="--accent:#ec4899">🎉</span><span class="grow"><strong>${esc(ev.title)}</strong><small>${when.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} at ${when.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}${ev.desc ? ` · ${esc(ev.desc)}` : ""}</small></span></${ev.link ? "a" : "div"}>`;
}

// ---------- Study squads ----------
export function squadsView(root) {
  const name = state.profile.name || user()?.name || "Student";
  const show = (sq) => {
    const meIn = sq.members.find((m) => m.me);
    root.innerHTML = `
      <a class="back" href="#/">${icon("back", 18)} Home</a>
      <div class="squad-hero"><h1>🤝 ${esc(sq.name)}</h1><p class="lead">Team streak: <strong>${sq.streak} day${sq.streak === 1 ? "" : "s"}</strong> 🔥</p><span class="tag">Code: ${esc(sq.code)}</span></div>
      ${meIn && !meIn.today ? `<button class="btn big" id="ci" style="width:100%">✅ I studied today</button>` : `<div class="card ok-card">✅ You checked in today. Nice!</div>`}
      <div class="list" style="margin-top:12px">${sq.members.map((m) => `<div class="row"><span class="tile-ic" style="--accent:${m.today ? "#12a150" : "#9ca3af"}">${m.today ? "✅" : "⏳"}</span><span class="grow"><strong>${esc(m.name)}${m.me ? " (you)" : ""}</strong><small>${m.week}/7 days this week</small></span></div>`).join("")}</div>
      <p class="tiny muted">The team streak grows on days when at least half the squad studies.</p>
      <div class="btn-row wrap"><button class="btn ghost" id="inv">${icon("share", 18)} Invite to squad</button><button class="btn ghost danger" id="lv">Leave</button></div>`;
    root.querySelector("#ci")?.addEventListener("click", async () => {
      try {
        show(await call({ action: "squadCheckin", code: sq.code }));
        addXp(10);
        toast("Checked in for your squad! +10 XP", { emoji: "🤝" });
      } catch (err) {
        toast(err.message, { emoji: "⚠️" });
      }
    });
    root.querySelector("#inv").onclick = () => share({ title: "Join my study squad", text: `Join my BrainBoro study squad "${sq.name}"! Code: ${sq.code}`, url: `${baseUrl()}#/squads?join=${sq.code}` });
    root.querySelector("#lv").onclick = async () => {
      if (!confirm("Leave this squad?")) return;
      await call({ action: "squadLeave", code: sq.code }).catch(() => {});
      state.squad = null;
      save();
      start();
    };
  };
  const start = (join = "") => {
    root.innerHTML = `
      <a class="back" href="#/">${icon("back", 18)} Home</a>
      <h1 class="page-title">🤝 Study squads</h1>
      <p class="lead">Team up with up to 8 friends. Check in every day you study and build a team streak together.</p>
      <div class="card"><strong>Join a squad</strong><div class="composer-row" style="margin-top:8px"><input id="jc" maxlength="6" placeholder="Squad code" value="${esc(join)}" style="flex:1;border:0;background:transparent;padding:9px 8px;outline:none;text-transform:uppercase"><button class="btn small" id="jb">Join</button></div></div>
      <div class="divider">or</div>
      <div class="card"><strong>Start a squad</strong><input id="sn" maxlength="30" placeholder="Squad name (e.g. Bronx Brains)" class="big-input"><button class="btn" id="mk" style="margin-top:8px">Create squad</button></div>`;
    const go = async (body) => {
      try {
        const sq = await call({ name, ...body });
        state.squad = sq.code;
        save();
        show(sq);
      } catch (err) {
        toast(err.message, { emoji: "⚠️" });
      }
    };
    root.querySelector("#jb").onclick = () => go({ action: "squadJoin", code: root.querySelector("#jc").value.trim() });
    root.querySelector("#mk").onclick = () => go({ action: "squadCreate", title: root.querySelector("#sn").value.trim() });
  };
  const q = new URLSearchParams(location.hash.split("?")[1] || "");
  if (state.squad) {
    root.innerHTML = `<div class="empty"><div class="spinner"></div></div>`;
    call({ action: "squadState", code: state.squad })
      .then(show)
      .catch(() => {
        state.squad = null;
        save();
        start(q.get("join") || "");
      });
  } else start(q.get("join") || "");
}
