// Flashcards, quizzes, unlimited practice, the Daily Brain Blast, Brain Battles, and mistake review.
import { state, save, addXp, recordAnswer, reviewCard, cardDue, todayKey } from "../store.js";
import { esc, toast, confetti, celebrateBadges, share, baseUrl, aiAvailable, aiQuiz } from "../ui.js";
import { getTopic, getExam, buildQuiz, dailyQuiz, cardId, topics, exams, examTopicIds, subjects } from "../content.js";

// ---------------- Flashcards ----------------
export function flashcards(root, { id }, query) {
  const t = getTopic(id);
  if (!t) return notFound(root);
  const deck = t.cards.map((c, i) => ({ front: c[0], back: c[1], id: cardId(t.id, i), topic: t }));
  runDeck(root, deck, { title: t.name, back: `#/topic/${t.id}`, dueOnly: query.due === "1" });
}

export function reviewRoute(root) {
  const deck = topics.flatMap((t) => t.cards.map((c, i) => ({ front: c[0], back: c[1], id: cardId(t.id, i), topic: t }))).filter((c) => state.cards[c.id] && cardDue(c.id));
  if (!deck.length) {
    root.innerHTML = `<a class="back" href="#/">← Home</a><div class="empty"><div class="big-emoji">🎉</div><h2>No cards due</h2><p>Study some flashcards and they'll come back here right before you'd forget them (spaced repetition).</p><a class="btn" href="#/explore">Find a topic</a></div>`;
    return;
  }
  runDeck(root, deck.slice(0, 40), { title: "Review due cards", back: "#/" });
}

function runDeck(root, cards, { title, back, dueOnly }) {
  let deck = dueOnly ? cards.filter((c) => cardDue(c.id)) : [...cards];
  if (!deck.length) deck = [...cards];
  let i = 0, flipped = false, knew = 0, reviewed = 0;
  const again = [];

  const draw = () => {
    if (i >= deck.length) {
      if (again.length) {
        deck = again.splice(0);
        i = 0;
        toast(`Round 2: ${deck.length} card${deck.length === 1 ? "" : "s"} to practice again`, { emoji: "🔁" });
      } else {
        const badges = addXp(10);
        root.innerHTML = `<a class="back" href="${back}">← Back</a>
          <div class="empty"><div class="big-emoji">🧠</div><h2>Deck complete!</h2>
          <p>You reviewed ${reviewed} cards and knew ${knew} on the first try. +${reviewed * 2 + 10} XP</p>
          <div class="btn-row"><button class="btn" id="again">Study again</button><a class="btn ghost" href="${back}">Done</a></div></div>`;
        root.querySelector("#again").onclick = () => runDeck(root, cards, { title, back });
        celebrateBadges(badges);
        return;
      }
    }
    const c = deck[i];
    root.innerHTML = `
      <div class="study-top"><a class="back" href="${back}">✕</a><div class="bar thin grow"><div class="bar-fill" style="width:${(i / deck.length) * 100}%"></div></div><span class="muted small">${i + 1}/${deck.length}</span></div>
      <p class="muted small center">${esc(title)}${c.topic.name !== title ? ` • ${esc(c.topic.name)}` : ""}</p>
      <button class="flash ${flipped ? "flipped" : ""}" id="card" aria-label="Flip card">
        <div class="flash-inner">
          <div class="flash-face front"><span class="flash-hint">TERM</span><p>${esc(c.front)}</p><small>Tap or press Space to flip</small></div>
          <div class="flash-face back"><span class="flash-hint">MEANING</span><p>${esc(c.back)}</p></div>
        </div>
      </button>
      <div class="btn-row ${flipped ? "" : "hidden"}" id="grade">
        <button class="btn bad" id="no">😵 Still learning <kbd>1</kbd></button>
        <button class="btn good" id="yes">😎 Got it <kbd>2</kbd></button>
      </div>`;
    root.querySelector("#card").onclick = flip;
    root.querySelector("#no").onclick = () => grade(false);
    root.querySelector("#yes").onclick = () => grade(true);
  };
  const flip = () => {
    flipped = !flipped;
    root.querySelector("#card").classList.toggle("flipped", flipped);
    root.querySelector("#grade").classList.toggle("hidden", !flipped);
  };
  const grade = (ok) => {
    const c = deck[i];
    reviewCard(c.id, ok);
    reviewed++;
    if (ok && !again.includes(c)) knew++;
    if (!ok) again.push(c);
    addXp(2);
    i++;
    flipped = false;
    draw();
  };
  const onKey = (e) => {
    if (e.target.closest("input, textarea")) return;
    if (e.code === "Space") (e.preventDefault(), flip());
    else if (flipped && e.key === "1") grade(false);
    else if (flipped && e.key === "2") grade(true);
  };
  document.addEventListener("keydown", onKey);
  draw();
  return () => document.removeEventListener("keydown", onKey);
}

