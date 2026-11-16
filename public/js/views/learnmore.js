// Learning extras: course paths (a game map per course), AI mini lessons, a study plan to test day,
// formula sheets, and the word of the day.
import { state, save, addXp, mastery, todayKey } from "../store.js";
import { esc, toast, post, aiAvailable } from "../ui.js";
import { icon } from "../icons.js";
import { topics, getTopic, exams, getExam, examTopicIds } from "../content.js";
import { words } from "../data/wordbank.js";
import { hashString } from "../generators.js";
import { speak } from "../fx.js";

// ---------- Learning path ----------
const COURSES = [...new Set(topics.map((t) => t.course))];
export function pathView(root, _p, query) {
  const course = COURSES.includes(query.c) ? query.c : state.profile.pathCourse && COURSES.includes(state.profile.pathCourse) ? state.profile.pathCourse : COURSES[0];
  state.profile.pathCourse = course;
  const list = topics.filter((t) => t.course === course);
  const nextIdx = list.findIndex((t) => (mastery(t.id) ?? 0) < 70);
  root.innerHTML = `
    <a class="back" href="#/learn">${icon("back", 18)} Learn</a>
    <h1 class="page-title">🗺️ Learning path</h1>
    <div class="chip-row">${COURSES.map((c) => `<a class="chip ${c === course ? "on" : ""}" href="#/path?c=${encodeURIComponent(c)}">${esc(c)}</a>`).join("")}</div>
    <div class="path">${list
      .map((t, i) => {
        const m = mastery(t.id);
        const st = m !== null && m >= 70 ? "done" : i === nextIdx ? "next" : m !== null ? "started" : "todo";
        return `<a class="path-node ${st} ${i % 2 ? "r" : "l"}" href="#/topic/${t.id}"><span class="pn-dot">${st === "done" ? "⭐" : st === "next" ? "▶" : i + 1}</span><span class="pn-label"><strong>${esc(t.name)}</strong><small>${m === null ? "Not started" : `${m}% mastery`}</small></span></a>`;
      })
      .join("")}</div>
    <p class="tiny muted center">Reach 70% mastery to earn a ⭐. Tap any stop to study it.</p>`;
  save();
}

// ---------- Mini lessons ----------
export function lessonView(root, { id }) {
  const t = getTopic(id);
  if (!t) return (location.hash = "#/explore");
  const cacheKey = `brainboro:lesson:${id}`;
  const show = (L) => {
    let picked = null;
    root.innerHTML = `
      <a class="back" href="#/topic/${id}">${icon("back", 18)} ${esc(t.name)}</a>
      <article class="lesson">
        <span class="eyebrow">📚 2-minute lesson</span>
        <h1>${esc(t.name)}</h1>
        <p class="lesson-hook">${esc(L.hook)}</p>
        <div class="card"><h3>💡 The big idea</h3><p>${esc(L.big_idea)}</p>${L.steps.length ? `<ol class="lesson-steps">${L.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>` : ""}</div>
        <div class="card"><h3>✍️ Worked example</h3><p><strong>${esc(L.example.problem)}</strong></p>${L.example.solution.map((s) => `<p class="ex-line">${esc(s)}</p>`).join("")}</div>
        <div class="card"><h3>✅ Your turn</h3><p>${esc(L.check.question)}</p><div class="choices">${L.check.choices.map((c, k) => `<button class="choice" data-k="${k}"><span class="letter">${"ABCD"[k]}</span><span>${esc(c)}</span></button>`).join("")}</div><div id="fb"></div></div>
        <div class="card remember"><strong>🧠 Remember:</strong> ${esc(L.remember)}</div>
        <div class="btn-row wrap"><button class="btn ghost small" id="read">🔊 Read aloud</button><a class="btn" href="#/practice/${id}">Practice →</a><a class="btn ghost" href="#/boss/${id}">🐉 Boss battle</a></div>
      </article>`;
    root.querySelector("#read").onclick = () => speak(`${L.hook} ${L.big_idea} ${L.steps.join(". ")}`);
    root.querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => {
      if (picked !== null) return;
      picked = Number(b.dataset.k);
      const ok = picked === L.check.answer_index;
      root.querySelectorAll("[data-k]").forEach((x, i) => {
        x.disabled = true;
        if (i === L.check.answer_index) x.classList.add("right");
        else if (i === picked) x.classList.add("wrong");
      });
      root.querySelector("#fb").innerHTML = `<div class="feedback ${ok ? "ok" : "no"}"><strong>${ok ? "✅ Nailed it! +15 XP" : "Not quite."}</strong><p>${esc(L.check.explanation)}</p></div>`;
      state.stats.lessons = (state.stats.lessons || 0) + 1;
      addXp(ok ? 15 : 5);
      save();
    }));
  };
  // Without AI, build a lesson from the topic's flashcards.
  const offline = () => ({
    hook: t.desc,
    big_idea: t.cards[0]?.[1] || t.desc,
    steps: t.cards.slice(1, 5).map(([a, b]) => `${a}: ${b}`),
    example: t.qs[0] ? { problem: t.qs[0][0], solution: [`Answer: ${t.qs[0][1][t.qs[0][2]]}`, t.qs[0][3]] } : { problem: "Try a practice question next!", solution: [] },
    check: t.qs[1] ? { question: t.qs[1][0], choices: t.qs[1][1], answer_index: t.qs[1][2], explanation: t.qs[1][3] } : { question: "Ready to practice?", choices: ["Yes!"], answer_index: 0, explanation: "Let's go." },
    remember: t.cards.at(-1)?.[1] || "Practice a little every day.",
  });
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
    if (cached) return show(cached);
  } catch {
    /* ignore */
  }
  root.innerHTML = `<div class="empty"><div class="spinner"></div><p>Boro is writing your lesson…</p></div>`;
  (async () => {
    if (!(await aiAvailable())) return show(offline());
    try {
      const L = await (await post("api/lesson", { topic: `${t.name} (${t.course}): ${t.desc}`, grade: state.profile.grade, notes: t.cards.map((c) => c.join(": ")).join("; ").slice(0, 700) })).json();
      try {
        localStorage.setItem(cacheKey, JSON.stringify(L));
      } catch {
        /* full */
      }
      show(L);
    } catch {
      show(offline());
    }
  })();
}

