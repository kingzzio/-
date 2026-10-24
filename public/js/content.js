// Aggregates all study content and builds question sets.
import math from "./data/math.js";
import ela from "./data/ela.js";
import science from "./data/science.js";
import history from "./data/history.js";
import { exams, extraTopics } from "./data/exams.js";
import { curricula, schoolTypes } from "./data/curricula.js";
import { generateSet, makeRng } from "./generators.js";

export { exams, curricula, schoolTypes };

export const subjects = [
  { id: "math", name: "Math", emoji: "➗", color: "var(--c-math)" },
  { id: "ela", name: "ELA", emoji: "📖", color: "var(--c-ela)" },
  { id: "science", name: "Science", emoji: "🔬", color: "var(--c-sci)" },
  { id: "history", name: "History", emoji: "🏛️", color: "var(--c-hist)" },
];

export const topics = [...math, ...ela, ...science, ...history, ...extraTopics];
const byId = new Map(topics.map((t) => [t.id, t]));

export const getTopic = (id) => byId.get(id);
export const getExam = (id) => exams.find((e) => e.id === id);
export const subjectOf = (id) => subjects.find((s) => s.id === id);
export const examsForTopic = (id) => exams.filter((e) => e.sections.some((s) => s.topics.includes(id)));

export function examTopicIds(exam) {
  return [...new Set(exam.sections.flatMap((s) => s.topics))];
}

export function search(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const words = q.split(/\s+/);
  return topics
    .map((t) => {
      const hay = `${t.name} ${t.desc} ${t.course} ${t.unit} ${t.tags.join(" ")} ${t.cards.map((c) => c[0]).join(" ")}`.toLowerCase();
      const score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0) + (t.name.toLowerCase().includes(w) ? 2 : 0), 0);
      return { t, score };
    })
    .filter((x) => x.score >= words.length)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.t);
}

export const cardId = (topicId, i) => `${topicId}#${i}`;

function shuffle(arr, r) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Converts a stored [q, choices, a, exp] tuple into a question object with shuffled choices.
function fromTuple(tuple, topicId, r) {
  const [q, choices, a, exp] = tuple;
  const order = choices.length <= 2 ? choices.map((_, i) => i) : shuffle(choices.map((_, i) => i), r);
  return { q, choices: order.map((i) => choices[i]), a: order.indexOf(a), exp, topicId };
}

/**
 * Builds a quiz from topic ids: hand-written questions first (shuffled), topped up with generated ones.
 * Deterministic for a given seed, which is what makes Brain Battle links fair.
 */
export function buildQuiz(topicIds, n, seed = Date.now(), { generatedOnly = false } = {}) {
  const r = makeRng(seed);
  const list = topicIds.map(getTopic).filter(Boolean);
  let pool = generatedOnly ? [] : shuffle(list.flatMap((t) => t.qs.map((tuple) => fromTuple(tuple, t.id, r))), r);
  // Spread questions across topics instead of clumping.
  if (list.length > 1) {
    const buckets = new Map();
    for (const q of pool) (buckets.get(q.topicId) || buckets.set(q.topicId, []).get(q.topicId)).push(q);
    pool = [];
    const lists = [...buckets.values()];
    for (let i = 0; pool.length < n && lists.some((l) => l.length); i++) {
      const l = lists[i % lists.length];
      if (l.length) pool.push(l.shift());
    }
  }
  const out = pool.slice(0, n);
  const gens = list.flatMap((t) => (t.gen || []).map((g) => [g, t.id]));
  if (out.length < n && gens.length) {
    const genSeed = Math.floor(r() * 1e9);
    const shuffled = shuffle(gens, r);
    const made = generateSet(shuffled.map(([g]) => g), n - out.length, genSeed);
    made.forEach((q) => {
      const owner = shuffled.find(([g]) => g === q.gen);
      out.push({ ...q, topicId: owner ? owner[1] : list[0].id });
    });
  }
  return shuffle(out, r);
}

/** Today's Daily Brain Blast: the same 5 questions for everyone today. */
export function dailyQuiz(dateKey, examId) {
  const exam = examId && getExam(examId);
  const ids = exam ? examTopicIds(exam) : topics.map((t) => t.id);
  return buildQuiz(ids, 5, `daily-${dateKey}-${examId || "all"}`);
}
