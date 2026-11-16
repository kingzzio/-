// Admin checks: config (announcement, flags, XP boost, daily editor, challenge, season), promo/partner codes
// with caps, referrals, the nickname filter, reports, anonymous stats and the action log.
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.BRAINBORO_DB_FILE = join(mkdtempSync(join(tmpdir(), "bb-admin-")), "db.json");
process.env.SESSION_SECRET = "test-session-secret-long-enough";
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.KV_REST_API_URL;

const auth = await import("../lib/auth.js");
const accounts = await import("../lib/accounts.js");
const admin = await import("../lib/admin.js");

// An admin needs a Google-verified email; fake one directly in the store.
const boss = await auth.signup({ email: "esanni104@gmail.com", password: "password123", name: "Boss" });
boss.emailVerified = true;
await auth.saveUser(boss);
const req = (u) => ({ headers: { cookie: auth.sessionCookie(u).split(";")[0] } });
const act = (body) => accounts.handleAdmin(req(boss), body);

// Non-admins are refused.
const kid = await auth.signup({ email: "kid@test.dev", password: "password123", name: "Kid" });
await assert.rejects(accounts.handleAdmin(req(kid), { action: "announce", text: "hi" }), /Admins only/);

// Announcement, flags, XP boost show up in the public config.
await act({ action: "announce", text: "Regis HSPT practice is live!", tone: "party", days: 2 });
await act({ action: "flag", name: "live", on: false });
await act({ action: "xpBoost", hours: 48, mult: 2 });
let pub = await admin.publicConfig();
assert.equal(pub.announcement.text, "Regis HSPT practice is live!");
assert.equal(pub.flags.live, false);
assert.equal(pub.xpBoost.mult, 2);
assert.equal(await admin.featureOn("live"), false);
assert.equal(await admin.featureOn("blitz"), true);

// Daily Brain Blast editor needs exactly 5 valid questions; today's override is public.
const q = { q: "2+2?", choices: ["3", "4"], a: 1 };
await assert.rejects(act({ action: "daily", date: admin.dayKey(), questions: [q] }), /exactly 5/);
await act({ action: "daily", date: admin.dayKey(), questions: [q, q, q, q, q] });
pub = await admin.publicConfig();
assert.equal(pub.daily[admin.dayKey()].length, 5);

// Promo code with a cap of 2, used once per student.
await act({ action: "createCodes", kind: "promo", name: "freeweek", days: 7, maxUses: 2 });
const a = await auth.signup({ email: "a@test.dev", password: "password123", name: "A" });
const b = await auth.signup({ email: "b@test.dev", password: "password123", name: "B" });
const c = await auth.signup({ email: "c@test.dev", password: "password123", name: "C" });
await accounts.handleMe(req(a), { action: "redeem", code: "FREEWEEK" });
await assert.rejects(accounts.handleMe(req(a), { action: "redeem", code: "FREEWEEK" }), /already used/);
await accounts.handleMe(req(b), { action: "redeem", code: "freeweek" });
await assert.rejects(accounts.handleMe(req(c), { action: "redeem", code: "FREEWEEK" }), /used up/);
assert.ok(auth.hasPremium(await auth.getUser(a.id)));

// School partner code tags the student with the partner.
await act({ action: "createCodes", kind: "partner", name: "PS123", partner: "PS 123 Brooklyn", days: 120, maxUses: 30 });
await accounts.handleMe(req(c), { action: "redeem", code: "PS123" });
assert.equal((await auth.getUser(c.id)).partner, "PS 123 Brooklyn");

// One-time codes still work exactly once.
const { codes } = await act({ action: "createCodes", kind: "single", count: 1, days: 30 });
await accounts.handleMe(req(kid), { action: "redeem", code: codes[0] });
await assert.rejects(accounts.handleMe(req(b), { action: "redeem", code: codes[0] }), /used up|already/);

