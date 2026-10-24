// Client side of accounts: who's logged in, Google sign-in button, and syncing progress to the server.
import { state, save, onChange } from "./store.js";
import { post, toast, resetServerStatus } from "./ui.js";

const SYNC_KEYS = ["profile", "xp", "streak", "goal", "cards", "topics", "mistakes", "badges", "tests", "daily", "stats", "planner"];
let googleClientId = "";
let syncTimer = null;
let ready = null;

export const user = () => state.account?.user || null;
export const isAdmin = () => Boolean(user()?.admin);

function snapshot() {
  const out = Object.fromEntries(SYNC_KEYS.map((k) => [k, state[k]]));
  // Canvas tokens stay on this device only.
  out.planner = { ...state.planner, connections: (state.planner.connections || []).map(({ token, ...c }) => c) };
  return out;
}

function adopt(progress) {
  if (!progress) return;
  // Keep whichever copy has more XP, so logging in on a new phone brings your progress along.
  if ((progress.xp || 0) > (state.xp || 0)) {
    const localConnections = state.planner.connections || [];
    for (const k of SYNC_KEYS) if (progress[k] !== undefined) state[k] = progress[k];
    state.planner.connections = (state.planner.connections || []).map((c) => ({ ...c, token: localConnections.find((l) => l.id === c.id)?.token || "" }));
  }
}

/** Loads the current session once at startup. Safe when there's no server (static hosting). */
export function initAccount() {
  ready ??= fetch("api/me", { credentials: "same-origin", cache: "no-store" })
    .then((r) => (r.ok ? r.json() : {}))
    .then((data) => {
      googleClientId = data.googleClientId || "";
      if (data.user) {
        state.account = { user: data.user };
        adopt(data.progress);
        state.profile.onboarded = true;
        if (data.user.name && !state.profile.name) state.profile.name = data.user.name;
      } else if (state.account) {
        state.account = null;
      }
      save();
      return data.user || null;
    })
    .catch(() => null);
  return ready;
}

export const hasGoogle = () => Boolean(googleClientId);
export const getGoogleClientId = () => googleClientId;

export async function finishLogin(data) {
  state.account = { user: data.user };
  state.profile.onboarded = true;
  if (data.user.name) state.profile.name ||= data.user.name;
  // Pull saved progress, then push the merged copy back.
  try {
    const me = await (await fetch("api/me", { cache: "no-store" })).json();
    adopt(me.progress);
    state.account = { user: me.user || data.user };
  } catch {
    /* offline: keep local */
  }
  save();
  resetServerStatus();
  syncNow();
  toast(`Welcome${data.user.name ? `, ${data.user.name}` : ""}!`, { emoji: "👋" });
}

export async function logout() {
  try {
    await post("api/auth", { action: "logout" });
  } catch {
    /* ignore */
  }
  state.account = null;
  save();
  resetServerStatus();
}

export async function syncNow(profile) {
  clearTimeout(syncTimer);
  if (!user()) return;
  try {
    const data = await (await post("api/me", { action: "save", progress: snapshot(), profile })).json();
    state.account = { user: data.user };
    save(true);
  } catch (err) {
    if (err.status === 401) {
      state.account = null;
      save(true);
    }
  }
}

// Debounced background sync whenever progress changes.
onChange((_s, quiet) => {
  if (quiet || !user()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncNow(), 4000);
});
window.addEventListener("pagehide", () => {
  if (user() && syncTimer) navigator.sendBeacon?.("api/me", new Blob([JSON.stringify({ action: "save", progress: snapshot() })], { type: "application/json" }));
});

// ---------- Google Identity Services ----------
let gsiLoading = null;
export function loadGoogle() {
  gsiLoading ??= new Promise((resolve, reject) => {
    if (window.google?.accounts) return resolve(window.google);
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve(window.google);
    s.onerror = () => reject(new Error("Couldn't load Google sign-in."));
    document.head.appendChild(s);
  });
  return gsiLoading;
}

/** Renders the official "Sign in with Google" button into `el`. */
export async function renderGoogleButton(el, onDone) {
  if (!googleClientId) return false;
  const google = await loadGoogle();
  google.accounts.id.initialize({
    client_id: googleClientId,
    callback: async ({ credential }) => {
      try {
        onDone(await (await post("api/auth", { action: "google", credential })).json());
      } catch (err) {
        toast(err.message, { emoji: "⚠️" });
      }
    },
  });
  google.accounts.id.renderButton(el, { theme: "outline", size: "large", shape: "pill", text: "continue_with", width: Math.min(360, el.clientWidth || 320) });
  return true;
}

/** Asks Google for a short-lived access token with extra scopes (e.g. Google Classroom). */
export async function googleAccessToken(scopes) {
  if (!googleClientId) throw new Error("Google isn't set up on this site yet.");
  const google = await loadGoogle();
  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: scopes.join(" "),
      hint: user()?.email,
      callback: (resp) => (resp.error ? reject(new Error(resp.error_description || "Google didn't give access.")) : resolve(resp.access_token)),
      error_callback: (e) => reject(new Error(e?.message || "Google sign-in was closed.")),
    });
    client.requestAccessToken();
  });
}
