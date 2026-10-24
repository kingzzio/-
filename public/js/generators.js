// Procedural math question generators — unlimited practice.
// Every generator takes a seeded RNG so a "Brain Battle" link reproduces the same questions for a friend.

export function makeRng(seed) {
  let s = typeof seed === "number" ? seed >>> 0 : hashString(String(seed));
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const nz = (r, lo, hi) => {
  let v = 0;
  while (v === 0) v = int(r, lo, hi);
  return v;
};
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
const sgn = (n) => (n < 0 ? `− ${Math.abs(n)}` : `+ ${n}`);
const neg = (n) => (n < 0 ? `−${Math.abs(n)}` : `${n}`);
const term = (coef, v = "x") => (coef === 1 ? v : coef === -1 ? `−${v}` : `${neg(coef)}${v}`);
const frac = (n, d) => {
  const g = gcd(n, d);
  n /= g;
  d /= g;
  if (d < 0) {
    n = -n;
    d = -d;
  }
  return d === 1 ? neg(n) : `${neg(n)}/${d}`;
};
const money = (x) => `$${x.toFixed(2)}`;
const sup = (n) => String(n).split("").map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[c] ?? (c === "-" ? "⁻" : c)).join("");

// Builds a 4-choice question; wrong answers come from common-mistake candidates, padded with nearby values.
function mc(r, question, answer, wrongs, explanation, fmt = (x) => String(x)) {
  const seen = new Set([fmt(answer)]);
  const opts = [fmt(answer)];
  for (const w of wrongs) {
    const f = fmt(w);
    if (!seen.has(f) && opts.length < 4) {
      seen.add(f);
      opts.push(f);
    }
  }
  // Pad with near-misses: nudge the number (or the last number inside a text answer).
  for (let bump = 1; opts.length < 4 && bump < 40; bump++) {
    const delta = Math.ceil(bump / 2) * (bump % 2 ? 1 : -1);
    const f =
      typeof answer === "number"
        ? fmt(answer + delta)
        : fmt(answer).replace(/(\d+)(?!.*\d)/, (m) => String(Math.max(0, Number(m) + delta)));
    if (!seen.has(f)) {
      seen.add(f);
      opts.push(f);
    }
  }
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return { q: question, choices: opts, a: opts.indexOf(fmt(answer)), exp: explanation, generated: true };
}