// ---------------- Quiz runner ----------------
/**
 * Runs a quiz. mode "practice" shows feedback after each answer; mode "test" is timed with review at the end.
 * Returns a cleanup function.
 */
export function runQuiz(root, questions, opts) {
  const { title, back = "#/", mode = "practice", minutes, onFinish, more } = opts;
  let i = 0, combo = 0, bestCombo = 0, correct = 0, picked = null, xpGained = 0, timer = null;
  const answers = [];
  const started = Date.now();
  const deadline = minutes ? started + minutes * 60000 : null;

  const header = () => `
    <div class="study-top">
      <a class="back" href="${back}" aria-label="Quit">✕</a>
      <div class="bar thin grow"><div class="bar-fill" style="width:${(i / questions.length) * 100}%"></div></div>
      ${deadline ? `<span class="timer" id="timer">${fmtTime(deadline - Date.now())}</span>` : `<span class="combo ${combo >= 2 ? "hot" : ""}">🔥 ${combo}</span>`}
    </div>
    <p class="muted small center">${esc(title)} • Question ${i + 1} of ${questions.length}</p>`;

  const draw = () => {
    if (i >= questions.length) return finish();
    const q = questions[i];
    picked = null;
    const topic = getTopic(q.topicId);
    root.innerHTML = `${header()}
      <div class="question">
        ${topic && opts.showTopic ? `<span class="eyebrow">${esc(topic.name)}</span>` : ""}
        <p class="q-text">${esc(q.q).replace(/\n/g, "<br>")}</p>
        <div class="choices">${q.choices.map((c, k) => `<button class="choice" data-k="${k}"><span class="letter">${"ABCD"[k] || k + 1}</span><span>${esc(c)}</span></button>`).join("")}</div>
        <div id="feedback"></div>
      </div>
      ${mode === "test" ? `<div class="btn-row"><button class="btn ghost" id="skip">Skip</button><button class="btn" id="next" disabled>Next →</button></div>` : ""}`;
    root.querySelectorAll(".choice").forEach((b) => (b.onclick = () => choose(Number(b.dataset.k))));
    if (mode === "test") {
      root.querySelector("#skip").onclick = () => {
        answers.push({ q, picked: null, ok: false });
        i++;
        draw();
      };
      root.querySelector("#next").onclick = () => {
        const ok = recordAnswer(q, picked);
        if (ok) correct++;
        answers.push({ q, picked, ok });
        i++;
        draw();
      };
    }
  };

  const choose = (k) => {
    const q = questions[i];
    if (mode === "test") {
      picked = k;
      root.querySelectorAll(".choice").forEach((b) => b.classList.toggle("selected", Number(b.dataset.k) === k));
      root.querySelector("#next").disabled = false;
      return;
    }
    if (picked !== null) return;
    picked = k;
    const ok = recordAnswer(q, k);
    answers.push({ q, picked: k, ok });
    if (ok) {
      correct++;
      combo++;
      bestCombo = Math.max(bestCombo, combo);
    } else combo = 0;
    const gain = ok ? 10 + Math.min(10, (combo - 1) * 2) : 2;
    xpGained += gain;
    celebrateBadges(addXp(gain));
    root.querySelectorAll(".choice").forEach((b) => {
      const n = Number(b.dataset.k);
      b.disabled = true;
      if (n === q.a) b.classList.add("right");
      else if (n === k) b.classList.add("wrong");
    });
    const praise = ["Nice!", "Let's go!", "Big brain!", "Correct!", "You got it!", "Clean!"];
    root.querySelector("#feedback").innerHTML = `
      <div class="feedback ${ok ? "ok" : "no"}">
        <strong>${ok ? `✅ ${praise[(i + combo) % praise.length]} +${gain} XP${combo >= 3 ? ` • ${combo} in a row 🔥` : ""}` : `❌ Not quite — answer: ${esc(q.choices[q.a])}`}</strong>
        <p>${esc(q.exp)}</p>
        <div class="btn-row">
          ${ok ? "" : `<button class="btn ghost small" id="why">🤖 Explain with Boro</button>`}
          <button class="btn" id="next">${i + 1 < questions.length ? "Next →" : "See results"}</button>
        </div>
      </div>`;
    const next = root.querySelector("#next");
    next.onclick = () => {
      i++;
      draw();
    };
    next.focus();
    root.querySelector("#why")?.addEventListener("click", () => askBoro(q, k));
    root.querySelector(".combo")?.replaceWith(Object.assign(document.createElement("span"), { className: `combo ${combo >= 2 ? "hot" : ""}`, textContent: `🔥 ${combo}` }));
  };

  const finish = () => {
    clearInterval(timer);
    const total = questions.length;
    const timeMs = Date.now() - started;
    const perfect = correct === total && total > 0;
    let bonus = mode === "test" ? 30 : 20;
    if (perfect) {
      bonus += 30;
      state.stats.perfect++;
    }
    if (mode === "test") xpGained += correct * 10;
    xpGained += bonus;
    const badges = addXp(bonus + (mode === "test" ? correct * 10 : 0));
    const result = { correct, total, timeMs, bestCombo, answers, xp: xpGained };
    const pct = total ? Math.round((correct / total) * 100) : 0;
    root.innerHTML = `
      <div class="results">
        <div class="big-emoji">${pct === 100 ? "🏆" : pct >= 80 ? "🔥" : pct >= 60 ? "💪" : "🌱"}</div>
        <h1>${correct}/${total}</h1>
        <p class="lead">${pct === 100 ? "PERFECT. You're cooking." : pct >= 80 ? "Great job!" : pct >= 60 ? "Solid — keep pushing." : "Every mistake is a lesson. Run it back!"}</p>
        <div class="stat-row">
          <div class="stat"><div class="stat-v">${pct}%</div><div class="stat-l">score</div></div>
          <div class="stat"><div class="stat-v">+${xpGained}</div><div class="stat-l">XP</div></div>
          <div class="stat"><div class="stat-v">${fmtTime(timeMs)}</div><div class="stat-l">time</div></div>
        </div>
        <div id="extra"></div>
        <div class="btn-row wrap">
          ${more ? `<button class="btn" id="more">Keep going ♾️</button>` : `<button class="btn" id="retry">Try again</button>`}
          <button class="btn ghost" id="share">📣 Share score</button>
          <a class="btn ghost" href="${back}">Done</a>
        </div>
        ${answers.some((a) => !a.ok) ? `<section class="section"><div class="section-head"><h2>Review</h2></div>${answers.map((a, n) => reviewItem(a, n)).join("")}</section>` : ""}
      </div>`;
    if (perfect) confetti();
    celebrateBadges(badges);
    root.querySelector("#retry")?.addEventListener("click", () => opts.restart?.());
    root.querySelector("#more")?.addEventListener("click", () => more());
    root.querySelector("#share").onclick = () => share({ title: "BrainBoro", text: `I scored ${correct}/${total} on ${title} on BrainBoro 🧠🔥 Can you beat me?`, url: opts.shareUrl || baseUrl() });
    root.querySelectorAll("[data-why]").forEach((b) => (b.onclick = () => askBoro(answers[Number(b.dataset.why)].q, answers[Number(b.dataset.why)].picked)));
    onFinish?.(result, root.querySelector("#extra"));
  };

  if (deadline) {
    timer = setInterval(() => {
      const left = deadline - Date.now();
      const el = root.querySelector("#timer");
      if (el) {
        el.textContent = fmtTime(Math.max(0, left));
        el.classList.toggle("low", left < 60000);
      }
      if (left <= 0) {
        clearInterval(timer);
        toast("Time's up!", { emoji: "⏰" });
        while (answers.length < questions.length) answers.push({ q: questions[answers.length], picked: null, ok: false });
        i = questions.length;
        finish();
      }
    }, 500);
  }

  const onKey = (e) => {
    if (e.target.closest("input, textarea")) return;
    const k = "1234".indexOf(e.key) >= 0 ? "1234".indexOf(e.key) : "abcd".indexOf(e.key.toLowerCase());
    if (k >= 0 && i < questions.length && k < questions[i].choices.length) choose(k);
    else if (e.key === "Enter") root.querySelector("#next:not([disabled])")?.click();
  };
  document.addEventListener("keydown", onKey);
  draw();
  return () => {
    clearInterval(timer);
    document.removeEventListener("keydown", onKey);
  };
}

