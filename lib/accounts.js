// Account endpoints: auth, profile/progress sync, premium redemption, leaderboards, admin.
import { randomBytes } from "node:crypto";
import * as db from "./db.js";
import { AuthError, clearCookie, currentUser, getUser, googleClientId, googleLogin, hasPremium, isAdmin, listUsers, login, publicUser, saveUser, sessionCookie, signup } from "./auth.js";

export const BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "The Bronx", "Staten Island", "Outside NYC"];
const MAX_PROGRESS = 400_000;
const WEEKLY_XP_CAP = 20000; // progress is tracked on the device, so cap what one week can count

export function weekKey(d = new Date()) {
  // ISO-ish week number, keyed by the Monday that starts it.
  const day = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
}

/** Records XP for this week's leaderboards. */
async function trackXp(user, xp) {
  const wk = weekKey();
  if (user.weekKey !== wk) {
    user.weekKey = wk;
    user.weekStartXp = Math.min(user.lastXp ?? xp, xp);
    user.weekXp = 0;
  }
  const weekly = Math.max(0, Math.min(WEEKLY_XP_CAP, xp - (user.weekStartXp ?? xp)));
  const delta = weekly - (user.weekXp || 0);
  user.weekXp = weekly;
  user.lastXp = xp;
  if (delta) {
    await db.zset(`lb:players:${wk}`, user.id, weekly);
    if (user.borough) await db.zincr(`lb:boro:${wk}`, user.borough, delta);
  }
}

export async function leaderboard(me) {
  const wk = weekKey();
  const top = await db.ztop(`lb:players:${wk}`, 25);
  const players = (await Promise.all(top.map(async ([id, xp]) => {
    const u = await getUser(id);
    return u && { name: u.name || "Student", borough: u.borough || "", xp, me: me?.id === id, picture: u.picture || "" };
  }))).filter(Boolean);
  const boroughs = Object.fromEntries((await db.ztop(`lb:boro:${wk}`, 10)).map(([b, xp]) => [b, xp]));
  return { week: wk, players, boroughs: BOROUGHS.filter((b) => b !== "Outside NYC").map((b) => ({ name: b, xp: boroughs[b] || 0 })).sort((a, b) => b.xp - a.xp), myXp: me?.weekXp || 0 };
}

async function redeemCode(user, code) {
  const clean = String(code || "").trim().toUpperCase();
  if (!clean) throw new AuthError("Enter a code.");
  const envCodes = (process.env.BRAINBORO_PREMIUM_CODES || "").split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
  let days = Number(process.env.BRAINBORO_PREMIUM_DAYS || 31);
  const stored = await db.get(`code:${clean}`);
  if (stored) {
    if (stored.usedBy) throw new AuthError("That code was already used.");
    days = stored.days;
    await db.set(`code:${clean}`, { ...stored, usedBy: user.id, usedAt: Date.now() });
  } else if (!envCodes.includes(clean)) throw new AuthError("That code didn't work. Check it and try again.");
  user.premiumUntil = Math.max(Date.now(), user.premiumUntil || 0) + days * 86400000;
  await saveUser(user);
}

export async function handleAuth(body) {
  switch (body.action) {
    case "signup": {
      const user = await signup(body);
      return { user, cookie: sessionCookie(user) };
    }
    case "login": {
      const user = await login(body);
      return { user, cookie: sessionCookie(user) };
    }
    case "google": {
      const user = await googleLogin(body.credential);
      return { user, cookie: sessionCookie(user) };
    }
    case "logout":
      return { user: null, cookie: clearCookie() };
    default:
      throw new AuthError("Unknown action.");
  }
}

export async function handleMe(req, body) {
  const user = await currentUser(req);
  if (!body) {
    // GET: who am I + saved progress
    if (!user) return { user: null, googleClientId: googleClientId() };
    return { user: publicUser(user), progress: await db.get(`progress:${user.id}`), googleClientId: googleClientId() };
  }
  if (!user) throw new AuthError("Log in first.", 401);
  if (body.action === "save") {
    if (body.profile) {
      const { name, borough, school } = body.profile;
      if (typeof name === "string" && name.trim()) user.name = name.trim().slice(0, 40);
      if (BOROUGHS.includes(borough)) user.borough = borough;
      if (typeof school === "string") user.school = school.trim().slice(0, 80);
    }
    if (body.progress) {
      const text = JSON.stringify(body.progress);
      if (text.length > MAX_PROGRESS) throw new AuthError("Progress is too big to sync.");
      await db.set(`progress:${user.id}`, { ...body.progress, savedAt: Date.now() });
      if (Number.isFinite(body.progress.xp)) await trackXp(user, Math.max(0, Math.floor(body.progress.xp)));
    }
    await saveUser(user);
    return { user: publicUser(user) };
  }
  if (body.action === "redeem") {
    await redeemCode(user, body.code);
    return { user: publicUser(user) };
  }
  throw new AuthError("Unknown action.");
}

export async function handleAdmin(req, body) {
  const admin = await currentUser(req);
  if (!isAdmin(admin)) throw new AuthError("Admins only.", 403);
  if (!body || body.action === "overview") {
    const users = await listUsers();
    const day = Date.now() - 86400000;
    return {
      stats: { users: users.length, premium: users.filter(hasPremium).length, newToday: users.filter((u) => u.createdAt > day).length, google: users.filter((u) => u.googleSub).length, db: db.dbKind() },
      users: users.slice(0, 500).map((u) => ({ ...publicUser(u), banned: Boolean(u.banned), weekXp: u.weekXp || 0, lastXp: u.lastXp || 0 })),
    };
  }
  const target = body.id && (await getUser(body.id));
  switch (body.action) {
    case "setPremium": {
      if (!target) throw new AuthError("User not found.", 404);
      const days = Math.max(0, Math.min(3650, Number(body.days) || 0));
      target.premiumUntil = days ? Date.now() + days * 86400000 : 0;
      await saveUser(target);
      return { ok: true };
    }
    case "setBanned": {
      if (!target) throw new AuthError("User not found.", 404);
      if (isAdmin(target)) throw new AuthError("You can't disable an admin.");
      target.banned = Boolean(body.banned);
      await saveUser(target);
      return { ok: true };
    }
    case "createCodes": {
      const count = Math.max(1, Math.min(100, Number(body.count) || 1));
      const days = Math.max(1, Math.min(3650, Number(body.days) || 31));
      const codes = [];
      for (let i = 0; i < count; i++) {
        const code = `BORO-${randomBytes(4).toString("hex").toUpperCase()}`;
        await db.set(`code:${code}`, { days, createdAt: Date.now(), createdBy: admin.id });
        codes.push(code);
      }
      return { codes };
    }
    default:
      throw new AuthError("Unknown action.");
  }
}
