// Admin powers: app-wide config (announcements, feature switches, Double XP, events, daily quiz edits,
// challenges, seasons), anonymous usage stats, the report queue, the action log, promo/partner codes,
// referrals, the nickname filter and push notifications.
//
// Privacy: stats are anonymous counts (feature taps, answers per question from BrainBoro's own question
// bank). Admins never see students' chats, photos or essays.
import { createHash, randomBytes } from "node:crypto";
import * as db from "./db.js";

const DAY = 86400000;
export const dayKey = (t = Date.now()) => new Date(t - 4 * 3600000).toISOString().slice(0, 10); // ≈ New York day
const clean = (s, max) => String(s ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
const until = (days) => Date.now() + Math.max(0, Math.min(365, Number(days) || 0)) * DAY;

export class AdminError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// ---------- Config ----------
// Features the admin can switch off. "ai" turns off every AI feature at once (saves the free quota).
export const FEATURES = {
  ai: "All AI features",
  answer: "Snap & Answer",
  tutor: "Boro AI chat",
  coach: "Screen Coach",
  essay: "Essay Coach",
  live: "BrainBoro Live",
  blitz: "Blitz",
  battle: "Brain Battles",
  leaderboard: "Borough Wars",
  cheats: "Cheat Codes",
  scholarships: "Scholarship Hunt",
  squads: "Study Squads",
  challenge: "Challenges",
};

const DEFAULTS = { announcement: null, flags: {}, xpBoost: null, event: null, daily: {}, challenge: null, badWords: [], season: 1, trophies: [], referralDays: 7, aiAlert: 800 };
let cache = null;
let cachedAt = 0;

export async function getConfig() {
  if (cache && Date.now() - cachedAt < 15000) return cache;
  cache = { ...DEFAULTS, ...((await db.get("app:config")) || {}) };
  cachedAt = Date.now();
  return cache;
}
async function saveConfig(cfg) {
  cache = cfg;
  cachedAt = Date.now();
  await db.set("app:config", cfg);
}
export const featureOn = async (name) => (await getConfig()).flags?.[name] !== false;

/** What every visitor's app needs: only active, non-secret parts. */
export async function publicConfig() {
  const c = await getConfig();
  const now = Date.now();
  return {
    announcement: c.announcement && (!c.announcement.until || c.announcement.until > now) ? c.announcement : null,
    flags: c.flags || {},
    xpBoost: c.xpBoost && c.xpBoost.until > now ? c.xpBoost : null,
    event: c.event && c.event.when > now - 3 * 3600000 ? c.event : null,
    // Yesterday, today and tomorrow, so every phone finds its own local date.
    daily: Object.fromEntries([-1, 0, 1].map((n) => dayKey(now + n * DAY)).filter((d) => c.daily?.[d]).map((d) => [d, c.daily[d]])),
    challenge: c.challenge && c.challenge.end > now && c.challenge.start <= now ? publicChallenge(c.challenge) : null,
    season: c.season,
    trophies: (c.trophies || []).slice(0, 8),
    referralDays: c.referralDays,
  };
}
const publicChallenge = (ch) => ({ id: ch.id, title: ch.title, desc: ch.desc, emoji: ch.emoji, topics: ch.topics, questions: ch.questions, end: ch.end, count: ch.count });

// ---------- Nickname filter ----------
const BUILT_IN_BAD = ["fuck", "shit", "bitch", "cunt", "dick", "pussy", "nigg", "fag", "slut", "whore", "retard", "rape", "nazi", "hitler", "cock", "penis", "vagina", "porn", "sex", "kys", "kill yourself"];
const normalize = (s) => String(s).toLowerCase().replace(/[@4]/g, "a").replace(/3/g, "e").replace(/[1!|]/g, "i").replace(/0/g, "o").replace(/[$5]/g, "s").replace(/7/g, "t").replace(/[^a-z ]/g, "");
export async function badName(name) {
  const n = normalize(name).replace(/ /g, "");
  const words = [...BUILT_IN_BAD, ...((await getConfig()).badWords || [])].map((w) => normalize(w).replace(/ /g, "")).filter(Boolean);
  return words.some((w) => n.includes(w));
}

// ---------- Anonymous usage stats ----------
const FEATURE_RE = /^[a-z][a-z-]{0,23}$/;
export async function track({ device, features = {}, answers = [] }) {
  device = clean(device, 40);
  if (!/^[a-z0-9]{8,40}$/i.test(device)) throw new AdminError("bad device");
  const day = dayKey();
  const bucket = Math.floor(Date.now() / 300000);
  const jobs = [db.sadd(`a:dau:${day}`, device), db.expire(`a:dau:${day}`, 40 * 86400), db.sadd(`a:on:${bucket}`, device), db.expire(`a:on:${bucket}`, 1200)];
  let taps = 0;
  for (const [f, n] of Object.entries(features).slice(0, 30)) {
    if (!FEATURE_RE.test(f)) continue;
    const k = Math.max(0, Math.min(50, Number(n) || 0));
    if (!k) continue;
    taps += k;
    jobs.push(db.zincr(`a:feat:${day}`, f, k));
  }
  if (taps) jobs.push(db.zincr(`a:hour:${day}`, String(new Date(Date.now() - 4 * 3600000).getUTCHours()), taps), db.expire(`a:feat:${day}`, 40 * 86400), db.expire(`a:hour:${day}`, 40 * 86400));
  let ok = 0, no = 0;
  for (const a of answers.slice(0, 60)) {
    const q = clean(a.q, 220);
    if (!q) continue;
    const key = createHash("sha1").update(q).digest("hex").slice(0, 14);
    a.ok ? ok++ : no++;
    jobs.push(db.zincr("a:q:tot", key, 1));
    if (!a.ok) jobs.push(db.zincr("a:q:miss", key, 1));
    jobs.push(db.setNew(`a:qt:${key}`, { q, t: clean(a.t, 40) }));
  }
  if (ok) jobs.push(db.zincr(`a:ans:${day}`, "ok", ok));
  if (no) jobs.push(db.zincr(`a:ans:${day}`, "no", no));
  await Promise.all(jobs);
  return { ok: true };
}

export async function countAi() {
  const day = dayKey();
  await db.zincr(`a:ai:${day}`, "requests", 1);
  await db.expire(`a:ai:${day}`, 40 * 86400);
}

export async function dashboard(users) {
  const days = Array.from({ length: 7 }, (_, i) => dayKey(Date.now() - (6 - i) * DAY));
  const bucket = Math.floor(Date.now() / 300000);
  const [dau, ans, feats, hours, online0, online1, aiToday, missTop] = await Promise.all([
    Promise.all(days.map((d) => db.scard(`a:dau:${d}`))),
    Promise.all(days.map(async (d) => Object.fromEntries(await db.ztop(`a:ans:${d}`, 2)))),
    Promise.all(days.map((d) => db.ztop(`a:feat:${d}`, 40))),
    db.ztop(`a:hour:${days[6]}`, 24),
    db.scard(`a:on:${bucket}`),
    db.scard(`a:on:${bucket - 1}`),
    db.ztop(`a:ai:${days[6]}`, 1),
    db.ztop("a:q:miss", 40),
  ]);
  const featureTotals = {};
  for (const list of feats) for (const [f, n] of list) featureTotals[f] = (featureTotals[f] || 0) + n;
  const signups = days.map((d) => users.filter((u) => dayKey(u.createdAt) === d).length);
  const boroughs = {}, schools = {}, partners = {};
  for (const u of users) {
    if (u.borough) boroughs[u.borough] = (boroughs[u.borough] || 0) + 1;
    if (u.school) schools[u.school] = (schools[u.school] || 0) + 1;
    if (u.partner) partners[u.partner] = (partners[u.partner] || 0) + 1;
  }
  const missed = (
    await Promise.all(
      missTop.map(async ([k, miss]) => {
        const tot = (await db.zscore("a:q:tot", k)) || miss;
        const meta = (await db.get(`a:qt:${k}`)) || {};
        return { key: k, q: meta.q || "?", topic: meta.t || "", miss, tot, rate: Math.round((miss / tot) * 100) };
      }),
    )
  ).filter((x) => x.tot >= 5).sort((a, b) => b.rate - a.rate).slice(0, 12);
  const cfg = await getConfig();
  return {
    days,
    dau,
    signups,
    answers: ans.map((a) => ({ ok: a.ok || 0, no: a.no || 0 })),
    online: Math.max(online0, online1),
    features: Object.entries(featureTotals).sort((a, b) => b[1] - a[1]).slice(0, 15),
    hours: Array.from({ length: 24 }, (_, h) => Number(Object.fromEntries(hours)[h] || 0)),
    ai: { today: aiToday[0]?.[1] || 0, alert: cfg.aiAlert },
    boroughs: Object.entries(boroughs).sort((a, b) => b[1] - a[1]),
    schools: Object.entries(schools).sort((a, b) => b[1] - a[1]).slice(0, 10),
    partners: Object.entries(partners).sort((a, b) => b[1] - a[1]),
    missed,
  };
}

// ---------- Reports ----------
const REPORT_KINDS = ["ai", "question", "nickname", "bug", "other"];
export async function report({ kind, text, context, route }, user) {
  if (!REPORT_KINDS.includes(kind)) throw new AdminError("Pick what you're reporting.");
  const r = { id: randomBytes(6).toString("hex"), kind, text: clean(text, 600), context: clean(context, 600), route: clean(route, 80), by: user ? `${user.name || "Student"} (${user.id.slice(0, 6)})` : "Guest", at: Date.now() };
  if (!r.text && !r.context) throw new AdminError("Tell us what's wrong.");
  await db.set(`report:${r.id}`, r);
  await db.zset("reports", r.id, r.at);
  return { ok: true };
}
async function listReports() {
  const ids = await db.ztop("reports", 100);
  return (await Promise.all(ids.map(([id]) => db.get(`report:${id}`)))).filter(Boolean);
}

// ---------- Action log ----------
export async function logAction(admin, action, detail) {
  const id = `${Date.now()}${randomBytes(2).toString("hex")}`;
  await db.set(`log:${id}`, { at: Date.now(), by: admin?.email || "?", action, detail: clean(detail, 200) });
  await db.zset("adminlog", id, Date.now());
}
async function listLog() {
  const ids = await db.ztop("adminlog", 80);
  return (await Promise.all(ids.map(([id]) => db.get(`log:${id}`)))).filter(Boolean);
}

// ---------- Codes (one-time, promo with a cap, school partner) ----------
export async function createCodes({ count, days, kind = "single", name, maxUses, expiresDays, partner }, admin) {
  days = Math.max(1, Math.min(3650, Number(days) || 31));
  const expires = expiresDays ? until(expiresDays) : 0;
  const codes = [];
  if (kind === "single") {
    const n = Math.max(1, Math.min(100, Number(count) || 1));
    for (let i = 0; i < n; i++) {
      const code = `BORO-${randomBytes(4).toString("hex").toUpperCase()}`;
      await db.set(`code:${code}`, { days, maxUses: 1, expires, createdAt: Date.now(), createdBy: admin.id, kind });
      await db.zset("codes", code, Date.now());
      codes.push(code);
    }
  } else {
    const code = clean(name, 24).toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (code.length < 4) throw new AdminError("Code names need at least 4 letters or numbers.");
    if (!(await db.setNew(`code:${code}`, { days, maxUses: Math.max(1, Math.min(100000, Number(maxUses) || 100)), expires, partner: kind === "partner" ? clean(partner, 60) || code : "", createdAt: Date.now(), createdBy: admin.id, kind }))) throw new AdminError("That code already exists.");
    await db.zset("codes", code, Date.now());
    codes.push(code);
  }
  return codes;
}

/** Redeem a stored code for a logged-in user. Returns { days, partner } or null if no such stored code. */
export async function redeemStored(code, user) {
  const c = await db.get(`code:${code}`);
  if (!c) return null;
  if (c.usedBy) throw new AdminError("That code was already used."); // codes made before multi-use support
  if (c.expires && c.expires < Date.now()) throw new AdminError("That code has expired.");
  if (!(await db.setNew(`code:${code}:u:${user.id}`, Date.now()))) throw new AdminError("You already used this code.");
  const used = await db.zincr("codeuse", code, 1);
  if (used > (c.maxUses || 1)) {
    await db.zincr("codeuse", code, -1);
    await db.del(`code:${code}:u:${user.id}`);
    throw new AdminError((c.maxUses || 1) === 1 ? "That code was already used." : "That code has been used up.");
  }
  return { days: c.days, partner: c.partner || "" };
}

async function listCodes() {
  const top = await db.ztop("codes", 60);
  return (
    await Promise.all(
      top.map(async ([code]) => {
        const c = await db.get(`code:${code}`);
        return c && { code, kind: c.kind || "single", days: c.days, maxUses: c.maxUses || 1, used: c.usedBy ? 1 : (await db.zscore("codeuse", code)) || 0, partner: c.partner || "", expires: c.expires || 0 };
      }),
    )
  ).filter(Boolean);
}

// ---------- Referrals ----------
export async function referralCode(user, save) {
  if (!user.refCode) {
    for (let i = 0; i < 5 && !user.refCode; i++) {
      const code = randomBytes(3).toString("hex").toUpperCase();
      if (await db.setNew(`ref:${code}`, user.id)) user.refCode = code;
    }
    await save(user);
  }
  return user.refCode;
}
const MAX_REWARDED_REFERRALS = 25;
/** Give the new user and their friend Premium days. Only for brand-new accounts. */
export async function applyReferral(newUser, code, { getUser, saveUser }) {
  code = clean(code, 10).toUpperCase();
  if (!code || newUser.referredBy) return;
  const refId = await db.get(`ref:${code}`);
  if (!refId || refId === newUser.id) return;
  const friend = await getUser(refId);
  if (!friend) return;
  const days = (await getConfig()).referralDays;
  newUser.referredBy = refId;
  const count = await db.zincr("referrals", refId, 1);
  if (days > 0) {
    newUser.premiumUntil = Math.max(Date.now(), newUser.premiumUntil || 0) + days * DAY;
    if (count <= MAX_REWARDED_REFERRALS) {
      friend.premiumUntil = Math.max(Date.now(), friend.premiumUntil || 0) + days * DAY;
      await saveUser(friend);
    }
  }
  await saveUser(newUser);
}

// ---------- Challenges ----------
export async function challengeScore({ id, score, total }, user, device) {
  const cfg = await getConfig();
  const ch = cfg.challenge;
  if (!ch || ch.id !== id || ch.end < Date.now()) throw new AdminError("That challenge has ended.");
  score = Math.max(0, Math.min(Number(total) || ch.count || 20, Math.floor(Number(score) || 0)));
  const member = user ? `u:${user.id}` : `d:${clean(device, 40)}`;
  const name = user?.name || "Guest";
  const prev = await db.zscore(`ch:${id}`, member);
  if (prev === null || score > prev) {
    await db.zset(`ch:${id}`, member, score);
    await db.set(`chn:${id}:${member}`, clean(name, 30));
  }
  return challengeBoard(id, member);
}
export async function challengeBoard(id, me) {
  const top = await db.ztop(`ch:${id}`, 20);
  return { leaders: await Promise.all(top.map(async ([m, s]) => ({ name: (await db.get(`chn:${id}:${m}`)) || "Student", score: s, me: m === me }))) };
}

// ---------- Push notifications ----------
let webpush;
async function push() {
  if (!webpush) webpush = (await import("web-push")).default;
  let keys = await db.get("push:vapid");
  if (!keys) {
    keys = webpush.generateVAPIDKeys();
    if (!(await db.setNew("push:vapid", keys))) keys = await db.get("push:vapid");
  }
  webpush.setVapidDetails("mailto:admin@brainboro.app", keys.publicKey, keys.privateKey);
  return { webpush, keys };
}
export async function vapidKey() {
  return (await push()).keys.publicKey;
}
export async function subscribe(sub) {
  if (!sub?.endpoint || !/^https:\/\//.test(sub.endpoint) || !sub.keys?.p256dh || !sub.keys?.auth) throw new AdminError("Bad subscription.");
  const id = createHash("sha1").update(sub.endpoint).digest("hex").slice(0, 20);
  await db.set(`push:sub:${id}`, { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } });
  await db.sadd("push:subs", id);
  return { ok: true };
}
async function sendPush({ title, body, url }) {
  const { webpush: wp } = await push();
  const ids = await db.smembers("push:subs");
  const payload = JSON.stringify({ title: clean(title, 60) || "BrainBoro", body: clean(body, 160), url: clean(url, 120) || "/" });
  let sent = 0, gone = 0;
  for (let i = 0; i < ids.length; i += 20) {
    await Promise.all(
      ids.slice(i, i + 20).map(async (id) => {
        const sub = await db.get(`push:sub:${id}`);
        if (!sub) return;
        try {
          await wp.sendNotification(sub, payload, { TTL: 86400 });
          sent++;
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            gone++;
            await db.del(`push:sub:${id}`);
          }
        }
      }),
    );
  }
  return { sent, gone, total: ids.length };
}