function reviewItem(a, n) {
  const { q, picked, ok } = a;
  return `<div class="review ${ok ? "ok" : "no"}">
    <p><strong>${n + 1}.</strong> ${esc(q.q).replace(/\n/g, "<br>")}</p>
    <p class="small">${picked === null ? "⏭️ Skipped" : ok ? "✅" : `❌ You said: ${esc(q.choices[picked])}`} • Answer: <strong>${esc(q.choices[q.a])}</strong></p>
    <p class="small muted">${esc(q.exp)}</p>
    ${ok ? "" : `<button class="link small" data-why="${n}">🤖 Explain with Boro</button>`}
  </div>`;
}

export function askBoro(q, picked) {
  const topic = getTopic(q.topicId);
  sessionStorage.setItem(
    "brainboro:ask",
    JSON.stringify({
      topic: q.topicId,
      text: `Can you explain this question?\n\n${q.q}\nChoices: ${q.choices.map((c, k) => `${"ABCD"[k]}) ${c}`).join("  ")}\n\n${picked != null ? `I picked "${q.choices[picked]}" but the answer is "${q.choices[q.a]}". Why?` : `The answer is "${q.choices[q.a]}". Why?`}${topic ? `\n(Topic: ${topic.name})` : ""}`,
    }),
  );
  location.hash = "#/tutor";
}

