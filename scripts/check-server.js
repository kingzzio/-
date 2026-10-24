// Unit checks for the calendar parser, feed URL safety, and premium tokens.
import assert from "node:assert/strict";
import { parseIcs, fetchFeed, FeedError } from "../lib/calendar.js";

const ics = [
  "BEGIN:VCALENDAR",
  "BEGIN:VEVENT",
  "UID:event-assignment-123",
  "DTSTART:20261028T035900Z",
  "SUMMARY:Systems of equations worksheet [ALG2-11]",
  "DESCRIPTION:Problems 1\\, 2 and 3\\nShow work",
  "URL:https://school.instructure.com/courses/1/assignments/123",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:event-2",
  "DTSTART;VALUE=DATE:20261030",
  "SUMMARY:Read chapter 7 for English",
  "  11",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n").replace("\r\n  11", "\r\n 11");
const events = parseIcs(ics);
assert.equal(events.length, 2);
assert.equal(events[0].title, "Systems of equations worksheet");
assert.equal(events[0].course, "ALG2-11");
assert.equal(events[0].due, "2026-10-28T03:59:00.000Z");
assert.equal(events[0].notes, "Problems 1, 2 and 3\nShow work");
assert.equal(events[1].title, "Read chapter 7 for English11");
assert.equal(events[1].due, "2026-10-30T23:59:00");

for (const bad of ["http://example.com/a.ics", "https://127.0.0.1/a.ics", "https://localhost/a.ics", "https://10.0.0.5/x", "https://[::1]/x", "https://169.254.169.254/latest", "not a url"]) {
  await assert.rejects(fetchFeed(bad), FeedError, bad);
}

process.env.BRAINBORO_PREMIUM_SECRET = "test-secret-that-is-long-enough";
process.env.BRAINBORO_PREMIUM_CODES = "BORO-ABC, vip2026";
const { redeem, verifyToken } = await import("../lib/premium.js");
assert.ok(redeem("nope").error);
const ok = redeem(" vip2026 ");
assert.ok(ok.token && ok.exp > Date.now());
assert.equal(verifyToken(ok.token), true);
assert.equal(verifyToken(ok.token.slice(0, -2) + "xx"), false);
const [payload, sig] = ok.token.split(".");
const forged = Buffer.from(JSON.stringify({ p: 1, exp: Date.now() + 1e12 })).toString("base64url");
assert.equal(verifyToken(`${forged}.${sig}`), false);
assert.equal(verifyToken(""), false);
assert.equal(parseIcs("BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:x\nDTSTART:20261028\nURL:javascript:alert(1)\nEND:VEVENT\nEND:VCALENDAR")[0].url, undefined);
console.log("server checks OK");
