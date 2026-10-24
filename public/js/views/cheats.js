// Cheat Codes: animated whiteboard shortcut walkthroughs (like a 30-second explainer video).
import { state, save, addXp, isPremium } from "../store.js";
import { esc, toast, share, baseUrl, celebrateBadges, post } from "../ui.js";
import { cheatcodes, FREE_CHEATS } from "../data/cheatcodes.js";
import { getTopic, getExam } from "../content.js";

const isFree = (code) => cheatcodes.indexOf(code) > -1 && cheatcodes.indexOf(code) < FREE_CHEATS;

// {a|b} → stacked fraction, [[x]] → circled, ~~x~~ → crossed out. Input is escaped first.
export function board(text) {
  return esc(text)
    .replace(/\{([^|{}]+)\|([^{}]+)\}/g, '<span class="frac"><span>$1</span><span>$2</span></span>')
    .replace(/\[\[(.+?)\]\]/g, '<span class="circle">$1</span>')
    .replace(/~~(.+?)~~/g, "<s>$1</s>");
}

export function cheatList(root) {
  const premium = isPremium();
  root.innerHTML = `
    <a class="back" href="#/">← Home</a>
    <h1 class="page-title">🕹️ Cheat Codes</h1>
    <p class="lead">30-second shortcuts that top scorers use on the SHSAT, TACHS, Regents and SAT. Watch, then try one yourself.</p>
    ${premium ? "" : `<a class="card banner premium-banner" href="#/premium"><span class="em">👑</span><span class="grow"><strong>Unlock every Cheat Code</strong><small>Plus a Cheat Code for ANY question you miss</small></span><span class="chev">›</span></a>`}
    <div class="cheat-grid">${cheatcodes
      .map((c) => {
        const locked = !premium && !isFree(c);
        return `<a class="cheat-tile ${locked ? "locked" : ""}" href="#/${locked ? "premium" : `cheat/${c.id}`}">
          <span class="cheat-q">${esc(c.q.length > 70 ? `${c.q.slice(0, 68)}…` : c.q)}</span>
          <strong>${locked ? "🔒 " : "▶ "}${esc(c.trick)}</strong>
          <small>${c.exams.map((e) => esc(getExam(e)?.name || e)).join(" · ")}</small>
        </a>`;
      })
      .join("")}</div>`;
}

export function cheatRoute(root, { id }, query) {
  const code = cheatcodes.find((c) => c.id === id);
  if (!code) {
    root.innerHTML = `<div class="empty"><h2>Cheat Code not found</h2><a class="btn" href="#/cheats">All Cheat Codes</a></div>`;
    return;
  }
  // Shared links play for anyone, so friends can see what Premium is like.
  if (!isPremium() && !isFree(code) && query.shared !== "1") {
    location.hash = "#/premium";
    return;
  }
  cheatList(root);
  return openCheat(code, { onClose: () => history.length > 1 ? history.back() : (location.hash = "#/cheats") });
}

/** Requests an AI Cheat Code for a quiz question and plays it. Premium only. */
export async function aiCheat(q) {
  if (!isPremium()) {
    location.hash = "#/premium";
    return;
  }
  toast("Making your Cheat Code…", { emoji: "🕹️" });
  try {
    const data = await (await post("api/cheatcode", { question: q.q, choices: q.choices, answer_index: q.a, exam: getExam(state.profile.exam)?.name })).json();
    openCheat({ id: "", trick: data.trick, q: q.q, choices: q.choices, a: q.a, steps: data.steps, topic: q.topicId });
  } catch (err) {
    if (err.premium) location.hash = "#/premium";
    else toast(err.message, { emoji: "⚠️" });
  }
}