const fmtTime = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function notFound(root) {
  root.innerHTML = `<div class="empty"><h2>Not found</h2><a class="btn" href="#/explore">Explore</a></div>`;
}

function loading(root, text) {
  root.innerHTML = `<div class="empty"><div class="spinner"></div><p>${esc(text)}</p></div>`;
}

// ---------------- Routes ----------------
export function quizRoute(root, { id }, query) {
  const t = getTopic(id);
  if (!t) return notFound(root);
  let cleanup = null;
  const start = async () => {
    cleanup?.();
    if (query.ai === "1") {
      if (!(await aiAvailable())) {
        root.innerHTML = `<a class="back" href="#/topic/${t.id}">← Back</a><div class="empty"><div class="big-emoji">✨</div><h2>AI quizzes aren't switched on here yet</h2><p>The site owner needs to add an Anthropic API key. Meanwhile, try the regular quiz${t.gen?.length ? " or unlimited practice" : ""}!</p><div class="btn-row"><a class="btn" href="#/quiz/${t.id}">Regular quiz</a></div></div>`;
        return;
      }
      loading(root, "Boro is writing fresh questions for you…");
      try {
        const qs = await aiQuiz({ topic: `${t.name} (${t.course}: ${t.unit}) — ${t.desc}`, count: 6, grade: state.profile.grade, exam: getExam(state.profile.exam)?.name });
        cleanup = runQuiz(root, qs.map((q) => ({ ...q, topicId: t.id })), { title: `✨ AI quiz: ${t.name}`, back: `#/topic/${t.id}`, restart: start });
      } catch (err) {
        root.innerHTML = `<a class="back" href="#/topic/${t.id}">← Back</a><div class="empty"><h2>Couldn't make an AI quiz</h2><p>${esc(err.message)}</p><a class="btn" href="#/quiz/${t.id}">Regular quiz</a></div>`;
      }
      return;
    }
    cleanup = runQuiz(root, buildQuiz([t.id], 10), { title: t.name, back: `#/topic/${t.id}`, restart: start });
  };
  start();
  return () => cleanup?.();
}

export function practiceRoute(root, { id }) {
  const t = getTopic(id);
  if (!t) return notFound(root);
  let cleanup = null;
  const round = () => {
    cleanup?.();
    cleanup = runQuiz(root, buildQuiz([t.id], 10, Date.now(), { generatedOnly: true }), { title: `♾️ ${t.name}`, back: `#/topic/${t.id}`, more: round });
  };
  round();
  return () => cleanup?.();
}

