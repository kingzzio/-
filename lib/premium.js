// Premium membership without accounts: a redeemed code becomes an HMAC-signed token
// that the browser stores and sends back on premium-only requests.
//
//   BRAINBORO_PREMIUM_SECRET  long random string used to sign tokens (required to enable premium)
//   BRAINBORO_PREMIUM_CODES   comma-separated codes you hand out or send after purchase
//   BRAINBORO_CHECKOUT_URL    optional payment link (e.g. a Stripe Payment Link) shown on the Upgrade page
//   BRAINBORO_PREMIUM_DAYS    how long a redeemed code lasts (default 31)
import { createHmac, timingSafeEqual } from "node:crypto";

const secret = () => process.env.BRAINBORO_PREMIUM_SECRET || "";
const codes = () =>
  (process.env.BRAINBORO_PREMIUM_CODES || "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

export const premiumEnabled = () => secret().length >= 16 && codes().length > 0;
export const checkoutUrl = () => process.env.BRAINBORO_CHECKOUT_URL || "";

const sign = (payload) => createHmac("sha256", secret()).update(payload).digest("base64url");

function safeEqual(a, b) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function redeem(code) {
  if (!premiumEnabled()) return { error: "Premium isn't set up on this site yet." };
  const clean = String(code || "").trim().toUpperCase();
  if (!clean || !codes().some((c) => safeEqual(c, clean))) return { error: "That code didn't work. Check it and try again." };
  const days = Number(process.env.BRAINBORO_PREMIUM_DAYS || 31);
  const exp = Date.now() + days * 86400000;
  const payload = Buffer.from(JSON.stringify({ p: 1, exp })).toString("base64url");
  return { token: `${payload}.${sign(payload)}`, exp };
}

export function verifyToken(token) {
  if (!premiumEnabled() || typeof token !== "string") return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return false;
  try {
    const { p, exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return p === 1 && exp > Date.now();
  } catch {
    return false;
  }
}
