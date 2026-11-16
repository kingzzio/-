// Remote app settings from the admin (announcement, feature switches, Double XP, events, Daily Brain Blast
// override, challenge, trophies), plus anonymous usage counts, the report form and push sign-up.
import { state, save, setXpMult } from "./store.js";
import { esc, toast } from "./ui.js";

const CACHE = "brainboro:cfg";
let cfg = (() => {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(CACHE) || "{}");
  } catch {
    return {};
  }
})();
const listeners = new Set();

export const appConfig = () => cfg;
export const onConfig = (fn) => listeners.add(fn);
export const flagOn = (name) => cfg.flags?.[name] !== false;

function apply() {
  setXpMult(cfg.xpBoost && cfg.xpBoost.until > Date.now() ? cfg.xpBoost.mult : 1);
  drawBanner();
  listeners.forEach((fn) => fn(cfg));
}

export async function loadConfig() {
  apply(); // cached copy first, so the banner shows instantly
  try {
    const res = await fetch("api/app", { cache: "no-store" });
    if (!res.ok) return;
    cfg = await res.json();
    try {
      localStorage.setItem(CACHE, JSON.stringify(cfg));
    } catch {
      /* private mode */
    }
    apply();
  } catch {
    /* offline: keep the cached copy */
  }
}

// ---------- Banner (announcement, Double XP) ----------
function drawBanner() {
  const el = document.getElementById("banner");
  if (!el) return;
  const a = cfg.announcement;
  const dismissed = (state.dismissed || []).includes(a?.id);
  const boost = cfg.xpBoost && cfg.xpBoost.until > Date.now() ? cfg.xpBoost : null;
  const parts = [];
  if (boost) {
    const hrs = Math.max(1, Math.round((boost.until - Date.now()) / 3600000));
    parts.push(`<div class="bnr party"><span>⚡ <strong>${esc(boost.label)}</strong>: everything earns ${boost.mult}× XP for ${hrs > 48 ? `${Math.round(hrs / 24)} more days` : `${hrs} more hour${hrs === 1 ? "" : "s"}`}!</span></div>`);
  }
  if (a && !dismissed) {
    const body = `<span>${a.tone === "party" ? "🎉" : a.tone === "warn" ? "⚠️" : "📣"} ${esc(a.text)}</span>`;
    parts.push(`<div class="bnr ${esc(a.tone)}">${a.link ? `<a href="${esc(a.link)}">${body}</a>` : body}<button class="bnr-x" aria-label="Dismiss" data-dismiss="${a.id}">✕</button></div>`);
  }
  el.innerHTML = parts.join("");
  el.querySelector("[data-dismiss]")?.addEventListener("click", (e) => {
    state.dismissed = [...(state.dismissed || []), Number(e.currentTarget.dataset.dismiss)].slice(-20);
    save();
    drawBanner();
  });
}

// ---------- Anonymous usage counts ----------
const deviceId = () => {
  if (!state.device) {
    state.device = Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => b.toString(16).padStart(2, "0")).join("");
    save();
  }
  return state.device;
};
let features = {};
let answers = [];
export function trackFeature(name) {
  if (!/^[a-z][a-z-]{0,23}$/.test(name)) return;
  features[name] = (features[name] || 0) + 1;
}
function flush(beacon = false) {
  if (!Object.keys(features).length && !answers.length) return;
  const body = JSON.stringify({ action: "track", device: deviceId(), features, answers });
  features = {};
  answers = [];
  try {
    if (beacon && navigator.sendBeacon) navigator.sendBeacon("api/app", new Blob([body], { type: "application/json" }));
    else fetch("api/app", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {
    /* ignore */
  }
}
// Browser only (scripts import content.js, which imports this module, under Node).
if (typeof window !== "undefined") {
  addEventListener("bb:answer", (e) => {
    const { q, ok } = e.detail;
    if (q?.q && answers.length < 60) answers.push({ q: String(q.q).slice(0, 220), t: q.topicId || "", ok });
  });
  setInterval(flush, 25000);
  addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flush(true));
}

// ---------- Report a problem ----------
export function openReport({ kind = "other", context = "" } = {}) {
  const wrap = document.createElement("div");
  wrap.className = "modal";
  wrap.innerHTML = `
    <form class="modal-card" id="rep">
      <h2>Report a problem</h2>
      <p class="small muted">Thanks for helping make BrainBoro better. Don't include personal info.</p>
      <label class="field"><span>What's wrong?</span><select id="rk">
        ${[["question", "A question or answer is wrong"], ["ai", "An AI answer was wrong or not OK"], ["nickname", "A rude name or player"], ["bug", "Something is broken"], ["other", "Something else"]].map(([k, l]) => `<option value="${k}" ${k === kind ? "selected" : ""}>${l}</option>`).join("")}
      </select></label>
      <label class="field"><span>Tell us more</span><textarea id="rt" rows="3" maxlength="600" placeholder="What happened?"></textarea></label>
      <div class="btn-row"><button type="button" class="btn ghost" id="rc">Cancel</button><button class="btn">Send report</button></div>
    </form>`;
  document.body.append(wrap);
  const close = () => wrap.remove();
  wrap.querySelector("#rc").onclick = close;
  wrap.onclick = (e) => {
    if (e.target === wrap) close();
  };
  wrap.querySelector("#rt").focus();
  wrap.querySelector("#rep").onsubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("api/app", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "report", kind: wrap.querySelector("#rk").value, text: wrap.querySelector("#rt").value, context: String(context).slice(0, 600), route: location.hash.slice(0, 80) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast("Report sent. Thank you!", { emoji: "🙏" });
      close();
    } catch (err) {
      toast(err.message || "Couldn't send. Try again later.", { emoji: "⚠️" });
    }
  };
}

// ---------- Push notifications ----------
export const pushSupported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
export async function enablePush() {
  if (!pushSupported()) throw new Error(/iPhone|iPad/.test(navigator.userAgent) ? "On iPhone, add BrainBoro to your Home Screen first, then turn this on from the app." : "This browser can't do notifications.");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Notifications are blocked. Turn them on in your phone's settings.");
  const reg = await navigator.serviceWorker.ready;
  const { key } = await (await fetch("api/app", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "vapid" }) })).json();
  const raw = atob(key.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(key.length / 4) * 4, "="));
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: Uint8Array.from(raw, (c) => c.charCodeAt(0)) });
  const res = await fetch("api/app", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "subscribe", subscription: sub.toJSON() }) });
  if (!res.ok) throw new Error("Couldn't turn on notifications.");
  state.settings.push = true;
  save();
}

export const device = deviceId;