export function dailyRoute(root) {
  const key = todayKey();
  const examId = state.profile.exam;
  const done = state.daily[key];
  const qs = dailyQuiz(key, examId);
  const examName = getExam(examId)?.name;
  const title = `Daily Brain Blast${examName ? ` (${examName})` : ""}`;
  const shareUrl = `${baseUrl()}#/battle?d=${key}&e=${examId}&n=${encodeURIComponent(state.profile.name || "A friend")}&sc=${done?.score ?? ""}`;
  if (done) {
    root.innerHTML = `<a class="back" href="#/">← Home</a><div class="empty"><div class="big-emoji">✅</div><h2>Today's Blast: ${done.score}/5</h2><p>New Brain Blast drops tomorrow. Send today's to a friend — they get the exact same questions.</p>
      <div class="btn-row"><button class="btn" id="share">🥊 Challenge a friend</button><a class="btn ghost" href="#/">Home</a></div></div>`;
    root.querySelector("#share").onclick = () => share({ title: "BrainBoro Daily Brain Blast", text: `I got ${done.score}/5 on today's Brain Blast 🧠⚡ Same 5 questions — can you beat me?`, url: shareUrl });
    return;
  }
  return runQuiz(root, qs, {
    title,
    back: "#/",
    showTopic: true,
    onFinish: (r) => {
      state.daily[key] = { score: r.correct, at: Date.now() };
      // Keep only the last 60 days.
      for (const k of Object.keys(state.daily).sort().slice(0, -60)) delete state.daily[k];
      celebrateBadges(addXp(50));
      toast("+50 XP Daily Blast bonus", { emoji: "⚡" });
      save();
    },
    shareUrl: `${baseUrl()}#/battle?d=${key}&e=${examId}&n=${encodeURIComponent(state.profile.name || "A friend")}`,
  });
}

/**
 * Brain Battle: a link encodes the question set (topic/exam + seed) and the sender's score,
 * so a friend plays the identical questions and can send their score back.
 */
export function battleRoute(root, _params, query) {
  const { t, e, d } = query;
  const source = t ? getTopic(t) : e && !d ? getExam(e) : null;
  if (!t && !e && !d) return battlePicker(root);
  if ((t || (e && !d)) && !source) return notFound(root);

  const seed = query.s || String(Math.floor(Math.random() * 1e9));
  const n = 10;
  const questions = d ? dailyQuiz(d, e || "") : t ? buildQuiz([t], n, seed) : buildQuiz(examTopicIds(source), n, seed);
  const label = d ? `Brain Blast ${d}` : source.name;
  const rival = query.n ? query.n.slice(0, 20) : "";
  const rivalScore = query.sc !== undefined && query.sc !== "" ? Number(query.sc) : null;
  const rivalTime = query.tm ? Number(query.tm) : null;
  const linkFor = (score, ms) => {
    const p = new URLSearchParams();
    if (t) p.set("t", t);
    if (e) p.set("e", e);
    if (d) p.set("d", d);
    if (!d) p.set("s", seed);
    p.set("n", state.profile.name || "A friend");
    p.set("sc", score);
    p.set("tm", Math.round(ms / 1000));
    return `${baseUrl()}#/battle?${p}`;
  };

  let cleanup = null;
  root.innerHTML = `
    <a class="back" href="#/">← Home</a>
    <div class="battle-card">
      <div class="big-emoji">🥊</div>
      <h1>Brain Battle</h1>
      <p class="lead">${esc(label)} • ${questions.length} questions</p>
      ${rival && rivalScore !== null ? `<div class="vs"><div><span class="avatar-lg">🧑‍🎓</span><strong>${esc(rival)}</strong><span class="score">${rivalScore}/${questions.length}</span>${rivalTime ? `<small>${Math.floor(rivalTime / 60)}:${String(rivalTime % 60).padStart(2, "0")}</small>` : ""}</div><div class="vs-x">VS</div><div><span class="avatar-lg">${esc(state.profile.avatar)}</span><strong>${esc(state.profile.name || "You")}</strong><span class="score">?</span></div></div>
        <p>${esc(rival)} challenged you. Same questions. Can you beat their score?</p>` : `<p>Play first, then send the link — your friend gets the <strong>exact same questions</strong>.</p>`}
      ${!state.profile.onboarded ? `<label class="field"><span>Your name</span><input id="nm" maxlength="20" placeholder="Nickname"></label>` : ""}
      <button class="btn big" id="go">${rival ? "Accept challenge ⚔️" : "Start battle ⚔️"}</button>
    </div>`;
  root.querySelector("#go").onclick = () => {
    const nm = root.querySelector("#nm");
    if (nm) {
      state.profile.name = nm.value.trim().slice(0, 20);
      state.profile.onboarded = true;
      save();
    }
    cleanup = runQuiz(root, questions, {
      title: `🥊 ${label}`,
      back: "#/",
      showTopic: !t,
      onFinish: (r, extra) => {
        state.stats.battles++;
        save();
        const link = linkFor(r.correct, r.timeMs);
        let verdict = "";
        if (rivalScore !== null) {
          const win = r.correct > rivalScore || (r.correct === rivalScore && rivalTime && r.timeMs / 1000 < rivalTime);
          const tie = r.correct === rivalScore && !(rivalTime && r.timeMs / 1000 !== rivalTime);
          verdict = win ? `<div class="verdict win">🏆 You beat ${esc(rival)}! (${r.correct} vs ${rivalScore})</div>` : tie ? `<div class="verdict">🤝 Tie with ${esc(rival)}!</div>` : `<div class="verdict lose">😤 ${esc(rival)} wins this round (${rivalScore === r.correct ? "same score, faster time" : `${rivalScore} vs ${r.correct}`}). Rematch?</div>`;
          if (win) confetti();
        }
        extra.innerHTML = `${verdict}<button class="btn big" id="send">📣 Send ${rival ? `your score back to ${esc(rival)}` : "this battle to friends"}</button>`;
        extra.querySelector("#send").onclick = () =>
          share({ title: "BrainBoro Brain Battle", text: `I scored ${r.correct}/${r.total} on ${label} 🧠⚔️ Same questions — beat me if you can:`, url: link });
      },
    });
  };
  return () => cleanup?.();
}

