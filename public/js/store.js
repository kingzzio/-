// Local progress store (localStorage). Everything works offline and without an account.
const KEY = "brainboro:v1";
const DAY = 86400000;
const listeners = new Set();

export const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fresh = () => ({
  profile: { name: "", grade: "", exam: "", avatar: "🦉", onboarded: false },
  xp: 0,
  streak: { count: 0, best: 0, last: "" },
  goal: { daily: 50, date: "", xpToday: 0 },
  cards: {},
  topics: {},
  mistakes: [],
  badges: [],
  tests: [],
  daily: {},
  stats: { answered: 0, correct: 0, cardsReviewed: 0, aiChats: 0, battles: 0, perfect: 0, cheatCodes: 0, tasksDone: 0 },
  theme: "",
  premium: { token: "", exp: 0 },
  planner: { items: [], feeds: [], connections: [], streak: { count: 0, last: "" }, lastSync: 0 },
  account: null,
  blitz: { best: 0 },
  answers: [],
  essay: null,
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const data = JSON.parse(raw);
    const base = fresh();
    return {
      ...base,
      ...data,
      profile: { ...base.profile, ...data.profile },
      stats: { ...base.stats, ...data.stats },
      goal: { ...base.goal, ...data.goal },
      streak: { ...base.streak, ...data.streak },
      premium: { ...base.premium, ...data.premium },
      planner: { ...base.planner, ...data.planner },
      blitz: { ...base.blitz, ...data.blitz },
    };
  } catch {
    return fresh();
  }
}

export const state = load();

/** Persists state. `quiet` skips the account sync (used by the sync itself). */
export function save(quiet = false) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked — progress just won't persist */
  }
  listeners.forEach((fn) => fn(state, quiet));
}

export const onChange = (fn) => listeners.add(fn);

export function resetAll() {
  Object.assign(state, fresh());
  save();
}

export const isPremium = () => Boolean(state.account?.user?.premium) || (Boolean(state.premium.token) && state.premium.exp > Date.now());

export const level = (xp = state.xp) => Math.floor(Math.sqrt(xp / 40)) + 1;
export const levelFloor = (lv) => (lv - 1) ** 2 * 40;
export const levelProgress = () => {
  const lv = level();
  const lo = levelFloor(lv), hi = levelFloor(lv + 1);
  return { lv, pct: Math.round(((state.xp - lo) / (hi - lo)) * 100), toNext: hi - state.xp };
};

const LEVEL_NAMES = ["Rookie", "Learner", "Scholar", "Brainiac", "Genius", "Mastermind", "Legend", "Boro Boss"];
export const levelName = (lv = level()) => LEVEL_NAMES[Math.min(LEVEL_NAMES.length - 1, Math.floor((lv - 1) / 3))];

// Studying today keeps the streak alive.
function touchStreak() {
  const today = todayKey();
  if (state.streak.last === today) return;
  const yesterday = todayKey(new Date(Date.now() - DAY));
  state.streak.count = state.streak.last === yesterday ? state.streak.count + 1 : 1;
  state.streak.best = Math.max(state.streak.best, state.streak.count);
  state.streak.last = today;
}

export function streakAlive() {
  return state.streak.last === todayKey() || state.streak.last === todayKey(new Date(Date.now() - DAY));
}

export function xpToday() {
  return state.goal.date === todayKey() ? state.goal.xpToday : 0;
}

/** Adds XP and returns any newly earned badges. */
export function addXp(amount) {
  touchStreak();
  state.xp += amount;
  const today = todayKey();
  if (state.goal.date !== today) {
    state.goal.date = today;
    state.goal.xpToday = 0;
  }
  state.goal.xpToday += amount;
  const earned = checkBadges();
  save();
  return earned;
}

