// Imports assignments from a school calendar feed (.ics), e.g. Canvas "Calendar Feed",
// Schoology calendar export, or a Google Calendar secret iCal address.
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_BYTES = 2_000_000;

export class FeedError extends Error {}

function isPrivate(ip) {
  if (ip.includes(":")) {
    const v = ip.toLowerCase();
    return v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80") || v === "::" || v.startsWith("::ffff:127.") || v.startsWith("::ffff:10.") || v.startsWith("::ffff:192.168.");
  }
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

// Only public https hosts — the server must never be used to reach internal addresses.
export async function checkUrl(raw) {
  let url;
  try {
    url = new URL(String(raw).trim().replace(/^webcal:\/\//i, "https://"));
  } catch {
    throw new FeedError("That doesn't look like a link. Paste the full calendar feed URL.");
  }
  if (url.protocol !== "https:") throw new FeedError("The feed link must start with https:// or webcal://");
  if (url.username || url.password) throw new FeedError("That link isn't supported.");
  const host = url.hostname;
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (!addrs.length) throw new FeedError("Couldn't find that website.");
  if (addrs.some((a) => isPrivate(a.address))) throw new FeedError("That link isn't supported.");
  return url;
}

async function download(url, hops = 0) {
  const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(10000), headers: { Accept: "text/calendar, text/plain" } });
  if (res.status >= 300 && res.status < 400 && res.headers.get("location") && hops < 3) {
    return download(await checkUrl(new URL(res.headers.get("location"), url)), hops + 1);
  }
  if (!res.ok) throw new FeedError(`The calendar site answered ${res.status}. Is the link still valid?`);
  const reader = res.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_BYTES) {
      reader.cancel();
      throw new FeedError("That calendar is too big to import.");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function parseDate(value, params) {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/);
  if (!m) return null;
  const [, y, mo, d, h = "23", mi = "59", s = "00", z] = m;
  // All-day dates (VALUE=DATE) count as due at the end of that day.
  if (!m[4] || /VALUE=DATE(?!-)/.test(params)) return `${y}-${mo}-${d}T23:59:00`;
  return z ? new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)).toISOString() : `${y}-${mo}-${d}T${h}:${mi}:${s}`;
}

const unescape = (s) => s.replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1");

export function parseIcs(text) {
  const lines = text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "").split(/\r?\n/);
  const events = [];
  let cur = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT" || line === "BEGIN:VTODO") cur = {};
    else if ((line === "END:VEVENT" || line === "END:VTODO") && cur) {
      if (cur.title && cur.due) events.push(cur);
      cur = null;
    } else if (cur) {
      const i = line.indexOf(":");
      if (i < 0) continue;
      const [name, ...params] = line.slice(0, i).split(";");
      const value = line.slice(i + 1);
      const p = params.join(";");
      if (name === "SUMMARY") cur.title = unescape(value).slice(0, 200);
      else if (name === "UID") cur.uid = value.slice(0, 200);
      else if (name === "DESCRIPTION") cur.notes = unescape(value).slice(0, 600);
      else if (name === "URL" && /^https?:\/\//i.test(value)) cur.url = value.slice(0, 500);
      else if (name === "DUE" || (name === "DTSTART" && !cur.due) || (name === "DTEND" && !cur.due)) cur.due = parseDate(value, p);
    }
  }
  // Canvas puts the course code in brackets at the end: "Lab report [BIO-11]".
  for (const e of events) {
    const m = e.title.match(/^(.*?)\s*\[([^\]]+)\]\s*$/);
    if (m) {
      e.title = m[1];
      e.course = m[2];
    }
  }
  return events.slice(0, 500);
}

export async function fetchFeed(rawUrl) {
  const url = await checkUrl(rawUrl);
  const text = await download(url);
  if (!/BEGIN:VCALENDAR/.test(text)) throw new FeedError("That link isn't a calendar feed (.ics).");
  return parseIcs(text);
}