function battlePicker(root) {
  const exam = getExam(state.profile.exam);
  root.innerHTML = `
    <a class="back" href="#/">← Home</a>
    <h1 class="page-title">🥊 Brain Battle</h1>
    <p class="lead">Pick a test or topic. You play 10 questions, then send the link — your friends get the exact same questions and see your score.</p>
    ${exam ? `<a class="card banner" href="#/battle?e=${exam.id}" style="--accent:${exam.color}"><span class="em">${exam.emoji}</span><span class="grow"><strong>${esc(exam.name)} battle</strong><small>Mixed questions from your test</small></span><span class="chev">›</span></a>` : ""}
    <div class="section-head"><h2>Tests</h2></div>
    <div class="grid-2">${exams.map((x) => `<a class="card tile" style="--accent:${x.color}" href="#/battle?e=${x.id}"><div class="tile-emoji">${x.emoji}</div><h3>${esc(x.name)}</h3></a>`).join("")}</div>
    <div class="section-head"><h2>Or pick any topic</h2></div>
    <div class="list">${subjects
      .map((s) => topics.filter((t) => t.subject === s.id).slice(0, 6).map((t) => `<a class="row" href="#/battle?t=${t.id}"><span class="row-dot" style="--accent:${s.color}"></span><span class="grow"><strong>${esc(t.name)}</strong><small>${esc(t.course)}</small></span><span class="chev">›</span></a>`).join(""))
      .join("")}</div>`;
}

export function mistakesRoute(root) {
  const list = state.mistakes.slice(0, 20).map((m) => ({ q: m.q, choices: m.choices, a: m.a, exp: m.exp, topicId: m.topicId }));
  if (!list.length) {
    root.innerHTML = `<a class="back" href="#/me">← Me</a><div class="empty"><div class="big-emoji">🌟</div><h2>No mistakes yet</h2><p>Questions you miss show up here so you can redo them.</p></div>`;
    return;
  }
  return runQuiz(root, list, {
    title: "Mistake redo",
    back: "#/me",
    showTopic: true,
    onFinish: (r) => {
      // Drop the ones you got right this time.
      const fixed = new Set(r.answers.filter((a) => a.ok).map((a) => a.q.q));
      state.mistakes = state.mistakes.filter((m) => !fixed.has(m.q));
      save();
      if (fixed.size) toast(`Cleared ${fixed.size} mistake${fixed.size === 1 ? "" : "s"}!`, { emoji: "🧹" });
    },
  });
}
