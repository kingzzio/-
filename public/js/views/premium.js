// BrainBoro Premium: perks, purchase link and code redemption.
import { state, save, isPremium } from "../store.js";
import { esc, toast, confetti, post, serverStatus, resetServerStatus } from "../ui.js";
import { user } from "../account.js";

const premiumEnd = () => user()?.premiumUntil || state.premium.exp || 0;

const PERKS = [
  ["📸", "Unlimited Solve", "Snap any homework problem and get a step-by-step whiteboard walkthrough"],
  ["🕹️", "Cheat Codes", "Every animated shortcut walkthrough, plus a Cheat Code for ANY question you miss"],
  ["🤖", "5× more Boro", "A much bigger hourly AI tutor allowance"],
  ["✨", "Unlimited AI quizzes", "Fresh questions on any topic, whenever you want"],
  ["📅", "Smart planner", "Scan a worksheet or auto-break any assignment into steps"],
];

export default function premium(root, _p, query) {
  const active = isPremium();
  root.innerHTML = `
    <a class="back" href="#/">← Home</a>
    <section class="premium-hero">
      <div class="big-emoji">👑</div>
      <h1>BrainBoro Premium</h1>
      <p class="lead">${user()?.admin ? "You're the admin. Every feature is unlocked." : active ? `You're Premium${premiumEnd() ? ` until ${new Date(premiumEnd()).toLocaleDateString()}` : ""}. Go get those scores.` : "Unlock the shortcuts top scorers use."}</p>
    </section>
    <div class="perks">${PERKS.map(([e, t, d]) => `<div class="perk"><span class="em">${e}</span><span><strong>${t}</strong><small>${d}</small></span></div>`).join("")}</div>
    <div id="buy"></div>
    <section class="card redeem">
      <h3>Have a code?</h3>
      <div class="composer-row"><input id="code" placeholder="Enter your Premium code" autocomplete="off" value="${esc(query.code || "")}" aria-label="Premium code"><button class="btn small" id="go">Redeem</button></div>
      <p class="tiny muted">Ask a parent or guardian before buying anything. Your membership is saved on this device; back up your progress from the Me tab to move it.</p>
    </section>`;

  serverStatus().then((s) => {
    const buy = root.querySelector("#buy");
    if (active) return;
    if (s.checkoutUrl) buy.innerHTML = `<a class="btn big" href="${esc(s.checkoutUrl)}" target="_blank" rel="noopener">Get Premium 👑</a><p class="tiny muted center">After checkout you'll get a code to enter below.</p>`;
    else if (!s.premium) buy.innerHTML = `<div class="card warn small">Premium isn't open on this site yet. The site owner can turn it on (see the README).</div>`;
  });

  const redeem = async () => {
    const code = root.querySelector("#code").value.trim();
    if (!code) return;
    try {
      if (user()) {
        // Logged in: the code goes on your account, so Premium follows you to every device.
        const data = await (await post("api/me", { action: "redeem", code })).json();
        state.account = { user: data.user };
      } else {
        const data = await (await post("api/premium", { code })).json();
        state.premium = { token: data.token, exp: data.exp };
      }
      save();
      resetServerStatus();
      confetti();
      toast("Welcome to Premium!", { emoji: "👑" });
      premium(root, _p, {});
    } catch (err) {
      toast(err.message, { emoji: "⚠️" });
    }
  };
  root.querySelector("#go").onclick = redeem;
  root.querySelector("#code").onkeydown = (e) => e.key === "Enter" && redeem();
  if (query.code && !active) redeem();
}
