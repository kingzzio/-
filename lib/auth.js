// Accounts: email/password sign-up, Google sign-in, signed session cookies, admin & premium checks.
//
//   SESSION_SECRET     long random string that signs session cookies (required in production)
//   GOOGLE_CLIENT_ID   OAuth client ID from Google Cloud Console (enables "Sign in with Google")
//   ADMIN_EMAILS       comma-separated admin emails (default: the site owner's)
import { createHmac, createPublicKey, randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual, verify as verifySig } from "node:crypto";
import { promisify } from "node:util";
import * as db from "./db.js";

const scrypt = promisify(scryptCb);
const SESSION_DAYS = 60;
const DEFAULT_ADMINS = "esanni104@gmail.com";

let devSecret = "";
function secret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) throw new Error("SESSION_SECRET is not set");
  devSecret ||= randomBytes(32).toString("hex"); // dev only: sessions reset when the server restarts
  return devSecret;
}

export class AuthError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export const googleClientId = () => process.env.GOOGLE_CLIENT_ID || "";
const adminEmails = () => (process.env.ADMIN_EMAILS || DEFAULT_ADMINS).split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
const cleanEmail = (e) => String(e || "").trim().toLowerCase().slice(0, 200);
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// Admin needs a VERIFIED email (Google sign-in), so nobody can claim it by signing up with a password first.
export const isAdmin = (u) => Boolean(u && u.emailVerified && adminEmails().includes(u.email));
export const hasPremium = (u) => Boolean(u && (isAdmin(u) || (u.premiumUntil || 0) > Date.now()));

/** What the browser is allowed to see about a user. */
export function publicUser(u) {
  if (!u) return null;
  return { id: u.id, email: u.email, name: u.name, picture: u.picture || "", borough: u.borough || "", school: u.school || "", admin: isAdmin(u), premium: hasPremium(u), premiumUntil: isAdmin(u) ? null : u.premiumUntil || 0, google: Boolean(u.googleSub), createdAt: u.createdAt };
}

// ---------- passwords ----------
async function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const key = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return { salt, hash: key.toString("hex") };
}

// ---------- sessions ----------
const sign = (s) => createHmac("sha256", secret()).update(s).digest("base64url");

export function sessionCookie(user) {
  const exp = Date.now() + SESSION_DAYS * 86400000;
  const body = `${user.id}.${exp}`;
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL ? "; Secure" : "";
  return `bb_session=${body}.${sign(body)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure}`;
}
export const clearCookie = () => "bb_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";

function readCookie(req, name) {
  const header = req.headers.cookie || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return "";
}

export async function currentUser(req) {
  const raw = readCookie(req, "bb_session");
  if (!raw) return null;
  const [id, exp, sig] = raw.split(".");
  if (!id || !exp || !sig) return null;
  const expected = sign(`${id}.${exp}`);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (Number(exp) < Date.now()) return null;
  const user = await db.get(`user:${id}`);
  return user && !user.banned ? user : null;
}

// ---------- user records ----------
async function createUser(fields) {
  const user = { id: randomUUID(), createdAt: Date.now(), premiumUntil: 0, borough: "", school: "", ...fields };
  if (!(await db.setNew(`email:${user.email}`, user.id))) throw new AuthError("An account with that email already exists. Log in instead.", 409);
  await db.set(`user:${user.id}`, user);
  await db.sadd("users", user.id);
  return user;
}

export const saveUser = (u) => db.set(`user:${u.id}`, u);
export const getUser = (id) => db.get(`user:${id}`);

export async function signup({ email, password, name }) {
  email = cleanEmail(email);
  if (!validEmail(email)) throw new AuthError("Enter a real email address.");
  if (typeof password !== "string" || password.length < 8) throw new AuthError("Use a password with at least 8 characters.");
  if (password.length > 200) throw new AuthError("That password is too long.");
  const { salt, hash } = await hashPassword(password);
  return createUser({ email, name: String(name || email.split("@")[0]).trim().slice(0, 40), passSalt: salt, passHash: hash, emailVerified: false });
}