// ---------- Study plan ----------
export function planView(root) {
  const exam = getExam(state.testDay?.exam || state.profile.exam) || exams[0];
  const defDate = state.testDay?.date || todayKey(new Date(Date.now() + 28 * 86400000));
  const draw = (examId = exam.id, date = defDate, mins = 30) => {
    const e = getExam(examId);
    const days = Math.max(1, Math.ceil((new Date(`${date}T09:00`).getTime() - Date.now()) / 86400000));
    const ids = examTopicIds(e);
    // Weakest topics first, then ones never tried.
    const order = [...ids].sort((a, b) => (mastery(a) ?? -1) - (mastery(b) ?? -1));
    const plan = Array.from({ length: Math.min(days, 60) }, (_, i) => {
      const d = new Date(Date.now() + (i + 1) * 86400000);
      const isTest = (i + 1) % 7 === 0 || i === Math.min(days, 60) - 2;
      const t = getTopic(order[i % order.length]);
      return { d, isTest, t, last: i === days - 1 };
    });
    root.innerHTML = `
      <a class="back" href="#/learn">${icon("back", 18)} Learn</a>
      <h1 class="page-title">🗓️ Study plan</h1>
      <div class="card"><div class="grid-2 tight">
        <label class="field"><span>Test</span><select id="ex">${exams.map((x) => `<option value="${x.id}" ${x.id === examId ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>
        <label class="field"><span>Test date</span><input type="date" id="dt" value="${date}" min="${todayKey()}"></label>
      </div><label class="field"><span>Minutes a day</span><select id="mn">${[15, 30, 45, 60].map((m) => `<option ${m === mins ? "selected" : ""}>${m}</option>`).join("")}</select></label></div>
      <p class="lead">${days} days to go. Weakest topics come first, with a practice test every week.</p>
      <div class="list">${plan.map((p) => `<div class="row"><span class="plan-date">${p.d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span><span class="grow"><strong>${p.isTest ? `📝 ${esc(e.name)} practice test` : esc(p.t?.name || "Review")}</strong><small>${p.isTest ? "Timed, like the real thing" : `${mins} min: lesson + practice`}</small></span></div>`).join("")}</div>
      <div class="btn-row"><button class="btn" id="add">📅 Add the next 14 days to my planner</button></div>`;
    root.querySelector("#ex").onchange = (ev) => draw(ev.target.value, root.querySelector("#dt").value, mins);
    root.querySelector("#dt").onchange = (ev) => draw(root.querySelector("#ex").value, ev.target.value, mins);
    root.querySelector("#mn").onchange = (ev) => draw(examId, date, Number(ev.target.value));
    root.querySelector("#add").onclick = () => {
      let n = 0;
      for (const p of plan.slice(0, 14)) {
        const key = `plan:${examId}:${todayKey(p.d)}`;
        if (state.planner.items.some((x) => x.key === key)) continue;
        state.planner.items.push({ id: `plan${Date.now()}${n}`, key, title: p.isTest ? `${e.name} practice test` : `Study: ${p.t?.name || "review"}`, course: e.name, due: new Date(`${todayKey(p.d)}T19:00`).toISOString(), type: p.isTest ? "Test" : "Study", priority: "Medium", points: "", steps: [], notes: "", url: p.isTest ? `#/fulltest/${examId}` : `#/topic/${p.t?.id}`, done: false, source: "plan" });
        n++;
      }
      save();
      toast(n ? `Added ${n} study sessions to your planner` : "Already in your planner", { emoji: "📅" });
    };
  };
  draw();
}

