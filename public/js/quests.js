// Daily quests: three small goals a day, tracked automatically, with a treasure chest when all are done.
import { state, save, todayKey, addXp } from "./store.js";
import { toast, confetti } from "./ui.js";
import { hashString, makeRng } from "./generators.js";

const POOL = [
  { id: "answer10", label: "Answer 10 questions", goal: 10, on: "answer" },
  { id: "answer25", label: "Answer 25 questions", goal: 25, on: "answer" },
  { id: "right8", label: "Get 8 answers right", goal: 8, on: "right" },
  { id: "streak5", label: "Get 5 right in a row", goal: 5, on: "inarow" },
  { id: "cards10", label: "Review 10 flashcards", goal: 10, on: "card" },
  { id: "xp60", label: "Earn 60 XP", goal: 60, on: "xp" },
  { id: "xp120", label: "Earn 120 XP", goal: 120, on: "xp" },
  { id: "visit-live", label: "Play or host a BrainBoro Live game", goal: 1, on: "visit:live" },
  { id: "visit-boroscore", label: "Practice in BoroScore", goal: 1, on: "visit:boroscore" },
  { id: "visit-answer", label: "Use Snap & Answer", goal: 1, on: "visit:answer" },
  { id: "visit-focus", label: "Start a focus session", goal: 1, on: "visit:focus" },
  { id: "visit-boss", label: "Fight a boss battle", goal: 1, on: "visit:boss" },
];

export function quests() {
  const today = todayKey();
  if (state.quests.date !== today) {
    const r = makeRng(hashString(`${today}-${state.device || "x"}`));
    const picks = [];
    const pool = [...POOL];
    // One answer quest, one "do a thing" quest, one random.
    const take = (filter) => {
      const opts = pool.filter(filter);
      const q = opts[Math.floor(r() * opts.length)];
      pool.splice(pool.indexOf(q), 1);
      picks.push({ id: q.id, n: 0 });
    };
    take((q) => q.on === "answer" || q.on === "right");
    take((q) => q.on.startsWith("visit:"));
    take(() => true);
    state.quests = { date: today, list: picks, claimed: false };
    save();
  }
  return state.quests.list.map((x) => ({ ...POOL.find((p) => p.id === x.id), n: x.n }));
}
export const questsDone = () => quests().every((q) => q.n >= q.goal);

let inarow = 0;
function bump(kind, by = 1) {
  quests();
  let changed = false;
  for (const x of state.quests.list) {
    const def = POOL.find((p) => p.id === x.id);
    if (!def || def.on !== kind || x.n >= def.goal) continue;
    x.n = kind === "inarow" ? Math.max(x.n, by) : Math.min(def.goal, x.n + by);
    if (x.n >= def.goal) toast(`Quest complete: ${def.label}`, { emoji: "✅" });
    changed = true;
  }
  if (changed) save();
}

/** Opens the chest once all three quests are done. */
export function claimChest() {
  if (!questsDone() || state.quests.claimed) return null;
  const coins = 40 + Math.floor(Math.random() * 41);
  state.quests.claimed = true;
  state.coins += coins;
  state.stats.questDays = (state.stats.questDays || 0) + 1;
  addXp(30);
  save();
  confetti(120);
  return coins;
}

addEventListener("bb:answer", (e) => {
  bump("answer");
  if (e.detail.ok) {
    bump("right");
    inarow++;
    bump("inarow", inarow);
  } else inarow = 0;
});
addEventListener("bb:card", () => bump("card"));
addEventListener("bb:xp", (e) => bump("xp", e.detail.amount));
addEventListener("hashchange", () => {
  const root = location.hash.replace(/^#\/?/, "").split(/[/?]/)[0];
  if (root) bump(`visit:${root}`);
});