/** Plays a walkthrough in a full-screen overlay. Returns a cleanup function. */
export function openCheat(code, { onClose } = {}) {
  let i = -1, playing = true, timer = null, closed = false;
  let voice = localStorage.getItem("brainboro:voice") === "1";
  const overlay = document.createElement("div");
  overlay.className = "cheat-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-label", `Cheat Code: ${code.trick}`);
  overlay.innerHTML = `
    <div class="cheat-board">
      <div class="cheat-top"><span class="cheat-tag">🕹️ ${esc(code.trick)}</span><button class="icon-btn" id="cx" aria-label="Close">✕</button></div>
      <div class="cheat-progress">${code.steps.map(() => "<span></span>").join("")}</div>
      <p class="cheat-question">${esc(code.q)}${code.image ? `<img src="${code.image}" alt="Your problem">` : ""}</p>
      <div class="cheat-stage" id="stage" aria-live="polite"></div>
      <div class="cheat-caption" id="cap"></div>
      <ol class="cheat-choices" id="choices" type="A">${code.choices.map((c) => `<li>${esc(c)}</li>`).join("")}</ol>
      <div class="cheat-end hidden" id="end"></div>
      <div class="cheat-controls">
        <button class="icon-btn" id="prev" aria-label="Previous step">⏮</button>
        <button class="icon-btn big" id="play" aria-label="Pause">⏸</button>
        <button class="icon-btn" id="next" aria-label="Next step">⏭</button>
        <button class="icon-btn" id="voice" aria-label="Toggle voice">${voice ? "🔊" : "🔈"}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.body.classList.add("no-scroll");
  const $ = (s) => overlay.querySelector(s);

  const speak = (text, done) => {
    if (!voice || !("speechSynthesis" in window)) return false;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.08;
    u.onend = done;
    speechSynthesis.speak(u);
    return true;
  };

  const show = (n) => {
    clearTimeout(timer);
    i = Math.max(0, Math.min(code.steps.length - 1, n));
    const step = code.steps[i];
    const prev = code.steps[i - 1];
    $("#stage").innerHTML = `${prev ? `<div class="cheat-line old">${board(prev.show)}</div>` : ""}<div class="cheat-line now">${board(step.show)}</div>`;
    $("#cap").textContent = step.say;
    $("#cap").classList.remove("pop");
    void $("#cap").offsetWidth;
    $("#cap").classList.add("pop");
    overlay.querySelectorAll(".cheat-progress span").forEach((s, k) => s.classList.toggle("on", k <= i));
    $("#choices").classList.toggle("reveal", i === code.steps.length - 1);
    if (i === code.steps.length - 1) $("#choices").children[code.a]?.classList.add("right");
    if (playing) {
      const next = () => (i < code.steps.length - 1 ? show(i + 1) : finish());
      const ms = Math.max(2400, step.say.length * 65);
      if (!speak(step.say, () => (timer = setTimeout(next, 600)))) timer = setTimeout(next, ms);
    }
  };

  const finish = () => {
    playing = false;
    $("#play").textContent = "↻";
    state.stats.cheatCodes++;
    celebrateBadges(addXp(5));
    save();
    const topic = getTopic(code.topic);
    $(".cheat-board").classList.add("ended");
    $("#end").classList.remove("hidden");
    $("#end").innerHTML = `
      <p><strong>✅ Answer: ${esc(code.answer ?? code.choices[code.a] ?? "")}</strong></p>
      ${code.tryNext ? `<p class="small" style="margin-top:8px">🎯 <strong>Your turn:</strong> ${esc(code.tryNext)}</p>` : ""}
      <div class="btn-row wrap">
        ${topic ? `<a class="btn" href="#/${topic.gen?.length ? "practice" : "quiz"}/${topic.id}" data-close>Try one yourself →</a>` : ""}
        ${code.tryNext ? `<button class="btn" id="check">🤖 Check my answer</button>` : ""}
        ${code.id ? `<button class="btn ghost" id="sh">📣 Share</button>` : ""}
      </div>`;
    $("#check")?.addEventListener("click", () => {
      sessionStorage.setItem("brainboro:ask", JSON.stringify({ mode: "hint", text: `I just learned how to solve: ${code.q}\nNow I'm trying this one: ${code.tryNext}\nMy answer is: ` }));
      close(false);
      location.hash = "#/tutor";
    });
    $("#sh")?.addEventListener("click", () => share({ title: `BrainBoro Cheat Code: ${code.trick}`, text: `This ${code.trick} trick is crazy 🤯🕹️`, url: `${baseUrl()}#/cheat/${code.id}?shared=1` }));
    overlay.querySelectorAll("[data-close]").forEach((a) => a.addEventListener("click", () => close(false)));
  };

  const close = (navigate = true) => {
    if (closed) return;
    closed = true;
    clearTimeout(timer);
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    overlay.remove();
    document.body.classList.remove("no-scroll");
    document.removeEventListener("keydown", onKey);
    if (navigate) onClose?.();
  };

  const toggle = () => {
    if ($("#play").textContent === "↻") {
      $("#end").classList.add("hidden");
      $(".cheat-board").classList.remove("ended");
      $("#choices").children[code.a]?.classList.remove("right");
      playing = true;
      $("#play").textContent = "⏸";
      return show(0);
    }
    playing = !playing;
    $("#play").textContent = playing ? "⏸" : "▶";
    if (playing) show(i);
    else {
      clearTimeout(timer);
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    }
  };

  const onKey = (e) => {
    if (e.key === "Escape") close();
    else if (e.code === "Space") (e.preventDefault(), toggle());
    else if (e.key === "ArrowRight") show(i + 1);
    else if (e.key === "ArrowLeft") show(i - 1);
  };
  document.addEventListener("keydown", onKey);
  $("#cx").onclick = () => close();
  $("#play").onclick = toggle;
  $("#next").onclick = () => (i < code.steps.length - 1 ? show(i + 1) : finish());
  $("#prev").onclick = () => show(i - 1);
  $("#stage").onclick = () => (i < code.steps.length - 1 ? show(i + 1) : finish());
  $("#voice").onclick = () => {
    voice = !voice;
    localStorage.setItem("brainboro:voice", voice ? "1" : "0");
    $("#voice").textContent = voice ? "🔊" : "🔈";
    if (!voice && "speechSynthesis" in window) speechSynthesis.cancel();
  };
  show(0);
  return () => close(false);
}