// Referrals: both get Premium days; the inviter's count goes up.
const me = await accounts.handleMe(req(kid), null);
assert.match(me.invite.code, /^[0-9A-F]{6}$/);
const out = await accounts.handleAuth({ action: "signup", email: "friend@test.dev", password: "password123", name: "Friend", ref: me.invite.code });
assert.ok(out.user.referredBy);
assert.ok(auth.hasPremium(out.user));
assert.equal((await accounts.handleMe(req(kid), null)).invite.count, 1);

// Nickname filter (built-in + custom words, leetspeak).
await assert.rejects(accounts.handleAuth({ action: "signup", email: "bad@test.dev", password: "password123", name: "sh1tlord" }), /different name/);
await act({ action: "badWords", words: "poopyhead" });
assert.equal(await admin.badName("P00pyHead99"), true);
assert.equal(await admin.badName("Maya"), false);

// Reports, anonymous stats and the dashboard.
await admin.report({ kind: "question", text: "Answer B is also right", context: "2+2?" }, kid);
await admin.track({ device: "device12345", features: { answer: 3, live: 1 }, answers: [{ q: "Hard one?", t: "m7-equations", ok: false }, { q: "Hard one?", ok: false }, { q: "Hard one?", ok: true }, { q: "Hard one?", ok: false }, { q: "Hard one?", ok: false }] });
const view = await act({ action: "overview" });
assert.equal(view.reports.length, 1);
assert.equal(view.dashboard.dau[6], 1);
assert.equal(view.dashboard.features[0][0], "answer");
assert.equal(view.dashboard.missed[0].rate, 80);
assert.ok(view.codes.some((x) => x.code === "FREEWEEK" && x.used === 2));
assert.ok(view.dashboard.partners.some(([p]) => p === "PS 123 Brooklyn"));
await act({ action: "resolveReport", id: view.reports[0].id });
assert.equal((await act({ action: "overview" })).reports.length, 0);

// Challenge: create, score (best score kept), end.
await act({ action: "challenge", title: "SHSAT Sprint", topics: ["m7-equations"], days: 7, count: 10 });
pub = await admin.publicConfig();
const ch = pub.challenge;
await admin.challengeScore({ id: ch.id, score: 7, total: 10 }, kid);
const board = await admin.challengeScore({ id: ch.id, score: 5, total: 10 }, kid);
assert.equal(board.leaders[0].score, 7);
await act({ action: "challenge", end: true });
assert.equal((await admin.publicConfig()).challenge, null);

// Season end records a trophy; the log captured everything.
const s = await act({ action: "endSeason" });
assert.equal(s.trophy.season, 1);
assert.equal((await admin.publicConfig()).season, 2);
const log = (await act({ action: "overview" })).log;
assert.ok(log.length >= 10 && log.some((l) => /Announcement/.test(l.action + l.detail)));
console.log("admin checks OK");

// Study squads: create, join, check in, team streak, filter.
{
  const s1 = await admin.squadAction({ action: "squadCreate", title: "Bronx Brains", device: "devaaaaaaaa1", name: "Ana" });
  assert.match(s1.code, /^[0-9A-F]{6}$/);
  const s2 = await admin.squadAction({ action: "squadJoin", code: s1.code, device: "devbbbbbbbb2", name: "Ben" });
  assert.equal(s2.members.length, 2);
  await admin.squadAction({ action: "squadCheckin", code: s1.code, device: "devaaaaaaaa1" });
  const s3 = await admin.squadAction({ action: "squadState", code: s1.code, device: "devbbbbbbbb2" });
  assert.equal(s3.members.find((m) => m.name === "Ana").today, true);
  assert.equal(s3.streak, 1, "half the squad studied today");
  await assert.rejects(admin.squadAction({ action: "squadJoin", code: s1.code, device: "devccccccc3", name: "p00pyhead" }), /different name/);
  console.log("squad checks OK");
}
