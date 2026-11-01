// BrainBoro Live checks: create, join, answer once, speed scoring, host-only controls, timing.
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.BRAINBORO_DB_FILE = join(mkdtempSync(join(tmpdir(), "bb-live-")), "db.json");
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.KV_REST_API_URL;
const { handleLive } = await import("../lib/live.js");

const questions = [
  { q: "2 + 2?", choices: ["3", "4", "5", "6"], a: 1, exp: "Add." },
  { q: "3 × 3?", choices: ["6", "9"], a: 1 },
];
await assert.rejects(handleLive({ action: "create", questions: [{ q: "x", choices: ["a"], a: 0 }] }), /choices/);
const { pin, hostKey } = await handleLive({ action: "create", title: "Test", questions, seconds: 20 });
assert.match(pin, /^\d{6}$/);

const ana = await handleLive({ action: "join", pin, name: "Ana" });
const ben = await handleLive({ action: "join", pin, name: "Ben" });
await assert.rejects(handleLive({ action: "join", pin, name: "ana" }), /nickname/);
await assert.rejects(handleLive({ action: "join", pin: "000000", name: "Zed" }), /No game/);

let s = await handleLive({ action: "state", pin, playerId: ana.playerId });
assert.equal(s.phase, "lobby");
assert.deepEqual(s.players.sort(), ["Ana", "Ben"]);

// Players can't run the game.
await assert.rejects(handleLive({ action: "host", pin, hostKey: "nope", step: "next" }), /Only the host/);
s = await handleLive({ action: "host", pin, hostKey, step: "next" });
assert.equal(s.phase, "question");
assert.equal(s.answer, undefined, "the answer is hidden while the question is open");

// Answers: once each, with the player's secret.
await assert.rejects(handleLive({ action: "answer", pin, playerId: ana.playerId, secret: "bad", choice: 1 }), /Rejoin/);
await handleLive({ action: "answer", pin, playerId: ana.playerId, secret: ana.secret, choice: 1 });
await assert.rejects(handleLive({ action: "answer", pin, playerId: ana.playerId, secret: ana.secret, choice: 2 }), /already/);
await handleLive({ action: "answer", pin, playerId: ben.playerId, secret: ben.secret, choice: 0 });

s = await handleLive({ action: "state", pin, playerId: ana.playerId });
assert.equal(s.answered, 2);
assert.deepEqual(s.myAnswer, { locked: true });

s = await handleLive({ action: "host", pin, hostKey, step: "reveal" });
assert.equal(s.answer, 1);
assert.deepEqual(s.dist, [1, 1, 0, 0]);
assert.equal(s.leaders[0].name, "Ana");
assert.ok(s.leaders[0].score > 900, "a fast right answer is worth close to 1000");
const anaView = await handleLive({ action: "state", pin, playerId: ana.playerId });
assert.equal(anaView.me.rank, 1);
assert.equal(anaView.myAnswer.correct, true);
await assert.rejects(handleLive({ action: "answer", pin, playerId: ben.playerId, secret: ben.secret, choice: 1 }), /Time's up/);

await handleLive({ action: "host", pin, hostKey, step: "next" });
s = await handleLive({ action: "host", pin, hostKey, step: "next" });
assert.equal(s.phase, "done");
assert.equal(s.leaders.length, 2);
console.log("live game checks OK");
