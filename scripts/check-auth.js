// Account checks: sign-up/login, sessions, Google token verification, admin rules, leaderboard, premium codes.
import assert from "node:assert/strict";
import { generateKeyPairSync, createSign } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.BRAINBORO_DB_FILE = join(mkdtempSync(join(tmpdir(), "bb-")), "db.json");
process.env.SESSION_SECRET = "test-session-secret-long-enough";
process.env.GOOGLE_CLIENT_ID = "test-client.apps.googleusercontent.com";
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.KV_REST_API_URL;

const auth = await import("../lib/auth.js");
const accounts = await import("../lib/accounts.js");
const reqWith = (cookie) => ({ headers: { cookie: cookie.split(";")[0] } });

// Password sign-up can't claim the admin email.
const sneaky = await auth.signup({ email: "ESanni104@gmail.com", password: "password123", name: "Not Admin" });
assert.equal(auth.isAdmin(sneaky), false, "unverified email must not be admin");
await assert.rejects(auth.signup({ email: "esanni104@gmail.com", password: "password123" }), /already exists/);
await assert.rejects(auth.login({ email: "esanni104@gmail.com", password: "wrong-pass" }), /Wrong email or password/);
const logged = await auth.login({ email: "esanni104@gmail.com", password: "password123" });
assert.equal(logged.id, sneaky.id);
await assert.rejects(auth.signup({ email: "bad", password: "password123" }), /real email/);
await assert.rejects(auth.signup({ email: "a@b.co", password: "short" }), /8 characters/);

// Sessions (secret auto-generated + stored when SESSION_SECRET is unset)
delete process.env.SESSION_SECRET;
await auth.ensureSecret();
const cookie = auth.sessionCookie(logged);
assert.equal((await auth.currentUser(reqWith(cookie))).id, logged.id);
const tampered = cookie.replace(/bb_session=([^.]+)/, "bb_session=someone-else");
assert.equal(await auth.currentUser(reqWith(tampered)), null);

// Google sign-in with a token signed by a test key.
const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: "jwk" }), kid: "k1", alg: "RS256", use: "sig" };
const mint = (claims, key = privateKey) => {
  const h = Buffer.from(JSON.stringify({ alg: "RS256", kid: "k1", typ: "JWT" })).toString("base64url");
  const p = Buffer.from(JSON.stringify({ iss: "https://accounts.google.com", aud: process.env.GOOGLE_CLIENT_ID, exp: Math.floor(Date.now() / 1000) + 600, email_verified: true, ...claims })).toString("base64url");
  const s = createSign("RSA-SHA256").update(`${h}.${p}`).sign(key).toString("base64url");
  return `${h}.${p}.${s}`;
};
const good = await auth.verifyGoogleToken(mint({ sub: "g1", email: "esanni104@gmail.com" }), [jwk]);
assert.equal(good.email, "esanni104@gmail.com");
await assert.rejects(auth.verifyGoogleToken(mint({ sub: "g1", email: "x@y.z", aud: "other" }), [jwk]), /failed/);
await assert.rejects(auth.verifyGoogleToken(mint({ sub: "g1", email: "x@y.z", exp: 1 }), [jwk]), /expired/);
await assert.rejects(auth.verifyGoogleToken(mint({ sub: "g1", email: "x@y.z", email_verified: false }), [jwk]), /verified/);
const other = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey;
await assert.rejects(auth.verifyGoogleToken(mint({ sub: "g1", email: "x@y.z" }, other), [jwk]), /failed/);

// Real Google login path, with the JWKS fetch stubbed.
const realFetch = globalThis.fetch;
globalThis.fetch = async (url) => (String(url).includes("googleapis.com/oauth2/v3/certs") ? new Response(JSON.stringify({ keys: [jwk] })) : realFetch(url));
const owner = await auth.googleLogin(mint({ sub: "owner-sub", email: "esanni104@gmail.com", given_name: "Esanni" }));
assert.equal(owner.id, sneaky.id, "Google login links to the existing account with that email");
assert.equal(auth.isAdmin(owner), true, "verified owner email is admin");
assert.equal(auth.hasPremium(owner), true, "admin gets every premium feature");
assert.equal(auth.publicUser(owner).admin, true);
const kid = await auth.googleLogin(mint({ sub: "kid-sub", email: "kid@example.com", given_name: "Kid" }));
assert.equal(auth.isAdmin(kid), false);
assert.equal(auth.hasPremium(kid), false);

// Admin endpoint is admin-only.
await assert.rejects(accounts.handleAdmin(reqWith(auth.sessionCookie(kid)), null), /Admins only/);
const overview = await accounts.handleAdmin(reqWith(auth.sessionCookie(owner)), null);
assert.equal(overview.stats.users, 2);
const { codes } = await accounts.handleAdmin(reqWith(auth.sessionCookie(owner)), { action: "createCodes", count: 2, days: 7 });
assert.equal(codes.length, 2);

// Kid redeems a code once; second use fails.
const kidReq = reqWith(auth.sessionCookie(kid));
const after = await accounts.handleMe(kidReq, { action: "redeem", code: codes[0].toLowerCase() });
assert.equal(after.user.premium, true);
const kid2 = await auth.googleLogin(mint({ sub: "kid2", email: "kid2@example.com" }));
await assert.rejects(accounts.handleMe(reqWith(auth.sessionCookie(kid2)), { action: "redeem", code: codes[0] }), /already used/);

// Progress sync + Borough Wars.
await accounts.handleMe(kidReq, { action: "save", profile: { borough: "Queens", name: "Kiddo" }, progress: { xp: 100 } });
await accounts.handleMe(kidReq, { action: "save", progress: { xp: 350 } });
const lb = await accounts.leaderboard(await auth.currentUser(kidReq));
assert.equal(lb.players[0].name, "Kiddo");
assert.equal(lb.players[0].xp, 250);
assert.equal(lb.boroughs.find((b) => b.name === "Queens").xp, 250);
assert.equal((await accounts.handleMe(kidReq, null)).progress.xp, 350);

// Admin can disable a user; disabled users lose their session.
await accounts.handleAdmin(reqWith(auth.sessionCookie(owner)), { action: "setBanned", id: kid2.id, banned: true });
assert.equal(await auth.currentUser(reqWith(auth.sessionCookie(kid2))), null);
await assert.rejects(accounts.handleAdmin(reqWith(auth.sessionCookie(owner)), { action: "setBanned", id: owner.id, banned: true }), /admin/);
globalThis.fetch = realFetch;
console.log("auth checks OK");
