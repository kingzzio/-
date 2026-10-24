// Borough Wars: weekly XP standings by borough and top students.
import { esc } from "../ui.js";
import { user, syncNow } from "../account.js";
import { BORO_COLORS } from "./home.js";
import { BOROUGHS, loginCard } from "./auth.js";

export default function leaderboard(root) {
  root.innerHTML = `<h1 class="page-title">🏆 Borough Wars</h1><p class="lead">Every XP you earn this week counts for your borough. Resets every Monday.</p><div id="lb"><div class="empty"><div class="spinner"></div></div></div>`;
  const draw = (lb) => {
    const u = user();
    const box = root.querySelector("#lb");
    if (!lb) {
      box.innerHTML = `<div class="card warn small">The leaderboard needs the BrainBoro server.</div>`;
      return;
    }
    const max = Math.max(1, ...lb.boroughs.map((b) => b.xp));
    box.innerHTML = `
      <div class="card"><div class="boro-bars">${lb.boroughs.map((b, i) => `<div class="boro-bar" style="--accent:${BORO_COLORS[b.name]}"><span>${["🥇", "🥈", "🥉"][i] || ""} ${esc(b.name)}</span><div class="bar"><div class="bar-fill" style="width:${Math.max(3, (b.xp / max) * 100)}%"></div></div><span>${b.xp.toLocaleString()}</span></div>`).join("")}</div></div>
      ${!u ? loginCard("Log in to rep your borough", "leaderboard") : !u.borough ? `<div class="card"><strong>Pick your borough</strong><div class="chip-row" style="margin-top:8px">${BOROUGHS.map((b) => `<button class="chip" data-b="${esc(b)}">${esc(b)}</button>`).join("")}</div></div>` : `<p class="center small muted">You're repping <strong>${esc(u.borough)}</strong> · ${lb.myXp.toLocaleString()} XP this week</p>`}
      <section class="section"><div class="section-head"><h2>Top students this week</h2></div>
      ${lb.players.length ? `<div class="list">${lb.players.map((p, i) => `<div class="row" ${p.me ? 'style="background:var(--brand-soft)"' : ""}><span class="em" style="width:28px;text-align:center;font-weight:800;font-size:1rem">${["🥇", "🥈", "🥉"][i] || i + 1}</span><span class="grow"><strong>${esc(p.name)}${p.me ? " (you)" : ""}</strong><small>${esc(p.borough || "")}</small></span><strong>${p.xp.toLocaleString()} XP</strong></div>`).join("")}</div>` : `<div class="empty"><p>No one's on the board yet this week. Be first!</p></div>`}</section>`;
    box.querySelectorAll("[data-b]").forEach((b) => (b.onclick = async () => {
      await syncNow({ borough: b.dataset.b });
      load();
    }));
  };
  const load = () => fetch("api/leaderboard", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then(draw).catch(() => draw(null));
  load();
}

