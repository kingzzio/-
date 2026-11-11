// Question generators for high school entrance & scholarship exams (HSPT, ISEE, SSAT, TACHS).
// Each takes a seeded RNG and returns { q, choices, a, exp }.
import { words, analogyGroups, categories, spelling } from "./data/wordbank.js";

const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const shuffle = (r, arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
// n distinct items from arr, skipping any in `not`.
const sample = (r, arr, n, not = []) => shuffle(r, arr.filter((x) => !not.includes(x))).slice(0, n);
// Shuffled 4-choice question from a right answer and three wrong ones.
const choice4 = (r, q, right, wrongs, exp) => {
  const uniq = [...new Set(wrongs.map(String))].filter((w) => w !== String(right));
  for (let k = 1; uniq.length < 3; k++) if (/^-?\d+$/.test(String(right)) && !uniq.includes(String(Number(right) + k * 7))) uniq.push(String(Number(right) + k * 7)); else if (k > 20) break;
  const choices = shuffle(r, [String(right), ...uniq.slice(0, 3)]);
  right = String(right);
  return { q, choices, a: choices.indexOf(right), exp };
};
// Fixed-order choices (true/false/uncertain, Column A/B) never shuffle.
const fixed = (q, choices, a, exp) => ({ q, choices, a, exp });
const neg = (n) => (n < 0 ? `−${Math.abs(n)}` : `${n}`);

export const entranceGenerators = {
  // ---------- Verbal ----------
  synonym: (r) => {
    const [w, syn, , def] = pick(r, words);
    const wrongs = sample(r, words.map((x) => x[1]), 3, [syn]);
    const q = pick(r, [`Which word means the same as ${w.toUpperCase()}?`, `${w[0].toUpperCase()}${w.slice(1)} most nearly means…`, `Choose the word closest in meaning to: ${w}`]);
    return choice4(r, q, syn, wrongs, `"${w}" means ${def}, so the closest word is "${syn}".`);
  },
  antonym: (r) => {
    const [w, , ant, def] = pick(r, words);
    const wrongs = sample(r, words.map((x) => x[1]), 3, [ant]);
    return choice4(r, `Which word means the OPPOSITE of ${w.toUpperCase()}?`, ant, wrongs, `"${w}" means ${def}. Its opposite is "${ant}". (Watch out: some choices are synonyms, a classic trap.)`);
  },
  analogy: (r) => {
    const g = pick(r, analogyGroups);
    const [p1, p2] = sample(r, g.pairs, 2);
    const right = p2[1];
    const same = sample(r, g.pairs.map((p) => p[0]), 1, [p1[0], p2[0], right]);
    const others = analogyGroups.filter((x) => x !== g).flatMap((x) => x.pairs.map((p) => p[1]));
    const wrongs = [...same, ...sample(r, others, 3, [right, ...same])];
    return choice4(r, `${p1[0][0].toUpperCase()}${p1[0].slice(1)} is to ${p1[1]} as ${p2[0]} is to…`, right, wrongs, `Relationship: ${g.rel}. ${p1[0]} → ${p1[1]}, so ${p2[0]} → ${right}. Tip: say the link as a sentence, then test each choice.`);
  },
  "odd-word": (r) => {
    const [name, list] = pick(r, categories);
    const three = sample(r, list, 3);
    const other = pick(r, categories.filter((c) => c[0] !== name));
    const odd = pick(r, other[1].filter((w) => !list.includes(w)));
    return choice4(r, "Which word does NOT belong with the others?", odd, three, `${three.join(", ")} are all ${name}. "${odd}" is one of the ${other[0]}.`);
  },
  "verbal-logic": (r) => {
    const cap = (t) => t[0].toUpperCase() + t.slice(1);
    let X, Y, Z, rel;
    if (r() < 0.65) {
      [X, Y, Z] = sample(r, ["Ana", "Ben", "Carla", "Dev", "Eli", "Fatima", "Gus", "Hana", "Ivan", "Jada"], 3);
      rel = pick(r, ["is taller than", "is older than", "runs faster than", "reads more books than"]);
    } else {
      const set = pick(r, [[["the blue pen", "the red pen", "the black pen"], "costs more than"], [["the bus", "the train", "the ferry"], "arrives earlier than"], [["Oak Street", "Elm Street", "Pine Street"], "is longer than"], [["the cat", "the dog", "the rabbit"], "weighs more than"]]);
      [X, Y, Z] = shuffle(r, set[0]);
      rel = set[1];
    }
    const s = (a, b) => `${cap(a)} ${rel} ${b}.`;
    const kind = int(r, 0, 2); // 0 true, 1 false, 2 uncertain
    let lines, exp;
    if (kind === 0) {
      lines = [s(X, Y), s(Y, Z), s(X, Z)];
      exp = `Order: ${X}, then ${Y}, then ${Z}. So "${X} ${rel} ${Z}" must be TRUE.`;
    } else if (kind === 1) {
      lines = [s(X, Y), s(Y, Z), s(Z, X)];
      exp = `Order: ${X}, then ${Y}, then ${Z}. "${Z} ${rel} ${X}" is the reverse, so it's FALSE.`;
    } else {
      lines = [s(X, Y), s(X, Z), s(Y, Z)];
      exp = `${cap(X)} beats both ${Y} and ${Z}, but nothing compares ${Y} with ${Z}. So it's UNCERTAIN. Sketch the order on scrap paper to check.`;
    }
    return fixed(`${lines[0]} ${lines[1]} ${lines[2]}\nIf the first two statements are true, the third statement is…`, ["true", "false", "uncertain"], kind, exp);
  },
  "sentence-completion": (r) => {
    const pool = words.filter((w) => w[4]);
    const [w, , , def, ctx] = pick(r, pool);
    const wrongs = sample(r, pool.map((x) => x[0]), 3, [w]);
    return choice4(r, `Choose the word that best completes the sentence:\n${ctx}`, w, wrongs, `"${w}" means ${def}, which fits the clue in the sentence.`);
  },
  spelling: (r) => {
    const [good, bad1, bad2] = pick(r, spelling);
    if (r() < 0.5) {
      const others = sample(r, spelling.filter((s) => s[0] !== good), 3).map((s) => s[0]);
      return choice4(r, "Which word is spelled INCORRECTLY?", pick(r, [bad1, bad2]), others, `The correct spelling is "${good}".`);
    }
    // A third misspelling: double or drop a letter until it's new.
    let third = "";
    for (let k = 0; k < 40 && (!third || [good, bad1, bad2].includes(third)); k++) {
      const i = int(r, 1, good.length - 2);
      third = k % 2 ? good.slice(0, i) + good.slice(i + 1) : good.slice(0, i) + good[i] + good.slice(i);
    }
    return choice4(r, "Which spelling is correct?", good, [bad1, bad2, third], `Remember: ${good}.`);
  },

  // ---------- Quantitative ----------
  "hspt-series": (r) => {
    const kind = int(r, 0, 6);
    let seq, next, rule;
    if (kind === 0) {
      const a = int(r, 2, 40), d = pick(r, [3, 4, 6, 7, 8, 9, 11, -3, -4, -6]);
      seq = Array.from({ length: 6 }, (_, i) => a + d * i + (d < 0 ? 60 : 0));
      next = seq[5] + d;
      rule = `${d > 0 ? "add" : "subtract"} ${Math.abs(d)} each time`;
    } else if (kind === 1) {
      const a = int(r, 1, 5), m = pick(r, [2, 3]);
      seq = Array.from({ length: 5 }, (_, i) => a * m ** i);
      next = seq[4] * m;
      rule = `multiply by ${m} each time`;
    } else if (kind === 2) {
      const a = int(r, 1, 9), p = int(r, 1, 6);
      seq = [a];
      for (let i = 1; i < 6; i++) seq.push(i % 2 ? seq[i - 1] + p : seq[i - 1] * 2);
      next = seq[5] * 2;
      rule = `alternate +${p}, ×2`;
    } else if (kind === 3) {
      const a = int(r, 20, 60), up = int(r, 5, 12), dn = int(r, 2, up - 1);
      seq = [a];
      for (let i = 1; i < 6; i++) seq.push(i % 2 ? seq[i - 1] + up : seq[i - 1] - dn);
      next = seq[5] - dn;
      rule = `alternate +${up}, −${dn}`;
    } else if (kind === 4) {
      const a = int(r, 1, 10), d = int(r, 1, 3);
      seq = [a];
      for (let i = 1; i < 6; i++) seq.push(seq[i - 1] + d * i);
      next = seq[5] + d * 6;
      rule = `the amount added grows by ${d}: +${d}, +${2 * d}, +${3 * d}…`;
    } else if (kind === 5) {
      const s = int(r, 1, 5);
      seq = Array.from({ length: 5 }, (_, i) => (s + i) ** 2);
      next = (s + 5) ** 2;
      rule = `perfect squares: ${s}², ${s + 1}², ${s + 2}²…`;
    } else {
      const a = int(r, 2, 10), b = int(r, 30, 50), da = int(r, 2, 5), db = int(r, 2, 5);
      seq = [a, b, a + da, b - db, a + 2 * da, b - 2 * db];
      next = a + 3 * da;
      rule = `two series take turns: ${a}, ${a + da}, ${a + 2 * da}… (+${da}) and ${b}, ${b - db}… (−${db})`;
    }
    const ask = pick(r, ["What number should come next?", "Look at this series. What number should come next?"]);
    const right = String(next);
    const wrongs = [next + pick(r, [1, 2, -1]), next - pick(r, [3, 4, 5]), next + pick(r, [5, 6, 10])].map(String).filter((x) => x !== right);
    while (wrongs.length < 3) wrongs.push(String(next + wrongs.length * 7 + 3));
    return choice4(r, `${ask}\n${seq.map(neg).join(", ")}, …`, right, wrongs, `Pattern: ${rule}. Next: ${next}. Check differences first, then ratios, then alternating patterns.`);
  },
  "hspt-compare": (r) => {
    // Three quantities; pick the true statement (HSPT non-geometric comparison).
    const makers = [
      () => { const p = pick(r, [10, 20, 25, 50]), n = pick(r, [40, 60, 80, 120]); return [`${p}% of ${n}`, (p * n) / 100]; },
      () => { const d = pick(r, [2, 3, 4, 5]), n = d * int(r, 3, 12); return [`1/${d} of ${n}`, n / d]; },
      () => { const a = int(r, 2, 9), b = int(r, 2, 9); return [`${a} × ${b}`, a * b]; },
      () => { const a = int(r, 3, 7); return [`${a}²`, a * a]; },
      () => { const a = int(r, 10, 60), b = int(r, 2, 20); return [`${a} − ${b}`, a - b]; },
      () => { const a = pick(r, [0.5, 0.25, 0.2]), n = pick(r, [20, 40, 60, 80]); return [`${a} × ${n}`, a * n]; },
    ];
    let items;
    for (let t = 0; t < 30; t++) {
      items = [pick(r, makers)(), pick(r, makers)(), pick(r, makers)()];
      const vals = items.map((x) => x[1]);
      if (vals.every((v) => v > 0 && v < 200 && Number.isInteger(v))) break;
    }
    const [A, B, C] = items.map((x) => x[1]);
    const L = ["(a)", "(b)", "(c)"];
    const V = { "(a)": A, "(b)": B, "(c)": C };
    const statements = [];
    for (const [x, y] of [["(a)", "(b)"], ["(b)", "(c)"], ["(a)", "(c)"]]) {
      statements.push([`${x} is greater than ${y}`, V[x] > V[y]], [`${x} is less than ${y}`, V[x] < V[y]], [`${x} and ${y} are equal`, V[x] === V[y]]);
    }
    statements.push([`(a), (b) and (c) are all equal`, A === B && B === C]);
    const truths = statements.filter((s) => s[1]).map((s) => s[0]);
    const lies = statements.filter((s) => !s[1]).map((s) => s[0]);
    const right = pick(r, truths);
    const wrongs = sample(r, lies, 3);
    return choice4(
      r,
      `Examine (a), (b) and (c) and find the best answer.\n(a) ${items[0][0]}\n(b) ${items[1][0]}\n(c) ${items[2][0]}`,
      right,
      wrongs,
      `Work each out first: (a) = ${A}, (b) = ${B}, (c) = ${C}. Then test each statement. ${L.map((l) => `${l} ${V[l]}`).join(", ")}.`,
    );
  },
  "geo-compare": (r) => {
    let s, l, w, b, h;
    do {
      s = int(r, 3, 8); l = int(r, s + 1, s + 6); w = int(r, 2, s); b = 2 * int(r, 2, 6); h = int(r, 2, 8);
    } while (new Set([s * s, l * w, (b * h) / 2]).size < 3);
    const items = [[`area of a square with side ${s}`, s * s], [`area of a ${l} × ${w} rectangle`, l * w], [`area of a triangle with base ${b} and height ${h}`, (b * h) / 2]];
    const [A, B, C] = items.map((x) => x[1]);
    const order = [["(a)", A], ["(b)", B], ["(c)", C]].sort((x, y) => y[1] - x[1]);
    const strict = order[0][1] > order[1][1] && order[1][1] > order[2][1];
    const right = strict ? `${order[0][0]} > ${order[1][0]} > ${order[2][0]}` : `${order[0][0]} ≥ ${order[1][0]} ≥ ${order[2][0]}`;
    const perms = [["(a)", "(b)", "(c)"], ["(a)", "(c)", "(b)"], ["(b)", "(a)", "(c)"], ["(b)", "(c)", "(a)"], ["(c)", "(a)", "(b)"], ["(c)", "(b)", "(a)"]].map((p) => p.join(strict ? " > " : " ≥ "));
    return choice4(r, `Compare the areas and pick the true order (largest first).\n(a) ${items[0][0]}\n(b) ${items[1][0]}\n(c) ${items[2][0]}`, right, sample(r, perms, 3, [right]), `Square: ${s}×${s} = ${A}. Rectangle: ${l}×${w} = ${B}. Triangle: ½×${b}×${h} = ${C}.`);
  },
  "number-manip": (r) => {
    const kind = int(r, 0, 3);
    if (kind === 0) {
      const d = pick(r, [3, 4, 5]), n = pick(r, [2, 3]), base = d * int(r, 4, 12), k = int(r, 2, 15);
      const v = (base / d) * n;
      return choice4(r, `What number is ${k} more than ${n}/${d} of ${base}?`, String(v + k), [String(v), String(v - k), String(base / d + k)], `${n}/${d} of ${base} = ${v}. Then ${v} + ${k} = ${v + k}.`);
    }
    if (kind === 1) {
      const x = 2 * int(r, 4, 20), k = int(r, 2, 10);
      return choice4(r, `Half of what number is ${k} more than ${x / 2 - k}?`, String(x), [String(x / 2), String(x + k), String(x - 2 * k)], `${k} more than ${x / 2 - k} is ${x / 2}. Half of the number is ${x / 2}, so the number is ${x}.`);
    }
    if (kind === 2) {
      const a = int(r, 2, 6), b = int(r, 3, 9), c = int(r, 2, 20);
      return choice4(r, `What number subtracted from ${a * b + c} leaves ${a} times ${b}?`, String(c), [String(a * b), String(c + a), String(a * b - c)], `${a} × ${b} = ${a * b}. ${a * b + c} − ? = ${a * b}, so ? = ${c}.`);
    }
    const p = pick(r, [10, 20, 25, 50]), n = pick(r, [40, 80, 120, 200]), q = (p * n) / 100, d = pick(r, [2, 4, 5]);
    return choice4(r, `What is ${p}% of ${n}, divided by ${d}?`, String(q / d), [String(q), String((p * n) / d), String(q * d)], `${p}% of ${n} = ${q}. ${q} ÷ ${d} = ${q / d}.`);
  },
  "isee-qc": (r) => {
    // ISEE/SSAT-style quantitative comparison with fixed choices.
    const C = ["The quantity in Column A is greater.", "The quantity in Column B is greater.", "The two quantities are equal.", "The relationship cannot be determined from the information given."];
    const kind = int(r, 0, 4);
    if (kind === 0) {
      const p = pick(r, [20, 25, 40, 50]), n = pick(r, [60, 80, 120]), a = (p * n) / 100, b = a + pick(r, [-3, 0, 4]);
      return fixed(`Column A: ${p}% of ${n}\nColumn B: ${b}`, C, a > b ? 0 : a < b ? 1 : 2, `${p}% of ${n} = ${a}, compared with ${b}.`);
    }
    if (kind === 1) {
      return fixed(`x is a number.\nColumn A: x²\nColumn B: x`, C, 3, `If x = 2, x² is bigger. If x = ½, x is bigger. If x = 1, they're equal. Since it changes, it cannot be determined.`);
    }
    if (kind === 2) {
      const x = int(r, 2, 9), k = int(r, 1, 6);
      return fixed(`${x}x = ${x * k}\nColumn A: x\nColumn B: ${k}`, C, 2, `Divide both sides by ${x}: x = ${k}. They're equal.`);
    }
    if (kind === 3) {
      const a = int(r, 2, 5), b = int(r, 2, 5);
      const A = a ** b, B = b ** a;
      return fixed(`Column A: ${a}${"⁰¹²³⁴⁵⁶⁷⁸⁹"[b]}\nColumn B: ${b}${"⁰¹²³⁴⁵⁶⁷⁸⁹"[a]}`, C, A > B ? 0 : A < B ? 1 : 2, `${a}^${b} = ${A} and ${b}^${a} = ${B}.`);
    }
    const n = int(r, 3, 9);
    return fixed(`n is a positive whole number less than ${n}.\nColumn A: n\nColumn B: ${n}`, C, 1, `Every possible n is less than ${n}, so Column B is always greater.`);
  },

  // ---------- ACT / AP ----------
  "data-table": (r) => {
    // ACT Science-style: read an experiment table and reason about the trend.
    const setups = [
      ["Temperature of water (°C)", "Sugar dissolved (g)", [20, 40, 60, 80], (x) => 2 * x + 160, "dissolves more sugar"],
      ["Ramp height (cm)", "Cart speed at bottom (cm/s)", [10, 20, 30, 40], (x) => 4 * x + 20, "the cart is faster"],
      ["Light intensity (units)", "O₂ bubbles per minute", [1, 2, 3, 4], (x) => 6 * x + 2, "the plant makes more oxygen"],
      ["Altitude (km)", "Air temperature (°C)", [0, 2, 4, 6], (x) => 15 - 6.5 * x, "the air gets colder"],
    ];
    const [xl, yl, xs, f, up] = pick(r, setups);
    const ys = xs.map(f);
    const table = `${xl}: ${xs.join(" | ")}\n${yl}: ${ys.map((y) => (Number.isInteger(y) ? y : y.toFixed(1))).join(" | ")}`;
    const kind = int(r, 0, 1);
    if (kind === 0) {
      const rising = ys[3] > ys[0];
      return choice4(r, `A student recorded these results:\n${table}\nAs ${xl.split(" (")[0].toLowerCase()} increases, ${yl.split(" (")[0].toLowerCase()}…`, rising ? "increases" : "decreases", [rising ? "decreases" : "increases", "stays the same", "increases, then decreases"], `Read across the table: ${ys[0]} → ${ys[3]}. As x goes up, ${up}.`);
    }
    const mid = (xs[1] + xs[2]) / 2, y = f(mid);
    const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
    return choice4(r, `A student recorded these results:\n${table}\nWhat value would you predict for ${xl.split(" (")[0].toLowerCase()} = ${mid}?`, fmt(y), [fmt(f(xs[1])), fmt(f(xs[2])), fmt(y + (y > 0 ? 25 : -25))], `${mid} is halfway between ${xs[1]} and ${xs[2]}, so the answer is about halfway between ${fmt(f(xs[1]))} and ${fmt(f(xs[2]))}: ${fmt(y)}.`);
  },
  "integral-def": (r) => {
    const n = int(r, 1, 3), a = int(r, 1, 4), b = int(r, 2, 4);
    // ∫₀^b a·xⁿ dx = a·b^(n+1)/(n+1)
    const val = (a * b ** (n + 1)) / (n + 1);
    const gcd = (x, y) => (y ? gcd(y, x % y) : x);
    const top = a * b ** (n + 1), g = gcd(top, n + 1);
    const fmt = (v) => (Number.isInteger(v) ? String(v) : `${top / g}/${(n + 1) / g}`);
    const sup = n === 1 ? "" : "⁰¹²³⁴⁵"[n];
    return choice4(r, `Evaluate ∫₀^${b} ${a === 1 ? "" : a}x${sup} dx`, fmt(val), [String(a * b ** n), String(a * n * b ** (n - 1)), String(a * b ** (n + 1)), String(a * b ** (n + 1) * (n + 1)), String(a * b ** (n + 1) + 1)], `Power rule: ∫ ${a}x${sup} dx = ${a}x^${n + 1}/${n + 1}. Plug in ${b} and 0: ${a}·${b}^${n + 1}/${n + 1} = ${fmt(val)}.`);
  },
  "z-score": (r) => {
    const mean = pick(r, [50, 60, 70, 75, 80]), sd = pick(r, [4, 5, 8, 10]), z = pick(r, [-2, -1.5, -1, 1, 1.5, 2]);
    const x = mean + z * sd;
    return choice4(r, `Test scores have a mean of ${mean} and a standard deviation of ${sd}. What is the z-score of a score of ${x}?`, String(z), [String(-z), String(z * 2), String(x - mean)], `z = (x − mean) ÷ SD = (${x} − ${mean}) ÷ ${sd} = ${z}.`);
  },
  binary: (r) => {
    const n = int(r, 5, 63);
    const b = n.toString(2);
    if (r() < 0.5) return choice4(r, `What is the binary number ${b} in decimal?`, String(n), [String(n + 1), String(n - 2), String(parseInt(b.split("").reverse().join(""), 2))], `Add the place values that have a 1: ${b.split("").map((d, i) => (d === "1" ? 2 ** (b.length - 1 - i) : 0)).filter(Boolean).join(" + ")} = ${n}.`);
    return choice4(r, `What is the decimal number ${n} in binary?`, b, [(n + 1).toString(2), (n - 1).toString(2), b.split("").reverse().join("") === b ? (n + 2).toString(2) : b.split("").reverse().join("")], `Break ${n} into powers of 2 and write a 1 for each one used: ${b}.`);
  },
  boolean: (r) => {
    const A = r() < 0.5, B = r() < 0.5, C = r() < 0.5;
    const forms = [
      [`(A AND B) OR C`, (A && B) || C],
      [`A AND (NOT B)`, A && !B],
      [`NOT (A OR B)`, !(A || B)],
      [`(A OR B) AND (NOT C)`, (A || B) && !C],
      [`NOT A OR (B AND C)`, !A || (B && C)],
    ];
    const [expr, val] = pick(r, forms);
    return fixed(`A = ${A}, B = ${B}, C = ${C}.\nWhat does ${expr} evaluate to?`, ["true", "false", "an error", "it depends"], val ? 0 : 1, `Evaluate the parentheses first, then NOT, AND, OR. ${expr} → ${val}.`);
  },
};
