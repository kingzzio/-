// Admin dashboard: stats, users, premium grants, bans, and Premium code generation.
import { esc, toast, post } from "../ui.js";
import { icon } from "../icons.js";
import { isAdmin, initAccount } from "../account.js";

export default function admin(root) {
  let data = null;
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
  const draw = () => {
    const s = data.stats;
    const users = data.users.filter((u) => !q || `${u.name} ${u.email} ${u.borough}`.toLowerCase().includes(q));
    root.innerHTML = `
      <a class="back" href="#/me">${icon("back", 18)} Me</a>
      <h1 class="page-title" style="display:flex;align-items:center;gap:8px">${icon("shield", 26)} Admin</h1>
      <div class="admin-stats">
        <div class="stat"><div class="stat-v">${s.users}</div><div class="stat-l">users</div></div>
        <div class="stat"><div class="stat-v">${s.newToday}</div><div class="stat-l">new today</div></div>
        <div class="stat"><div class="stat-v">${s.premium}</div><div class="stat-l">premium</div></div>
        <div class="stat"><div class="stat-v">${s.google}</div><div class="stat-l">Google sign-ins</div></div>
      </div>
      <div class="card banner" style="margin-top:10px"><span class="tile-ic" style="--accent:${s.ai?.length ? "#12a150" : "#e5294f"}">${icon("spark")}</span><span class="grow"><strong>AI: ${s.ai?.length ? esc(s.ai.join(" → ")) : "off"}</strong><small>${s.ai?.length ? "Tried in this order. If one is out of free uses, the next takes over." : "Add a free GEMINI_API_KEY in Vercel to turn on AI (see SETUP.md)."}</small></span></div>
      ${s.db === "file" ? `<div class="card warn small"><strong>Heads up:</strong> accounts are saved in a local file. On Vercel that resets, so add a free Upstash Redis (see the README) before you launch.</div>` : ""}

      <section class="section">
        <div class="section-head"><h2>Premium codes</h2></div>
        <div class="card">
          <div class="grid-2 tight">
            <label class="field"><span>How many</span><input id="cn" type="number" min="1" max="100" value="5"></label>
            <label class="field"><span>Days each</span><input id="cd" type="number" min="1" max="3650" value="31"></label>
          </div>
          <button class="btn" id="mk">Generate codes</button>
          <div id="codes"></div>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Users</h2><span class="muted small">${users.length}</span></div>
        <div class="search">${icon("search", 18)}<input id="uq" placeholder="Search name, email, borough" value="${esc(q)}"></div>
        <div class="list">${users.slice(0, 200).map((u) => `
          <div class="row user-row">
            <span class="hud-avatar">${u.picture ? `<img src="${esc(u.picture)}" alt="" referrerpolicy="no-referrer">` : "👤"}</span>
            <span class="grow"><strong>${esc(u.name || "—")} ${u.admin ? `<span class="pill-premium pill-admin">admin</span>` : u.premium ? `<span class="pill-premium">premium</span>` : ""}${u.banned ? ` <span class="tag" style="--accent:var(--bad)">disabled</span>` : ""}</strong>
            <small>${esc(u.email)} · ${esc(u.borough || "no borough")} · ${u.weekXp} XP this week · joined ${new Date(u.createdAt).toLocaleDateString()}</small></span>
            ${u.admin ? "" : `<span class="btns"><button class="btn small ghost" data-prem="${u.id}">${u.premium ? "−Premium" : "+30 days"}</button><button class="btn small danger" data-ban="${u.id}" data-v="${u.banned ? "" : "1"}">${u.banned ? "Enable" : "Disable"}</button></span>`}
          </div>`).join("")}</div>
      </section>`;
    root.querySelector("#uq").oninput = (e) => {
      q = e.target.value.toLowerCase();
      const pos = e.target.selectionStart;
      draw();
      const el = root.querySelector("#uq");
      el.focus();
      el.setSelectionRange(pos, pos);
    };
    root.querySelector("#mk").onclick = async () => {
      const out = await act({ action: "createCodes", count: root.querySelector("#cn").value, days: root.querySelector("#cd").value });
      if (out) {
        root.querySelector("#codes").innerHTML = `<p class="small muted" style="margin-top:12px">Send these to buyers. Each works once. Link form: <code>…/#/premium?code=CODE</code></p><div class="codes">${out.codes.join("\n")}</div><button class="btn small ghost" id="cp" style="margin-top:8px">Copy</button>`;
        root.querySelector("#cp").onclick = () => navigator.clipboard.writeText(out.codes.join("\n")).then(() => toast("Copied", { emoji: "📋" }));
      }
    };
    root.querySelectorAll("[data-prem]").forEach((b) => (b.onclick = async () => {
      const u = data.users.find((x) => x.id === b.dataset.prem);
      if (await act({ action: "setPremium", id: u.id, days: u.premium ? 0 : 30 }, u.premium ? "Premium removed" : "30 days of Premium added")) load();
    }));
    root.querySelectorAll("[data-ban]").forEach((b) => (b.onclick = async () => {
      if (b.dataset.v && !confirm("Disable this account? They won't be able to log in.")) return;
      if (await act({ action: "setBanned", id: b.dataset.ban, banned: Boolean(b.dataset.v) }, b.dataset.v ? "Account disabled" : "Account enabled")) load();
    }));
  };
  root.innerHTML = `<div class="empty"><div class="spinner"></div></div>`;
  load();
}