// ---------- Admin actions ----------
const DAILY_Q = (q) => {
  const choices = (Array.isArray(q?.choices) ? q.choices : []).map((c) => clean(c, 140)).filter(Boolean).slice(0, 4);
  const a = Number(q?.a);
  if (!clean(q?.q, 400) || choices.length < 2 || !(a >= 0 && a < choices.length)) throw new AdminError("Each question needs text, at least 2 choices and the right answer.");
  return { q: clean(q.q, 400), choices, a, exp: clean(q.exp, 300) || "Nice work." };
};

/** Extra admin overview data, merged into the existing admin endpoint. */
export async function adminExtras(users) {
  const cfg = await getConfig();
  const [dash, reports, log, codes, refTop] = await Promise.all([dashboard(users), listReports(), listLog(), listCodes(), db.ztop("referrals", 10)]);
  const subs = await db.scard("push:subs");
  const byId = new Map(users.map((u) => [u.id, u]));
  return {
    config: cfg,
    features: FEATURES,
    dashboard: dash,
    reports,
    log,
    codes,
    referrals: refTop.map(([id, n]) => ({ name: byId.get(id)?.name || "?", email: byId.get(id)?.email || "", n })),
    pushSubs: subs,
  };
}

export async function adminAction(body, admin, { listUsers, leaderboard }) {
  const cfg = { ...(await getConfig()) };
  const say = (msg) => logAction(admin, body.action, msg);
  switch (body.action) {
    case "announce": {
      cfg.announcement = clean(body.text, 200) ? { id: Date.now(), text: clean(body.text, 200), tone: ["info", "party", "warn"].includes(body.tone) ? body.tone : "info", link: clean(body.link, 120), until: body.days ? until(body.days) : 0 } : null;
      await saveConfig(cfg);
      await say(cfg.announcement ? `Announcement: ${cfg.announcement.text}` : "Cleared announcement");
      return { ok: true };
    }
    case "flag": {
      if (!FEATURES[body.name]) throw new AdminError("Unknown feature.");
      cfg.flags = { ...cfg.flags, [body.name]: Boolean(body.on) };
      await saveConfig(cfg);
      await say(`${FEATURES[body.name]} turned ${body.on ? "ON" : "OFF"}`);
      return { ok: true };
    }
    case "xpBoost": {
      const hours = Math.max(0, Math.min(168, Number(body.hours) || 0));
      cfg.xpBoost = hours ? { mult: Math.max(2, Math.min(3, Number(body.mult) || 2)), until: Date.now() + hours * 3600000, label: clean(body.label, 40) || "Double XP" } : null;
      await saveConfig(cfg);
      await say(cfg.xpBoost ? `${cfg.xpBoost.mult}× XP for ${hours}h` : "Ended XP boost");
      return { ok: true };
    }
    case "event": {
      const when = Date.parse(body.when);
      cfg.event = clean(body.title, 80) && when ? { title: clean(body.title, 80), desc: clean(body.desc, 200), when, link: clean(body.link, 120) } : null;
      await saveConfig(cfg);
      await say(cfg.event ? `Event: ${cfg.event.title}` : "Cleared event");
      return { ok: true };
    }
    case "daily": {
      const date = /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : null;
      if (!date) throw new AdminError("Pick a date.");
      cfg.daily = Object.fromEntries(Object.entries(cfg.daily || {}).filter(([d]) => d >= dayKey(Date.now() - 2 * DAY)));
      if (body.clear) delete cfg.daily[date];
      else {
        const qs = (body.questions || []).map(DAILY_Q);
        if (qs.length !== 5) throw new AdminError("The Daily Brain Blast needs exactly 5 questions.");
        cfg.daily[date] = qs;
      }
      await saveConfig(cfg);
      await say(`${body.clear ? "Cleared" : "Set"} Daily Brain Blast for ${date}`);
      return { ok: true };
    }
    case "challenge": {
      if (body.end === true) {
        cfg.challenge = null;
      } else {
        const days = Math.max(1, Math.min(30, Number(body.days) || 7));
        const topics = (body.topics || []).map((x) => clean(x, 40)).filter(Boolean).slice(0, 12);
        if (!clean(body.title, 60) || !topics.length) throw new AdminError("Give the challenge a title and at least one topic.");
        cfg.challenge = { id: randomBytes(4).toString("hex"), title: clean(body.title, 60), desc: clean(body.desc, 160), emoji: clean(body.emoji, 4) || "🏁", topics, count: Math.max(5, Math.min(30, Number(body.count) || 15)), start: Date.now(), end: until(days) };
      }
      await saveConfig(cfg);
      await say(cfg.challenge ? `Challenge: ${cfg.challenge.title}` : "Ended challenge");
      return { ok: true };
    }
    case "endSeason": {
      const lb = await leaderboard(null);
      const winner = lb.boroughs[0];
      cfg.trophies = [{ season: cfg.season, week: lb.week, borough: winner?.xp ? winner.name : "No winner", xp: winner?.xp || 0, top: lb.players.slice(0, 3).map((p) => p.name), at: Date.now() }, ...(cfg.trophies || [])].slice(0, 20);
      cfg.season = (cfg.season || 1) + 1;
      await saveConfig(cfg);
      await say(`Ended season ${cfg.season - 1}: ${cfg.trophies[0].borough} wins`);
      return { ok: true, trophy: cfg.trophies[0] };
    }
    case "badWords": {
      cfg.badWords = String(body.words || "").split(/[,\n]/).map((w) => clean(w, 30).toLowerCase()).filter(Boolean).slice(0, 300);
      await saveConfig(cfg);
      await say(`Nickname filter: ${cfg.badWords.length} custom words`);
      return { ok: true };
    }
    case "settings": {
      cfg.referralDays = Math.max(0, Math.min(60, Number(body.referralDays) || 0));
      cfg.aiAlert = Math.max(10, Math.min(1e6, Number(body.aiAlert) || 800));
      await saveConfig(cfg);
      await say(`Settings: referral ${cfg.referralDays} days, AI alert ${cfg.aiAlert}`);
      return { ok: true };
    }
    case "resolveReport": {
      await db.zrem("reports", clean(body.id, 20));
      await db.del(`report:${clean(body.id, 20)}`);
      await say(`Resolved report ${clean(body.id, 20)}`);
      return { ok: true };
    }
    case "createCodes": {
      const codes = await createCodes(body, admin);
      await say(`Created ${body.kind || "single"} code(s): ${codes.slice(0, 3).join(", ")}${codes.length > 3 ? "…" : ""}`);
      return { codes };
    }
    case "push": {
      if (!clean(body.title, 60) && !clean(body.body, 160)) throw new AdminError("Write a message.");
      const out = await sendPush(body);
      await say(`Push "${clean(body.title, 40)}" → ${out.sent} devices`);
      return out;
    }
    default:
      return null; // not ours; the caller handles the classic actions
  }
}

