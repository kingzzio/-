// Sanity-checks every math generator: 4 distinct choices, valid answer index, no NaN/undefined text.
import { generators } from "../public/js/generators.js";
import { makeRng } from "../public/js/generators.js";

let bad = 0;
for (const [name, gen] of Object.entries(generators)) {
  const r = makeRng(name);
  for (let i = 0; i < 2000; i++) {
    const q = gen(r);
    const text = [q.q, q.exp, ...q.choices].join(" | ");
    const problems = [];
    if (q.choices.length !== 4) problems.push(`choices=${q.choices.length}`);
    if (new Set(q.choices).size !== q.choices.length) problems.push("dupe choices");
    if (!(q.a >= 0 && q.a < q.choices.length)) problems.push("bad answer index");
    if (/NaN|undefined|Infinity|null|\[object/.test(text)) problems.push("bad text");
    if (problems.length) {
      bad++;
      if (bad < 25) console.log(name, problems.join(","), "\n  ", text);
    }
  }
}
console.log(bad ? `${bad} bad questions` : "all generators OK");
process.exit(bad ? 1 : 0);