export const generators = {
  "unit-rate": (r) => {
    const items = pick(r, [["pencils", "pack"], ["songs", "album"], ["miles", "hour"], ["pages", "day"]]);
    const rate = int(r, 3, 15);
    const n = int(r, 3, 9);
    const total = rate * n;
    const cost = round(int(r, 120, 900) / 100);
    if (r() < 0.5) {
      return mc(r, `There are ${total} ${items[0]} in ${n} ${items[1]}s. How many ${items[0]} are there per ${items[1]}?`, rate, [total - n, n, rate + 1, total * n], `Unit rate = total ÷ number of units = ${total} ÷ ${n} = ${rate} ${items[0]} per ${items[1]}.`);
    }
    const qty = int(r, 2, 6);
    return mc(r, `${qty} notebooks cost ${money(cost * qty)}. At the same price, how much do ${qty + 3} notebooks cost?`, round(cost * (qty + 3)), [round(cost * qty + 3), round(cost * 3), round(cost * (qty + 2))], `One notebook costs ${money(cost * qty)} ÷ ${qty} = ${money(cost)}. Then ${qty + 3} × ${money(cost)} = ${money(cost * (qty + 3))}.`, money);
  },

  ratio: (r) => {
    const a = int(r, 2, 7);
    const b = int(r, 2, 9);
    if (a === b) return generators.ratio(r);
    const k = int(r, 3, 12);
    const total = (a + b) * k;
    return mc(r, `The ratio of boys to girls in a club is ${a}:${b}. There are ${total} students in all. How many girls are there?`, b * k, [a * k, total - b, b * (k + 1), Math.round(total / b)], `There are ${a} + ${b} = ${a + b} parts. Each part is ${total} ÷ ${a + b} = ${k}. Girls = ${b} × ${k} = ${b * k}.`);
  },

  "percent-of": (r) => {
    const p = pick(r, [5, 10, 15, 20, 25, 30, 35, 40, 45, 60, 75, 80, 120, 150]);
    const n = int(r, 2, 40) * 20;
    const ans = (p * n) / 100;
    return mc(r, `What is ${p}% of ${n}?`, ans, [n / p, ans * 10, n - ans, ans / 10], `${p}% = ${p / 100}. Multiply: ${p / 100} × ${n} = ${ans}.`, (x) => String(round(x)));
  },

  "percent-change": (r) => {
    const price = int(r, 4, 40) * 5;
    const p = pick(r, [10, 15, 20, 25, 30, 40]);
    const up = r() < 0.5;
    const ans = up ? price * (1 + p / 100) : price * (1 - p / 100);
    const word = up ? `increases by ${p}%` : `is discounted ${p}%`;
    return mc(r, `A jacket costs ${money(price)}. Its price ${word}. What is the new price?`, ans, [price * (p / 100), up ? price * (1 - p / 100) : price * (1 + p / 100), price + (up ? p : -p)], `${p}% of ${money(price)} is ${money(price * p / 100)}. ${up ? "Add" : "Subtract"} it: ${money(ans)}. Shortcut: multiply by ${up ? 1 + p / 100 : 1 - p / 100}.`, money);
  },

  "fraction-ops": (r) => {
    const a = int(r, 1, 7), b = int(r, 2, 9), c = int(r, 1, 7), d = int(r, 2, 9);
    const op = pick(r, ["+", "÷", "×"]);
    let n, den, exp;
    if (op === "+") {
      n = a * d + c * b;
      den = b * d;
      exp = `Common denominator ${b * d}: ${a * d}/${b * d} + ${c * b}/${b * d} = ${n}/${den} = ${frac(n, den)}.`;
    } else if (op === "×") {
      n = a * c;
      den = b * d;
      exp = `Multiply straight across: (${a}×${c})/(${b}×${d}) = ${n}/${den} = ${frac(n, den)}.`;
    } else {
      n = a * d;
      den = b * c;
      exp = `Keep, change, flip: ${a}/${b} × ${d}/${c} = ${n}/${den} = ${frac(n, den)}.`;
    }
    const wrongs = [frac(a + c, b + d), frac(a * c, b * d) === frac(n, den) ? frac(a * d + c * b, b * d) : frac(a * c, b * d), frac(b * c, a * d), frac(n + 1, den)];
    return mc(r, `Compute: ${a}/${b} ${op} ${c}/${d}`, frac(n, den), wrongs, exp);
  },

  integers: (r) => {
    const a = nz(r, -20, 20), b = nz(r, -15, 15);
    const op = pick(r, ["+", "−", "×", "÷"]);
    let ans, q, exp;
    if (op === "÷") {
      const prod = a * b;
      ans = a;
      q = `(${neg(prod)}) ÷ (${neg(b)})`;
      exp = `Same signs → positive, different signs → negative. ${neg(prod)} ÷ ${neg(b)} = ${neg(a)}.`;
    } else if (op === "×") {
      ans = a * b;
      q = `(${neg(a)}) × (${neg(b)})`;
      exp = `${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(ans)}; the signs are ${a * b > 0 ? "the same, so positive" : "different, so negative"}.`;
    } else if (op === "+") {
      ans = a + b;
      q = `(${neg(a)}) + (${neg(b)})`;
      exp = `Adding integers: ${neg(a)} + ${neg(b)} = ${neg(ans)}.`;
    } else {
      ans = a - b;
      q = `(${neg(a)}) − (${neg(b)})`;
      exp = `Subtracting is adding the opposite: ${neg(a)} + ${neg(-b)} = ${neg(ans)}.`;
    }
    return mc(r, `Evaluate: ${q}`, ans, [-ans, op === "−" ? a + b : a - b, ans + (ans > 0 ? -2 : 2)], exp, neg);
  },

  "order-ops": (r) => {
    const a = int(r, 2, 9), b = int(r, 2, 6), c = int(r, 2, 5), d = int(r, 1, 9);
    const ans = a + b * c ** 2 - d;
    return mc(r, `Evaluate: ${a} + ${b} × ${c}² − ${d}`, ans, [(a + b) * c ** 2 - d, a + (b * c) ** 2 - d, a + b * c * 2 - d], `Exponents first: ${c}² = ${c * c}. Then multiply: ${b} × ${c * c} = ${b * c * c}. Then left to right: ${a} + ${b * c * c} − ${d} = ${ans}.`);
  },

  "one-step": (r) => {
    const x = nz(r, -12, 15), k = nz(r, 2, 9);
    if (r() < 0.5) {
      const b = int(r, 3, 30);
      return mc(r, `Solve for x: x + ${b} = ${x + b}`, x, [x + 2 * b, -x, x + b], `Subtract ${b} from both sides: x = ${x + b} − ${b} = ${x}.`, neg);
    }
    return mc(r, `Solve for x: ${k}x = ${k * x}`, x, [k * x - k, k * k * x, -x], `Divide both sides by ${k}: x = ${k * x} ÷ ${k} = ${x}.`, neg);
  },

  "two-step": (r) => {
    const x = nz(r, -10, 12), a = nz(r, -8, 9), b = nz(r, -20, 20);
    if (a === 1 || a === -1) return generators["two-step"](r);
    const c = a * x + b;
    return mc(r, `Solve for x: ${term(a)} ${sgn(b)} = ${neg(c)}`, x, [(c + b) / a, -x, (c - b) * a, x + 1], `Undo the ${b < 0 ? "subtraction" : "addition"}: ${term(a)} = ${neg(c)} ${sgn(-b)} = ${neg(c - b)}. Divide by ${neg(a)}: x = ${neg(x)}.`, (v) => (Number.isInteger(v) ? neg(v) : frac(Math.round(v * 100), 100)));
  },

  "multi-step": (r) => {
    // a(x + b) = cx + d with integer solution
    const x = nz(r, -9, 9), a = int(r, 2, 6), b = nz(r, -7, 7);
    let c = int(r, 1, 9);
    if (c === a) c++;
    const d = a * (x + b) - c * x;
    return mc(r, `Solve: ${a}(x ${sgn(b)}) = ${c === 1 ? "" : c}x ${sgn(d)}`, x, [-x, (d - b) / (a - c), x + b, (d - a * b) / (a + c)], `Distribute: ${a}x ${sgn(a * b)} = ${c === 1 ? "" : c}x ${sgn(d)}. Subtract ${c}x: ${a - c}x ${sgn(a * b)} = ${neg(d)}. So ${a - c}x = ${neg(d - a * b)} and x = ${neg(x)}.`, (v) => (Number.isInteger(v) ? neg(v) : String(round(v))));
  },

  inequality: (r) => {
    const x = nz(r, -8, 10), a = nz(r, -6, 6), b = int(r, -12, 12);
    if (Math.abs(a) === 1) return generators.inequality(r);
    const c = a * x + b;
    const sym = pick(r, ["<", ">", "≤", "≥"]);
    const flip = { "<": ">", ">": "<", "≤": "≥", "≥": "≤" };
    const final = a < 0 ? flip[sym] : sym;
    return mc(r, `Solve: ${term(a)} ${sgn(b)} ${sym} ${neg(c)}`, `x ${final} ${neg(x)}`, [`x ${a < 0 ? sym : flip[sym]} ${neg(x)}`, `x ${final} ${neg(-x)}`, `x ${final} ${neg(x + 1)}`], `Subtract ${b}: ${term(a)} ${sym} ${neg(c - b)}. Divide by ${neg(a)}${a < 0 ? " — dividing by a negative FLIPS the sign" : ""}: x ${final} ${neg(x)}.`);
  },

  "like-terms": (r) => {
    const a = nz(r, -6, 8), b = nz(r, -9, 9), c = nz(r, -6, 6), d = nz(r, -9, 9), k = int(r, 2, 5);
    const xs = k * a + c, cs = k * b + d;
    const fmt = (p, q) => `${p === 0 ? "" : term(p)}${p === 0 ? neg(q) : q === 0 ? "" : ` ${sgn(q)}`}`;
    return mc(r, `Simplify: ${k}(${term(a)} ${sgn(b)}) ${c < 0 ? "−" : "+"} ${Math.abs(c) === 1 ? "" : Math.abs(c)}x ${sgn(d)}`, fmt(xs, cs), [fmt(a + c, b + d), fmt(k * a + c, b + d), fmt(xs, cs + 1)], `Distribute: ${term(k * a)} ${sgn(k * b)}. Combine x-terms: ${k * a} + ${neg(c)} = ${xs}. Combine constants: ${k * b} + ${neg(d)} = ${cs}.`);
  },

  area: (r) => {
    const kind = pick(r, ["rect", "tri", "trap"]);
    const a = int(r, 3, 15), b = int(r, 3, 14), h = int(r, 2, 12) * 2;
    if (kind === "rect") return mc(r, `A rectangle is ${a} cm by ${b} cm. What is its area?`, a * b, [2 * (a + b), a + b, a * b * 2], `Area = length × width = ${a} × ${b} = ${a * b} cm².`, (x) => `${x} cm²`);
    if (kind === "tri") return mc(r, `A triangle has base ${a} in and height ${h} in. What is its area?`, (a * h) / 2, [a * h, a + h, (a * h) / 4], `Area = ½ × base × height = ½ × ${a} × ${h} = ${(a * h) / 2} in².`, (x) => `${x} in²`);
    return mc(r, `A trapezoid has bases ${a} m and ${b} m and height ${h} m. What is its area?`, ((a + b) * h) / 2, [(a + b) * h, a * b * h / 2, (a + b + h)], `Area = ½(b₁ + b₂)h = ½(${a} + ${b})(${h}) = ${((a + b) * h) / 2} m².`, (x) => `${x} m²`);
  },

  circle: (r) => {
    const rad = int(r, 2, 12);
    if (r() < 0.5) return mc(r, `A circle has radius ${rad}. What is its area? (Leave in terms of π.)`, `${rad * rad}π`, [`${2 * rad}π`, `${4 * rad * rad}π`, `${rad}π`], `Area = πr² = π(${rad})² = ${rad * rad}π.`);
    return mc(r, `A circle has diameter ${2 * rad}. What is its circumference? (Leave in terms of π.)`, `${2 * rad}π`, [`${rad}π`, `${rad * rad}π`, `${4 * rad * rad}π`], `Circumference = πd = π(${2 * rad}) = ${2 * rad}π.`);
  },

  angles: (r) => {
    const kind = pick(r, ["supp", "comp", "tri", "vert"]);
    const a = int(r, 15, 80);
    if (kind === "supp") return mc(r, `Two angles are supplementary. One measures ${a + 40}°. What is the other?`, 140 - a, [50 - a, a + 40, 180 - a], `Supplementary angles add to 180°: 180 − ${a + 40} = ${140 - a}°.`, (x) => `${x}°`);
    if (kind === "comp") return mc(r, `Two angles are complementary. One measures ${a}°. What is the other?`, 90 - a, [180 - a, a, 90 + a], `Complementary angles add to 90°: 90 − ${a} = ${90 - a}°.`, (x) => `${x}°`);
    if (kind === "vert") return mc(r, `Two lines cross. One angle is ${a + 30}°. What is the angle vertical to it?`, a + 30, [150 - a, 90 - a, 180 + a], `Vertical angles are equal, so it's also ${a + 30}°.`, (x) => `${x}°`);
    const b = int(r, 20, 80);
    return mc(r, `A triangle has angles ${a}° and ${b}°. What is the third angle?`, 180 - a - b, [360 - a - b, 90 - a, a + b], `Triangle angles add to 180°: 180 − ${a} − ${b} = ${180 - a - b}°.`, (x) => `${x}°`);
  },

  proportional: (r) => {
    const k = int(r, 2, 12), x1 = int(r, 2, 9), x2 = int(r, 10, 20);
    return mc(r, `y is proportional to x. When x = ${x1}, y = ${k * x1}. What is y when x = ${x2}?`, k * x2, [k * x1 + (x2 - x1), x2 + k, k * x2 + k], `Constant of proportionality k = y/x = ${k * x1}/${x1} = ${k}. So y = ${k} × ${x2} = ${k * x2}.`);
  },

  probability: (r) => {
    const red = int(r, 2, 9), blue = int(r, 2, 9), green = int(r, 1, 6);
    const total = red + blue + green;
    if (r() < 0.6) return mc(r, `A bag has ${red} red, ${blue} blue and ${green} green marbles. What's the probability of picking blue?`, frac(blue, total), [frac(blue, red + green), frac(1, 3), frac(red, total)], `P(blue) = blue ÷ total = ${blue}/${total} = ${frac(blue, total)}.`);
    return mc(r, `A bag has ${red} red and ${blue} blue marbles. You pick one, put it back, and pick again. What is P(red, then red)?`, frac(red * red, (red + blue) ** 2), [frac(red * (red - 1), (red + blue) * (red + blue - 1)), frac(2 * red, red + blue), frac(red, red + blue)], `Independent events multiply: (${red}/${red + blue}) × (${red}/${red + blue}) = ${frac(red * red, (red + blue) ** 2)}.`);
  },

  "mean-median": (r) => {
    const n = pick(r, [5, 6, 7]);
    const data = Array.from({ length: n }, () => int(r, 1, 30)).sort((a, b) => a - b);
    const sum = data.reduce((a, b) => a + b, 0);
    if (r() < 0.5) {
      const median = n % 2 ? data[(n - 1) / 2] : (data[n / 2 - 1] + data[n / 2]) / 2;
      return mc(r, `Find the median: ${[...data].sort(() => r() - 0.5).join(", ")}`, median, [round(sum / n, 1), data[Math.floor(n / 2)] + 1, data[n - 1] - data[0]], `Order the data: ${data.join(", ")}. ${n % 2 ? "The middle value" : "The average of the two middle values"} is ${median}.`, (x) => String(round(x, 1)));
    }
    const fix = (n - (sum % n)) % n;
    data[n - 1] += fix;
    const s2 = sum + fix;
    return mc(r, `Find the mean: ${data.join(", ")}`, s2 / n, [data[Math.floor(n / 2)], s2 / (n - 1), data[n - 1] - data[0]], `Add them: ${s2}. Divide by ${n}: ${s2} ÷ ${n} = ${s2 / n}.`, (x) => String(round(x, 1)));
  },

  exponents: (r) => {
    const a = int(r, 2, 9), b = int(r, 2, 9), base = pick(r, ["x", "y", "a", "2"]);
    const kind = pick(r, ["mul", "div", "pow"]);
    const ex = (n) => `${base}${sup(n)}`;
    if (kind === "mul") return mc(r, `Simplify: ${ex(a)} · ${ex(b)}`, ex(a + b), [ex(a * b), ex(Math.abs(a - b)), ex(a + b + 1), ex(a * b + 1), ex(a + b - 1)], `Same base, multiplying → ADD exponents: ${a} + ${b} = ${a + b}.`);
    if (kind === "div") return mc(r, `Simplify: ${ex(a + b)} ÷ ${ex(b)}`, ex(a), [ex(a + 2 * b), ex(b), ex(a + 1), ex(a - 1), ex((a + b) * b)], `Same base, dividing → SUBTRACT exponents: ${a + b} − ${b} = ${a}.`);
    return mc(r, `Simplify: (${ex(a)})${sup(b)}`, ex(a * b), [ex(a + b), ex(b), ex(a), ex(a * b + 1), ex(a * b - 1)], `Power to a power → MULTIPLY exponents: ${a} × ${b} = ${a * b}.`);
  },

  "sci-notation": (r) => {
    const m1 = int(r, 11, 95) / 10, e1 = int(r, 2, 8), m2 = int(r, 2, 4), e2 = int(r, 1, 5);
    const pm = round(m1 * m2, 2);
    const norm = pm >= 10 ? [round(pm / 10, 3), e1 + e2 + 1] : [pm, e1 + e2];
    const f = ([m, e]) => `${m} × 10${sup(e)}`;
    return mc(r, `Multiply: (${m1} × 10${sup(e1)}) × (${m2} × 10${sup(e2)}). Give your answer in scientific notation.`, f(norm), [f([pm, e1 * e2]), f([round(m1 + m2, 2), e1 + e2]), f([norm[0], norm[1] - 1])], `Multiply the numbers: ${m1} × ${m2} = ${pm}. Add the exponents: ${e1} + ${e2} = ${e1 + e2}.${pm >= 10 ? ` ${pm} isn't between 1 and 10, so rewrite as ${norm[0]} × 10${sup(norm[1])}.` : ""}`);
  },

  slope: (r) => {
    const x1 = int(r, -6, 6), y1 = int(r, -6, 6);
    let dx = nz(r, -6, 6);
    const dy = nz(r, -9, 9);
    const x2 = x1 + dx, y2 = y1 + dy;
    return mc(r, `Find the slope of the line through (${x1}, ${y1}) and (${x2}, ${y2}).`, frac(dy, dx), [frac(dx, dy), frac(-dy, dx), frac(y2 + y1, x2 + x1 || 1)], `Slope = (y₂ − y₁)/(x₂ − x₁) = (${y2} − ${neg(y1)})/(${x2} − ${neg(x1)}) = ${dy}/${dx} = ${frac(dy, dx)}.`);
  },

  "line-equation": (r) => {
    const m = nz(r, -5, 5), b = int(r, -9, 9), x = int(r, -4, 4);
    const y = m * x + b;
    const line = (mm, bb) => `y = ${term(mm)}${bb === 0 ? "" : ` ${sgn(bb)}`}`;
    if (r() < 0.5) return mc(r, `A line has slope ${neg(m)} and passes through (${x}, ${y}). What is its equation?`, line(m, b), [line(m, y), line(-m, b + 2 * m * x), line(m, b + 1), line(m, b - 1), line(-m, b)], `Use y = mx + b: ${y} = ${neg(m)}(${x}) + b → b = ${y} − ${neg(m * x)} = ${b}.`);
    return mc(r, `What is the y-intercept of y = ${term(m)} ${sgn(b)}?`, `(0, ${b})`, [`(${b}, 0)`, `(0, ${m})`, `(0, ${-b})`], `In y = mx + b, b is the y-intercept. Here b = ${b}, so the point is (0, ${b}).`);
  },

  systems: (r) => {
    const x = int(r, -6, 6), y = int(r, -6, 6);
    const a = nz(r, -4, 4), b = nz(r, -4, 4), c = nz(r, -4, 4), d = nz(r, -4, 4);
    if (a * d - b * c === 0) return generators.systems(r);
    const e = a * x + b * y, f = c * x + d * y;
    const eq = (p, q, s) => `${term(p)} ${q < 0 ? "−" : "+"} ${Math.abs(q) === 1 ? "" : Math.abs(q)}y = ${neg(s)}`;
    return mc(r, `Solve the system:\n${eq(a, b, e)}\n${eq(c, d, f)}`, `(${x}, ${y})`, [`(${y}, ${x})`, `(${-x}, ${y})`, `(${x}, ${-y})`, `(${x + 1}, ${y - 1})`], `Use elimination or substitution. Check (${x}, ${y}): ${a}(${x}) + ${b}(${y}) = ${e} ✓ and ${c}(${x}) + ${d}(${y}) = ${f} ✓.`);
  },

  pythagorean: (r) => {
    const [a, b, c] = pick(r, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15], [20, 21, 29]]);
    const k = pick(r, [1, 1, 2, 3]);
    if (r() < 0.5) return mc(r, `A right triangle has legs ${a * k} and ${b * k}. How long is the hypotenuse?`, c * k, [(a + b) * k, (a * k) ** 2 + (b * k) ** 2, c * k + 1], `a² + b² = c²: ${(a * k) ** 2} + ${(b * k) ** 2} = ${(c * k) ** 2}, so c = √${(c * k) ** 2} = ${c * k}.`);
    return mc(r, `A right triangle has hypotenuse ${c * k} and one leg ${a * k}. Find the other leg.`, b * k, [(c - a) * k, c * k + a * k, b * k + 2], `b² = c² − a² = ${(c * k) ** 2} − ${(a * k) ** 2} = ${(b * k) ** 2}, so b = ${b * k}.`);
  },

  volume: (r) => {
    const rad = int(r, 2, 8), h = int(r, 3, 12) * 3;
    const kind = pick(r, ["cyl", "cone", "sphere", "prism"]);
    if (kind === "cyl") return mc(r, `A cylinder has radius ${rad} and height ${h}. What is its volume? (in terms of π)`, `${rad * rad * h}π`, [`${2 * rad * h}π`, `${(rad * rad * h) / 3}π`, `${rad * h}π`], `V = πr²h = π(${rad * rad})(${h}) = ${rad * rad * h}π.`);
    if (kind === "cone") return mc(r, `A cone has radius ${rad} and height ${h}. What is its volume? (in terms of π)`, `${(rad * rad * h) / 3}π`, [`${rad * rad * h}π`, `${(2 * rad * h) / 3}π`, `${(rad * h) / 3}π`], `V = ⅓πr²h = ⅓π(${rad * rad})(${h}) = ${(rad * rad * h) / 3}π.`);
    if (kind === "sphere") {
      const rr = pick(r, [3, 6, 9]);
      return mc(r, `A sphere has radius ${rr}. What is its volume? (in terms of π)`, `${(4 * rr ** 3) / 3}π`, [`${4 * rr * rr}π`, `${rr ** 3}π`, `${(4 * rr * rr) / 3}π`], `V = (4/3)πr³ = (4/3)π(${rr ** 3}) = ${(4 * rr ** 3) / 3}π.`);
    }
    const l = int(r, 2, 10), w = int(r, 2, 9);
    return mc(r, `A rectangular prism is ${l} × ${w} × ${rad}. What is its volume?`, l * w * rad, [2 * (l * w + l * rad + w * rad), l + w + rad, l * w * rad * 2], `V = l × w × h = ${l} × ${w} × ${rad} = ${l * w * rad} cubic units.`);
  },

  "function-eval": (r) => {
    const a = nz(r, -4, 4), b = int(r, -6, 6), c = int(r, -9, 9), x = nz(r, -4, 4);
    const val = a * x * x + b * x + c;
    return mc(r, `If f(x) = ${term(a, "x²")}${b ? ` ${sgn(b)}x` : ""}${c ? ` ${sgn(c)}` : ""}, what is f(${x})?`, val, [-a * x * x + b * x + c, a * 2 * x + b * x + c, a * x * x - b * x + c], `Substitute x = ${x}: ${a}(${x})² + ${b}(${x}) + ${c} = ${a * x * x} + ${b * x} + ${c} = ${val}. Remember (${x})² = ${x * x}.`, neg);
  },

  factoring: (r) => {
    const p = nz(r, -9, 9), q = nz(r, -9, 9);
    const b = p + q, c = p * q;
    const f = (u, v) => `(x ${sgn(u)})(x ${sgn(v)})`;
    return mc(r, `Factor: x² ${b === 0 ? "" : `${sgn(b)}x `}${sgn(c)}`.replace("+ 1x", "+ x").replace("− 1x", "− x"), f(p, q), [f(-p, -q), f(p, -q), f(b, c === b ? c + 1 : 1)], `Find two numbers that multiply to ${c} and add to ${b}: ${p} and ${q}. So it factors as ${f(p, q)}.`);
  },

  "quadratic-roots": (r) => {
    const p = nz(r, -8, 8), q = nz(r, -8, 8);
    if (p === q) return generators["quadratic-roots"](r);
    const b = -(p + q), c = p * q;
    const s = (u, v) => `x = ${Math.min(u, v)} and x = ${Math.max(u, v)}`;
    return mc(r, `Solve: x² ${b === 0 ? "" : `${sgn(b)}x `}${sgn(c)} = 0`.replace("+ 1x", "+ x").replace("− 1x", "− x"), s(p, q), [s(-p, -q), s(p, -q), s(c, b)], `Factor: (x ${sgn(-p)})(x ${sgn(-q)}) = 0. Set each factor to zero: x = ${p} or x = ${q}.`);
  },

  exponential: (r) => {
    const start = int(r, 2, 20) * 50, rate = pick(r, [2, 3, 4, 5, 6, 8, 10]), t = int(r, 2, 4);
    const grow = r() < 0.6;
    const f = grow ? 1 + rate / 100 : 1 - rate / 100;
    const ans = round(start * f ** t);
    return mc(r, `A town's population is ${start} and ${grow ? "grows" : "shrinks"} ${rate}% per year. Which expression gives the population after ${t} years?`, `${start}(${f})${sup(t)}`, [`${start}(${grow ? 1 - rate / 100 : 1 + rate / 100})${sup(t)}`, `${start}(${rate / 100})${sup(t)}`, `${start} ${grow ? "+" : "−"} ${rate}(${t})`], `Exponential model: a(1 ${grow ? "+" : "−"} r)ᵗ = ${start}(${f})${sup(t)} ≈ ${ans}.`);
  },

  "distance-midpoint": (r) => {
    const [a, b, c] = pick(r, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10]]);
    const x1 = int(r, -5, 5), y1 = int(r, -5, 5);
    const sx = pick(r, [1, -1]), sy = pick(r, [1, -1]);
    const x2 = x1 + sx * a, y2 = y1 + sy * b;
    if (r() < 0.5) return mc(r, `Find the distance between (${x1}, ${y1}) and (${x2}, ${y2}).`, c, [a + b, c * c, Math.abs(x2 - x1)], `d = √((x₂−x₁)² + (y₂−y₁)²) = √(${a * a} + ${b * b}) = √${c * c} = ${c}.`);
    return mc(r, `Find the midpoint of (${x1}, ${y1}) and (${x2}, ${y2}).`, `(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`, [`(${x2 - x1}, ${y2 - y1})`, `(${x1 + x2}, ${y1 + y2})`, `(${(x2 - x1) / 2}, ${(y2 - y1) / 2})`], `Average the coordinates: ((${x1} + ${x2})/2, (${y1} + ${y2})/2) = (${(x1 + x2) / 2}, ${(y1 + y2) / 2}).`);
  },

  "trig-ratio": (r) => {
    const [a, b, c] = pick(r, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]);
    const fn = pick(r, ["sin", "cos", "tan"]);
    const ans = { sin: `${a}/${c}`, cos: `${b}/${c}`, tan: `${a}/${b}` }[fn];
    return mc(r, `In right triangle ABC, angle C = 90°. The side opposite angle A is ${a}, the side adjacent to A is ${b}, and the hypotenuse is ${c}. What is ${fn} A?`, ans, [`${a}/${c}`, `${b}/${c}`, `${a}/${b}`, `${b}/${a}`, `${c}/${a}`].filter((x) => x !== ans), `SOH-CAH-TOA: sin = opp/hyp, cos = adj/hyp, tan = opp/adj. So ${fn} A = ${ans}.`);
  },

  sequences: (r) => {
    if (r() < 0.55) {
      const a1 = int(r, -10, 20), d = nz(r, -7, 9), n = int(r, 8, 30);
      const terms = [0, 1, 2, 3].map((i) => a1 + i * d).join(", ");
      return mc(r, `What is the ${n}th term of the arithmetic sequence ${terms}, …?`, a1 + (n - 1) * d, [a1 + n * d, a1 * n, a1 + (n - 2) * d], `aₙ = a₁ + (n − 1)d = ${a1} + (${n} − 1)(${d}) = ${a1 + (n - 1) * d}.`, neg);
    }
    const a1 = int(r, 1, 5), ratio = pick(r, [2, 3, -2]), n = int(r, 5, 7);
    const terms = [0, 1, 2, 3].map((i) => a1 * ratio ** i).join(", ");
    return mc(r, `What is the ${n}th term of the geometric sequence ${terms}, …?`, a1 * ratio ** (n - 1), [a1 * ratio ** n, a1 * ratio * (n - 1), a1 + ratio * (n - 1)], `aₙ = a₁ · r^(n−1) = ${a1} · (${ratio})${sup(n - 1)} = ${a1 * ratio ** (n - 1)}.`, neg);
  },

  logarithms: (r) => {
    const b = pick(r, [2, 3, 5, 10]), e = int(r, 2, b === 2 ? 6 : 4);
    if (r() < 0.5) return mc(r, `Evaluate: log${b === 10 ? "" : String(b).replace(/\d/g, (c) => "₀₁₂₃₄₅₆₇₈₉"[c])} ${b ** e}`, e, [b ** e / b, e + 1, b * e], `log_b(y) asks "b to what power is y?" ${b}${sup(e)} = ${b ** e}, so the answer is ${e}.`);
    return mc(r, `Solve for x: ${b}ˣ = ${b ** e}`, e, [b ** e / b, e - 1, b ** e - b], `Rewrite ${b ** e} as ${b}${sup(e)}. Same base, so x = ${e}. (Or x = log${b}(${b ** e}).)`);
  },

  complex: (r) => {
    const a = nz(r, -6, 6), b = nz(r, -6, 6), c = nz(r, -6, 6), d = nz(r, -6, 6);
    const re = a * c - b * d, im = a * d + b * c;
    const cx = (p, q) => `${neg(p)} ${q < 0 ? "−" : "+"} ${Math.abs(q) === 1 ? "" : Math.abs(q)}i`;
    return mc(r, `Multiply: (${cx(a, b)})(${cx(c, d)})`, cx(re, im), [cx(a * c + b * d, im), cx(a * c, b * d), cx(re, a * d - b * c)], `FOIL: ${a * c} ${sgn(a * d)}i ${sgn(b * c)}i ${sgn(b * d)}i². Since i² = −1: ${a * c} ${sgn(-b * d)} = ${re}, and ${a * d + b * c}i.`);
  },

  "gcf-lcm": (r) => {
    const g = int(r, 2, 12), a = g * int(r, 2, 7), b = g * int(r, 2, 9);
    if (a === b) return generators["gcf-lcm"](r);
    if (r() < 0.5) return mc(r, `What is the greatest common factor of ${a} and ${b}?`, gcd(a, b), [lcm(a, b), Math.min(a, b), gcd(a, b) * 2], `List factors or use prime factorization. The largest number dividing both ${a} and ${b} is ${gcd(a, b)}.`);
    return mc(r, `What is the least common multiple of ${a} and ${b}?`, lcm(a, b), [a * b, gcd(a, b), lcm(a, b) * 2], `LCM = (a × b) ÷ GCF = (${a} × ${b}) ÷ ${gcd(a, b)} = ${lcm(a, b)}.`);
  },

  "rate-time": (r) => {
    const s = int(r, 3, 12) * 5, t = int(r, 2, 6);
    const kind = pick(r, ["distance", "time", "avg"]);
    if (kind === "distance") return mc(r, `A train travels at ${s} mph for ${t} hours. How far does it go?`, s * t, [s + t, s / t, s * (t + 1)], `distance = rate × time = ${s} × ${t} = ${s * t} miles.`, (x) => `${round(x)} mi`);
    if (kind === "time") return mc(r, `A cyclist rides ${s * t} miles at ${s} mph. How many hours does it take?`, t, [s * t * s, t + 1, s - t], `time = distance ÷ rate = ${s * t} ÷ ${s} = ${t} hours.`, (x) => `${x} hr`);
    const s2 = s + 10 * int(r, 1, 3);
    const avg = (2 * s * s2) / (s + s2);
    return mc(r, `Maya drives to the city at ${s} mph and back the same route at ${s2} mph. What is her average speed for the round trip?`, avg, [(s + s2) / 2, s2 - s, (s * s2) / 2 / 10], `Average speed = total distance ÷ total time. For equal distances it's 2ab/(a+b) = 2(${s})(${s2})/(${s + s2}) ≈ ${round(avg)} mph — NOT the simple average ${(s + s2) / 2}.`, (x) => `${round(x, 1)} mph`);
  },

  "consecutive-avg": (r) => {
    if (r() < 0.5) {
      const n = pick(r, [3, 4, 5]), first = int(r, 5, 40);
      const sum = Array.from({ length: n }, (_, i) => first + i).reduce((a, b) => a + b, 0);
      return mc(r, `The sum of ${n} consecutive integers is ${sum}. What is the largest?`, first + n - 1, [first, first + n, Math.round(sum / n)], `The average is ${sum} ÷ ${n} = ${sum / n}, which is the middle. The integers are ${Array.from({ length: n }, (_, i) => first + i).join(", ")}, so the largest is ${first + n - 1}.`);
    }
    const n = int(r, 4, 6), avg = int(r, 70, 90), next = int(r, 85, 100);
    const newAvg = (n * avg + next) / (n + 1);
    return mc(r, `Jordan's average on ${n} tests is ${avg}. After one more test scoring ${next}, what is the new average?`, newAvg, [(avg + next) / 2, avg + 1, (n * avg + next) / n], `Total before: ${n} × ${avg} = ${n * avg}. New total: ${n * avg + next}. Divide by ${n + 1}: ${round(newAvg, 2)}.`, (x) => String(round(x, 1)));
  },

  "number-theory": (r) => {
    const kind = pick(r, ["remainder", "primes", "digits"]);
    if (kind === "remainder") {
      const d = int(r, 3, 9), q = int(r, 5, 40), rem = int(r, 1, d - 1);
      const n = d * q + rem;
      return mc(r, `What is the remainder when ${n} is divided by ${d}?`, rem, [q, d - rem, rem + 1], `${d} × ${q} = ${d * q}, and ${n} − ${d * q} = ${rem}.`);
    }
    if (kind === "primes") {
      const lo = pick(r, [10, 20, 30, 40, 50]);
      const primes = [];
      for (let k = lo; k <= lo + 10; k++) if (k > 1 && [...Array(Math.floor(Math.sqrt(k)) - 1)].every((_, i) => k % (i + 2) !== 0)) primes.push(k);
      return mc(r, `How many prime numbers are between ${lo} and ${lo + 10}, inclusive?`, primes.length, [primes.length + 1, primes.length - 1, 5], `The primes are ${primes.join(", ")}. That's ${primes.length}.`);
    }
    const n = int(r, 2, 9);
    return mc(r, `What is the ones digit of 7${sup(n * 4 + (n % 4))}?`, [1, 7, 9, 3][(n * 4 + (n % 4)) % 4], [7, 9, 3, 1].filter((x) => x !== [1, 7, 9, 3][(n * 4 + (n % 4)) % 4]), `Ones digits of powers of 7 repeat every 4: 7, 9, 3, 1. The exponent ${n * 4 + (n % 4)} has remainder ${(n * 4 + (n % 4)) % 4} when divided by 4, so the ones digit is ${[1, 7, 9, 3][(n * 4 + (n % 4)) % 4]}.`);
  },

  interest: (r) => {
    const P = int(r, 2, 20) * 100, rate = pick(r, [2, 3, 4, 5, 6]), t = int(r, 2, 5);
    return mc(r, `You deposit ${money(P)} at ${rate}% simple interest per year. How much interest do you earn in ${t} years?`, (P * rate * t) / 100, [(P * rate) / 100, P * (1 + rate / 100) ** t - P, (P * rate * t) / 10], `I = Prt = ${P} × ${rate / 100} × ${t} = ${money((P * rate * t) / 100)}.`, money);
  },

  derivative: (r) => {
    const a = nz(r, -6, 7), n = int(r, 2, 5), b = nz(r, -9, 9);
    const f = `${term(a, `x${sup(n)}`)} ${sgn(b)}x`;
    const d = (c, e) => `${term(c, e === 1 ? "x" : `x${sup(e)}`)}`;
    return mc(r, `Find f′(x) if f(x) = ${f}`, `${d(a * n, n - 1)} ${sgn(b)}`, [`${d(a, n - 1)} ${sgn(b)}`, `${d(a * n, n)} ${sgn(b)}`, `${d(a * n, n - 1)} ${sgn(b)}x`], `Power rule: d/dx[xⁿ] = n·xⁿ⁻¹. So ${n}·${a}x${sup(n - 1)} = ${a * n}x${sup(n - 1)}, and the derivative of ${b}x is ${b}.`);
  },

  "absolute-value": (r) => {
    const a = nz(r, -15, 15), b = nz(r, -15, 15);
    return mc(r, `Evaluate: |${neg(a)}| − |${neg(b)}|`, Math.abs(a) - Math.abs(b), [a - b, Math.abs(a - b), Math.abs(a) + Math.abs(b)], `Absolute value is distance from 0: |${neg(a)}| = ${Math.abs(a)}, |${neg(b)}| = ${Math.abs(b)}. ${Math.abs(a)} − ${Math.abs(b)} = ${Math.abs(a) - Math.abs(b)}.`, neg);
  },

  radicals: (r) => {
    const out = int(r, 2, 6), inn = pick(r, [2, 3, 5, 6, 7]);
    return mc(r, `Simplify: √${out * out * inn}`, `${out}√${inn}`, [`${inn}√${out}`, `${out * out}√${inn}`, `${out}√${inn * 2}`], `Find the biggest perfect-square factor: ${out * out * inn} = ${out * out} × ${inn}. √${out * out} = ${out}, so √${out * out * inn} = ${out}√${inn}.`);
  },

  "scale-drawing": (r) => {
    const s = int(r, 2, 12), inches = int(r, 2, 9) + pick(r, [0, 0.5]);
    return mc(r, `On a map, 1 inch represents ${s} miles. Two towns are ${inches} inches apart on the map. How far apart are they really?`, s * inches, [s + inches, s / inches, s * inches * 2], `Multiply by the scale: ${inches} × ${s} = ${s * inches} miles.`, (x) => `${round(x, 1)} mi`);
  },
};

export const generatorNames = Object.keys(generators);

/** Make n questions from a list of generator keys, deterministic for a given seed. */
export function generateSet(keys, n, seed = Date.now()) {
  const r = makeRng(seed);
  const list = keys.filter((k) => generators[k]);
  if (!list.length) return [];
  const out = [];
  for (let i = 0; i < n; i++) {
    const key = list[i % list.length];
    try {
      out.push({ ...generators[key](r), gen: key });
    } catch (err) {
      console.warn("generator failed", key, err);
    }
  }
  return out;
}