// ---------- Study squads: up to 8 friends, a shared code, a daily check-in and a team streak ----------
const SQUAD_MAX = 8;
const memberId = (user, device) => (user ? `u:${user.id}` : `d:${clean(device, 40)}`);
async function squadView(code, me) {
  const sq = await db.get(`squad:${code}`);
  if (!sq) throw new AdminError("No squad with that code.", 404);
  const days = Array.from({ length: 7 }, (_, i) => dayKey(Date.now() - (6 - i) * DAY));
  const checks = await Promise.all(days.map((d) => db.smembers(`sqc:${code}:${d}`)));
  // Team streak: consecutive days (ending today or yesterday) where at least half the squad studied.
  let streak = 0;
  const need = Math.max(1, Math.ceil(sq.members.length / 2));
  for (let i = 6; i >= 0; i--) {
    if (checks[i].length >= need) streak++;
    else if (i < 6) break;
  }
  return { code, name: sq.name, streak, members: sq.members.map((m) => ({ name: m.name, me: m.id === me, today: checks[6].includes(m.id), week: checks.filter((c) => c.includes(m.id)).length })), days };
}
export async function squadAction(body, user) {
  const me = memberId(user, body.device);
  const name = clean(body.name || user?.name, 20) || "Student";
  if (await badName(name)) throw new AdminError("Please pick a different name.");
  if (body.action === "squadCreate") {
    const title = clean(body.title, 30) || `${name}'s Squad`;
    if (await badName(title)) throw new AdminError("Please pick a different squad name.");
    for (let i = 0; i < 6; i++) {
      const code = randomBytes(3).toString("hex").toUpperCase();
      if (await db.setNew(`squad:${code}`, { name: title, members: [{ id: me, name }], at: Date.now() })) return squadView(code, me);
    }
    throw new AdminError("Couldn't make a squad. Try again.", 503);
  }
  const code = clean(body.code, 8).toUpperCase();
  const sq = await db.get(`squad:${code}`);
  if (!sq) throw new AdminError("No squad with that code.", 404);
  if (body.action === "squadJoin") {
    if (!sq.members.some((m) => m.id === me)) {
      if (sq.members.length >= SQUAD_MAX) throw new AdminError("That squad is full (8 max).");
      sq.members.push({ id: me, name });
      await db.set(`squad:${code}`, sq);
    }
  } else if (body.action === "squadLeave") {
    sq.members = sq.members.filter((m) => m.id !== me);
    await db.set(`squad:${code}`, sq);
    return { left: true };
  } else if (body.action === "squadCheckin") {
    if (!sq.members.some((m) => m.id === me)) throw new AdminError("Join the squad first.");
    await db.sadd(`sqc:${code}:${dayKey()}`, me);
    await db.expire(`sqc:${code}:${dayKey()}`, 10 * 86400);
  } else if (!sq.members.some((m) => m.id === me)) throw new AdminError("You're not in this squad.", 403);
  return squadView(code, me);
}
