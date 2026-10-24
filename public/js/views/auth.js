// Sign up / log in: Google or email + password, or keep going as a guest.
import { esc, post, toast } from "../ui.js";
import { icon } from "../icons.js";
import { initAccount, hasGoogle, renderGoogleButton, finishLogin } from "../account.js";

export const BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "The Bronx", "Staten Island", "Outside NYC"];

export function loginView(root, _p, query = {}, opts = {}) {
  let mode = query.mode === "login" ? "login" : "signup";
  const onDone = opts.onDone || (() => (location.hash = `#/${query.next || ""}`));
  const draw = () => {
    root.innerHTML = `
      <section class="auth">
        <div class="auth-hero">
          <div class="mascot">🧠</div>
          <div class="logo-big">Brain<span>Boro</span></div>
          <p class="lead">SHSAT, TACHS, Regents & SAT prep, your homework planner, and an AI tutor. Free.</p>
        </div>
        <div class="gsi-wrap" id="gsi"></div>
        ${hasGoogle() ? `<div class="divider">or use email</div>` : ""}
        <div class="seg" role="tablist">
          <button class="${mode === "signup" ? "on" : ""}" data-mode="signup" role="tab" aria-selected="${mode === "signup"}">Sign up</button>
          <button class="${mode === "login" ? "on" : ""}" data-mode="login" role="tab" aria-selected="${mode === "login"}">Log in</button>
        </div>
        <form id="f" novalidate>
          ${mode === "signup" ? `<label class="field"><span>First name</span><input name="name" maxlength="40" autocomplete="given-name" placeholder="Jordan"></label>` : ""}
          <label class="field"><span>Email</span><input name="email" type="email" inputmode="email" autocomplete="email" required placeholder="you@example.com"></label>
          <label class="field"><span>Password</span><input name="password" type="password" minlength="8" autocomplete="${mode === "signup" ? "new-password" : "current-password"}" required placeholder="${mode === "signup" ? "At least 8 characters" : "Your password"}"></label>
          <p class="err" id="err" role="alert"></p>
          <button class="btn big glow" id="go">${mode === "signup" ? "Create account" : "Log in"}</button>
        </form>
        ${opts.onGuest || query.onboarding ? `<button class="link" id="guest">Continue without an account →</button>` : `<a class="link" href="#/">Not now</a>`}
        <p class="tiny muted center">Accounts save your progress across devices and put you on the Borough Wars leaderboard. Under 13? Ask a parent first.</p>
      </section>`;
    root.querySelectorAll("[data-mode]").forEach((b) => (b.onclick = () => ((mode = b.dataset.mode), draw())));
    root.querySelector("#guest")?.addEventListener("click", () => (opts.onGuest ? opts.onGuest() : (location.hash = "#/")));
    root.querySelector("#f").onsubmit = async (e) => {
      e.preventDefault();
      const form = new FormData(e.target);
      const btn = root.querySelector("#go");
      btn.disabled = true;
      root.querySelector("#err").textContent = "";
      try {
        const data = await (await post("api/auth", { action: mode, email: form.get("email"), password: form.get("password"), name: form.get("name") })).json();
        await finishLogin(data);
        onDone(data.user);
      } catch (err) {
        root.querySelector("#err").textContent = err.status === 404 ? "Accounts need the BrainBoro server (this copy is running without one)." : err.message;
        btn.disabled = false;
      }
    };
    initAccount().then(() => {
      const box = root.querySelector("#gsi");
      if (!box) return;
      if (!hasGoogle()) return box.remove();
      renderGoogleButton(box, async (data) => {
        await finishLogin(data);
        onDone(data.user);
      }).catch((err) => toast(err.message, { emoji: "⚠️" }));
      if (!root.querySelector(".divider")) box.insertAdjacentHTML("afterend", `<div class="divider">or use email</div>`);
    });
  };
  draw();
}

/** Small "log in to do this" card. */
export function loginCard(text, next = "") {
  return `<div class="card banner"><span class="tile-ic">${icon("user")}</span><span class="grow"><strong>${esc(text)}</strong><small>Free account · Google or email</small></span><a class="btn small" href="#/login?next=${encodeURIComponent(next)}">Log in</a></div>`;
}