export function recordAnswer(q, choiceIndex) {
  const correct = choiceIndex === q.a;
  state.stats.answered++;
  if (correct) state.stats.correct++;
  if (q.topicId) {
    const t = (state.topics[q.topicId] ||= { answered: 0, correct: 0, last: 0 });
    t.answered++;
    if (correct) t.correct++;
    t.last = Date.now();
  }
  if (!correct) {
    state.mistakes = state.mistakes.filter((m) => m.q !== q.q);
    state.mistakes.unshift({ q: q.q, choices: q.choices, a: q.a, picked: choiceIndex, exp: q.exp, topicId: q.topicId, at: Date.now() });
    state.mistakes = state.mistakes.slice(0, 150);
  }
  save();
  return correct;
}

export function mastery(topicId) {
  const t = state.topics[topicId];
  if (!t || !t.answered) return null;
  // Weighted toward accuracy, with a small boost for volume so 1/1 isn't "mastered".
  const acc = t.correct / t.answered;
  return Math.round(acc * Math.min(1, t.answered / 10) * 100);
}

// --- Leitner spaced repetition for flashcards ---
const BOX_DAYS = [0, 1, 3, 7, 16, 35];
export function reviewCard(id, knewIt) {
  const c = (state.cards[id] ||= { box: 0, due: 0 });
  c.box = knewIt ? Math.min(BOX_DAYS.length - 1, c.box + 1) : 0;
  c.due = Date.now() + BOX_DAYS[c.box] * DAY;
  state.stats.cardsReviewed++;
  save();
}
export const cardDue = (id) => !state.cards[id] || state.cards[id].due <= Date.now();
export const cardKnown = (id) => (state.cards[id]?.box || 0) >= 2;
export const dueCount = () => Object.values(state.cards).filter((c) => c.due <= Date.now()).length;

// --- Badges ---
export const BADGES = [
  { id: "first-steps", emoji: "👣", name: "First Steps", desc: "Answer your first question", test: (s) => s.stats.answered >= 1 },
  { id: "on-fire", emoji: "🔥", name: "On Fire", desc: "3-day streak", test: (s) => s.streak.count >= 3 },
  { id: "week-warrior", emoji: "⚔️", name: "Week Warrior", desc: "7-day streak", test: (s) => s.streak.count >= 7 },
  { id: "unstoppable", emoji: "🚀", name: "Unstoppable", desc: "30-day streak", test: (s) => s.streak.count >= 30 },
  { id: "perfect", emoji: "💯", name: "Flawless", desc: "Get a perfect quiz", test: (s) => s.stats.perfect >= 1 },
  { id: "century", emoji: "🎯", name: "Century", desc: "Answer 100 questions", test: (s) => s.stats.answered >= 100 },
  { id: "thousand", emoji: "🏆", name: "Grinder", desc: "Answer 1,000 questions", test: (s) => s.stats.answered >= 1000 },
  { id: "card-shark", emoji: "🃏", name: "Card Shark", desc: "Review 100 flashcards", test: (s) => s.stats.cardsReviewed >= 100 },
  { id: "test-taker", emoji: "📝", name: "Test Taker", desc: "Finish a timed practice test", test: (s) => s.tests.length >= 1 },
  { id: "ai-buddy", emoji: "🤖", name: "AI Buddy", desc: "Ask Boro a question", test: (s) => s.stats.aiChats >= 1 },
  { id: "challenger", emoji: "🥊", name: "Challenger", desc: "Play a Brain Battle", test: (s) => s.stats.battles >= 1 },
  { id: "hacker", emoji: "🕹️", name: "Code Breaker", desc: "Watch 5 Cheat Codes", test: (s) => s.stats.cheatCodes >= 5 },
  { id: "on-time", emoji: "📅", name: "Never Late", desc: "Finish 10 assignments", test: (s) => s.stats.tasksDone >= 10 },
  { id: "level-5", emoji: "🧠", name: "Big Brain", desc: "Reach level 5", test: (s) => level(s.xp) >= 5 },
];

export function checkBadges() {
  const earned = [];
  for (const b of BADGES) {
    if (!state.badges.includes(b.id) && b.test(state)) {
      state.badges.push(b.id);
      earned.push(b);
    }
  }
  return earned;
}