// ---------- Formula sheets ----------
const FORMULAS = [
  ["📐 Geometry", [["Rectangle area", "A = l × w"], ["Triangle area", "A = ½ × b × h"], ["Circle area", "A = πr²"], ["Circumference", "C = 2πr = πd"], ["Pythagorean theorem", "a² + b² = c²"], ["Rectangular prism volume", "V = l × w × h"], ["Cylinder volume", "V = πr²h"], ["Cone volume", "V = ⅓πr²h"], ["Sphere volume", "V = ⁴⁄₃πr³"], ["Angles in a triangle", "add up to 180°"]]],
  ["📈 Algebra", [["Slope", "m = (y₂ − y₁) ÷ (x₂ − x₁)"], ["Slope-intercept form", "y = mx + b"], ["Point-slope form", "y − y₁ = m(x − x₁)"], ["Quadratic formula", "x = (−b ± √(b² − 4ac)) ÷ 2a"], ["Difference of squares", "a² − b² = (a + b)(a − b)"], ["Exponent rules", "aᵐ·aⁿ = aᵐ⁺ⁿ · (aᵐ)ⁿ = aᵐⁿ · a⁰ = 1"], ["Distance", "d = √((x₂−x₁)² + (y₂−y₁)²)"], ["Midpoint", "((x₁+x₂)/2, (y₁+y₂)/2)"]]],
  ["💯 Percents & ratios", [["Percent of a number", "part = percent × whole"], ["Percent change", "(new − old) ÷ old × 100"], ["Simple interest", "I = P × r × t"], ["Unit rate", "total ÷ number of units"], ["Mean", "sum ÷ how many"]]],
  ["📏 Trig", [["SOH CAH TOA", "sin = opp/hyp · cos = adj/hyp · tan = opp/adj"], ["Special right triangles", "45-45-90: x, x, x√2 · 30-60-90: x, x√3, 2x"], ["Unit circle", "sin²θ + cos²θ = 1"]]],
  ["⚡ Physics", [["Speed", "v = d ÷ t"], ["Acceleration", "a = Δv ÷ t"], ["Newton's 2nd law", "F = m × a"], ["Weight", "W = m × g (g ≈ 9.8 m/s²)"], ["Kinetic energy", "KE = ½mv²"], ["Potential energy", "PE = mgh"], ["Work", "W = F × d"], ["Ohm's law", "V = I × R"], ["Wave speed", "v = f × λ"]]],
  ["🧪 Chemistry", [["Density", "D = m ÷ V"], ["Moles", "n = mass ÷ molar mass"], ["Molarity", "M = moles ÷ liters"], ["pH", "pH = −log[H⁺]; 7 is neutral"], ["Ideal gas law", "PV = nRT"]]],
];
export function formulasView(root) {
  const draw = (q = "") => {
    const ql = q.toLowerCase();
    root.querySelector("#fl").innerHTML = FORMULAS.map(([group, list]) => {
      const rows = list.filter(([n, f]) => !ql || `${n} ${f} ${group}`.toLowerCase().includes(ql));
      return rows.length ? `<section class="section"><div class="section-head"><h2>${group}</h2></div><div class="card formula-card">${rows.map(([n, f]) => `<div class="formula"><span>${esc(n)}</span><code>${esc(f)}</code></div>`).join("")}</div></section>` : "";
    }).join("") || `<p class="muted">No formulas match.</p>`;
  };
  root.innerHTML = `
    <a class="back" href="#/learn">${icon("back", 18)} Learn</a>
    <h1 class="page-title">🧮 Formula sheets</h1>
    <div class="search">${icon("search", 18)}<input id="fq" placeholder="Search: slope, area, density…"></div>
    <div id="fl"></div>`;
  root.querySelector("#fq").oninput = (e) => draw(e.target.value);
  draw();
}

// ---------- Word of the day ----------
export function wordOfDay() {
  const w = words[hashString(todayKey()) % words.length];
  return { word: w[0], syn: w[1], ant: w[2], def: w[3], ctx: w[4] };
}
export function wordCard() {
  const w = wordOfDay();
  return `<div class="card wotd"><span class="eyebrow">📖 Word of the day</span><h3>${esc(w.word)}</h3><p>${esc(w.def)}</p><p class="small muted">Like: <b>${esc(w.syn)}</b> · Opposite: <b>${esc(w.ant)}</b></p>${w.ctx ? `<p class="small"><i>${esc(w.ctx.replace("___", w.word))}</i></p>` : ""}<button class="btn small ghost" id="wsay">🔊 Say it</button></div>`;
}
export const wireWordCard = (root) => root.querySelector("#wsay")?.addEventListener("click", () => speak(`${wordOfDay().word}. ${wordOfDay().def}`));
