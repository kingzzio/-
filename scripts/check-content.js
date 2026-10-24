// Validates all study content: unique ids, valid questions, and that every exam/curriculum link points at a real topic.
import math from "../public/js/data/math.js";
import ela from "../public/js/data/ela.js";
import science from "../public/js/data/science.js";
import history from "../public/js/data/history.js";
import { exams, extraTopics } from "../public/js/data/exams.js";
import { curricula } from "../public/js/data/curricula.js";
import { generators } from "../public/js/generators.js";
import { cheatcodes } from "../public/js/data/cheatcodes.js";
import { resources } from "../public/js/data/resources.js";

const topics = [...math, ...ela, ...science, ...history, ...extraTopics];
const ids = new Map();
const errors = [];
let cards = 0, qs = 0;

for (const t of topics) {
  if (ids.has(t.id)) errors.push(`duplicate topic id ${t.id}`);
  ids.set(t.id, t);
  for (const key of ["id", "subject", "course", "name", "desc"]) if (!t[key]) errors.push(`${t.id}: missing ${key}`);
  for (const g of t.gen || []) if (!generators[g]) errors.push(`${t.id}: unknown generator ${g}`);
  for (const c of t.cards) {
    cards++;
    if (c.length !== 2 || !c[0] || !c[1]) errors.push(`${t.id}: bad card ${JSON.stringify(c)}`);
  }
  for (const q of t.qs) {
    qs++;
    const [text, choices, a, exp] = q;
    if (!text || !Array.isArray(choices) || !exp) errors.push(`${t.id}: bad question ${text}`);
    if (!(a >= 0 && a < choices.length)) errors.push(`${t.id}: answer index out of range: ${text}`);
    if (new Set(choices).size !== choices.length) errors.push(`${t.id}: duplicate choices: ${text}`);
  }
}
for (const e of exams) for (const s of e.sections) for (const id of s.topics) if (!ids.has(id)) errors.push(`exam ${e.id}: unknown topic ${id}`);
for (const c of curricula) for (const course of c.courses) for (const [unit, list] of course.units) for (const id of list) if (!ids.has(id)) errors.push(`curriculum ${c.id} / ${unit}: unknown topic ${id}`);

const examIds = new Set(exams.map((e) => e.id));
const curIds = new Set(curricula.map((c) => c.id));
for (const c of cheatcodes) {
  if (!ids.has(c.topic)) errors.push(`cheat ${c.id}: unknown topic ${c.topic}`);
  for (const e of c.exams) if (!examIds.has(e)) errors.push(`cheat ${c.id}: unknown exam ${e}`);
  if (!(c.a >= 0 && c.a < c.choices.length)) errors.push(`cheat ${c.id}: bad answer index`);
  if (c.steps.length < 3 || c.steps.some((s) => !s.show || !s.say)) errors.push(`cheat ${c.id}: bad steps`);
}
for (const r of resources) {
  if (!/^https:\/\//.test(r.url)) errors.push(`resource ${r.id}: url must be https`);
  for (const e of r.exams || []) if (!examIds.has(e)) errors.push(`resource ${r.id}: unknown exam ${e}`);
  for (const c of r.curricula || []) if (!curIds.has(c)) errors.push(`resource ${r.id}: unknown curriculum ${c}`);
}

console.log(`${topics.length} topics, ${cards} flashcards, ${qs} hand-written questions, ${Object.keys(generators).length} generators, ${exams.length} exams, ${curricula.length} curricula, ${cheatcodes.length} cheat codes, ${resources.length} resources`);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("content OK");