export async function login({ email, password }) {
  email = cleanEmail(email);
  const id = await db.get(`email:${email}`);
  const user = id && (await db.get(`user:${id}`));
  if (!user || !user.passHash) {
    // Same work either way, so timing doesn't reveal whether the email exists.
    await hashPassword(String(password || "x"));
    throw new AuthError(user?.googleSub ? "This account uses Google. Tap “Continue with Google”." : "Wrong email or password.", 401);
  }
  const { hash } = await hashPassword(String(password || ""), user.passSalt);
  if (!timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(user.passHash, "hex"))) throw new AuthError("Wrong email or password.", 401);
  if (user.banned) throw new AuthError("This account is disabled.", 403);
  return user;
}

// ---------- Google sign-in (ID token from Google Identity Services) ----------
let jwks = { keys: [], at: 0 };
async function googleKeys() {
  if (Date.now() - jwks.at < 3600000 && jwks.keys.length) return jwks.keys;
  const res = await fetch("https://www.googleapis.com/oauth2/v3/certs");
  if (!res.ok) throw new AuthError("Couldn't reach Google. Try again.", 502);
  jwks = { keys: (await res.json()).keys, at: Date.now() };
  return jwks.keys;
}

export async function verifyGoogleToken(credential, keys) {
  const clientId = googleClientId();
  if (!clientId) throw new AuthError("Google sign-in isn't set up on this site yet.", 503);
  const [h, p, s] = String(credential || "").split(".");
  if (!h || !p || !s) throw new AuthError("Google sign-in failed.");
  const header = JSON.parse(Buffer.from(h, "base64url"));
  const payload = JSON.parse(Buffer.from(p, "base64url"));
  if (header.alg !== "RS256") throw new AuthError("Google sign-in failed.");
  const jwk = (keys || (await googleKeys())).find((k) => k.kid === header.kid);
  if (!jwk) throw new AuthError("Google sign-in failed.");
  const ok = verifySig("RSA-SHA256", Buffer.from(`${h}.${p}`), createPublicKey({ key: jwk, format: "jwk" }), Buffer.from(s, "base64url"));
  if (!ok) throw new AuthError("Google sign-in failed.");
  if (payload.aud !== clientId) throw new AuthError("Google sign-in failed.");
  if (!["accounts.google.com", "https://accounts.google.com"].includes(payload.iss)) throw new AuthError("Google sign-in failed.");
  if (payload.exp * 1000 < Date.now()) throw new AuthError("Google sign-in expired. Try again.");
  if (!payload.email || payload.email_verified !== true) throw new AuthError("Your Google email isn't verified.");
  return payload;
}

export async function googleLogin(credential) {
  const g = await verifyGoogleToken(credential);
  const email = cleanEmail(g.email);
  const bySub = await db.get(`google:${g.sub}`);
  let user = bySub && (await db.get(`user:${bySub}`));
  if (!user) {
    const byEmail = await db.get(`email:${email}`);
    user = byEmail && (await db.get(`user:${byEmail}`));
    if (user) {
      // Google proved they own this email: link it to the existing account.
      Object.assign(user, { googleSub: g.sub, emailVerified: true, picture: user.picture || g.picture || "" });
      await saveUser(user);
    } else {
      user = await createUser({ email, name: String(g.given_name || g.name || email.split("@")[0]).slice(0, 40), picture: g.picture || "", googleSub: g.sub, emailVerified: true });
    }
    await db.set(`google:${g.sub}`, user.id);
  }
  if (user.banned) throw new AuthError("This account is disabled.", 403);
  return user;
}

export async function listUsers() {
  const ids = await db.smembers("users");
  const users = (await Promise.all(ids.map((id) => db.get(`user:${id}`)))).filter(Boolean);
  return users.sort((a, b) => b.createdAt - a.createdAt);
}
