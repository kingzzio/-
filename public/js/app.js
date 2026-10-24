// BrainBoro — app shell, router and onboarding.
import { state, save, levelProgress, streakAlive, onChange } from "./store.js";
import { esc } from "./ui.js";
import { exams } from "./content.js";
import home from "./views/home.js";
import { explore, topicPage } from "./views/explore.js";
import { flashcards, quizRoute, practiceRoute, dailyRoute, battleRoute, mistakesRoute, reviewRoute } from "./views/study.js";
import { examList, examPage, testRoute } from "./views/exams.js";
import curriculum from "./views/curriculum.js";
import tutor from "./views/tutor.js";
import profile from "./views/profile.js";

const routes = [
  ["", home],
  ["explore", explore],
  ["topic/:id", topicPage],
  ["flash/:id", flashcards],
  ["quiz/:id", quizRoute],
  ["practice/:id", practiceRoute],
  ["daily", dailyRoute],
  ["battle", battleRoute],
  ["mistakes", mistakesRoute],
  ["review", reviewRoute],
  ["exams", examList],
  ["exam/:id", examPage],
  ["test/:id", testRoute],
  ["curriculum", curriculum],
  ["tutor", tutor],
  ["me", profile],
];

const tabs = [
  ["", "🏠", "Home"],
  ["explore", "🔎", "Explore"],
  ["exams", "🎯", "Tests"],
  ["tutor", "🤖", "Boro AI"],
  ["me", "👤", "Me"],
];

let cleanup = null;

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [path, qs = ""] = raw.split("?");
  return { path: path.replace(/\/$/, ""), query: Object.fromEntries(new URLSearchParams(qs)) };
}

function match(path) {
  const parts = path.split("/").filter(Boolean);
  for (const [pattern, view] of routes) {
    const pp = pattern.split("/").filter(Boolean);
    if (pp.length !== parts.length) continue;
    const params = {};
    if (pp.every((p, i) => (p.startsWith(":") ? ((params[p.slice(1)] = decodeURIComponent(parts[i])), true) : p === parts[i]))) return { view, params };
  }
  return null;
}

export function go(path) {
  location.hash = `#/${path}`;
}

function renderChrome(path) {
  const root = path.split("/")[0];
  const active = { topic: "explore", flash: "explore", quiz: "explore", practice: "explore", exam: "exams", test: "exams", curriculum: "explore" }[root] ?? root;
  document.getElementById("tabs").innerHTML = tabs
    .map(([p, icon, label]) => `<a href="#/${p}" class="tab ${active === p ? "on" : ""}" ${active === p ? 'aria-current="page"' : ""}><span class="tab-i">${icon}</span><span>${label}</span></a>`)
    .join("");
  const lp = levelProgress();
  document.getElementById("hud").innerHTML = `
    <a href="#/me" class="hud-chip" title="Your streak"><span class="${streakAlive() && state.streak.count ? "flame" : "flame off"}">🔥</span>${state.streak.count && streakAlive() ? state.streak.count : 0}</a>
    <a href="#/me" class="hud-chip" title="Level ${lp.lv}"><span>⚡</span>Lv ${lp.lv}</a>`;
}

function render() {
  if (typeof cleanup === "function") cleanup();
  cleanup = null;
  const { path, query } = parseHash();
  const main = document.getElementById("main");
  if (!state.profile.onboarded && !path.startsWith("battle")) {
    renderChrome("");
    onboarding(main);
    return;
  }
  const found = match(path);
  renderChrome(path);
  main.innerHTML = "";
  main.className = "main";
  window.scrollTo(0, 0);
  if (!found) {
    main.innerHTML = `<div class="empty"><div class="big-emoji">🧭</div><h2>Page not found</h2><a class="btn" href="#/">Go home</a></div>`;
    return;
  }
  cleanup = found.view(main, found.params, query);
  main.focus({ preventScroll: true });
}

function onboarding(main) {
  const avatars = ["🦉", "🐯", "🦊", "🐼", "🐸", "🦄", "🐙", "🐝", "🦖", "🐧", "🐨", "👾"];
  const step = { n: 0, name: state.profile.name, grade: state.profile.grade, exam: state.profile.exam, avatar: state.profile.avatar };
  const draw = () => {
    if (step.n === 0) {
      main.innerHTML = `
      <section class="onboard">
        <div class="logo-big">Brain<span>Boro</span></div>
        <p class="lead">Free SHSAT, TACHS, Regents & SAT prep + every grade 6–12 subject. Flashcards, quizzes, timed tests and an AI tutor — built for NYC students.</p>
        <label class="field"><span>What should we call you?</span><input id="ob-name" maxlength="20" placeholder="First name or nickname" value="${esc(step.name)}" autocomplete="off"></label>
        <div class="field"><span>Pick your study buddy</span><div class="avatar-grid">${avatars.map((a) => `<button class="avatar ${a === step.avatar ? "on" : ""}" data-a="${a}" aria-label="Avatar ${a}">${a}</button>`).join("")}</div></div>
        <button class="btn big" id="ob-next">Next →</button>
      </section>`;
      main.querySelectorAll(".avatar").forEach((b) => (b.onclick = () => ((step.avatar = b.dataset.a), (step.name = main.querySelector("#ob-name").value), draw())));
      main.querySelector("#ob-next").onclick = () => {
        step.name = main.querySelector("#ob-name").value.trim();
        step.n = 1;
        draw();
      };
    } else {
      const grades = ["6", "7", "8", "9", "10", "11", "12"];
      main.innerHTML = `
      <section class="onboard">
        <h2>Hey ${esc(step.name || "there")} ${step.avatar}</h2>
        <div class="field"><span>What grade are you in?</span><div class="chip-row">${grades.map((g) => `<button class="chip ${g === step.grade ? "on" : ""}" data-g="${g}">${g}th</button>`).join("")}</div></div>
        <div class="field"><span>What are you studying for? <small>(you can change this later)</small></span>
          <div class="exam-pick">${exams.map((e) => `<button class="exam-opt ${e.id === step.exam ? "on" : ""}" data-e="${e.id}" style="--accent:${e.color}"><span>${e.emoji}</span>${esc(e.name)}</button>`).join("")}
          <button class="exam-opt ${step.exam === "" ? "on" : ""}" data-e=""><span>📘</span>Just class / homework</button></div></div>
        <button class="btn big" id="ob-go">Let's go 🚀</button>
        <button class="link" id="ob-back">← Back</button>
      </section>`;
      main.querySelectorAll("[data-g]").forEach((b) => (b.onclick = () => ((step.grade = b.dataset.g), draw())));
      main.querySelectorAll("[data-e]").forEach((b) => (b.onclick = () => ((step.exam = b.dataset.e), draw())));
      main.querySelector("#ob-back").onclick = () => ((step.n = 0), draw());
      main.querySelector("#ob-go").onclick = () => {
        Object.assign(state.profile, { name: step.name, grade: step.grade, exam: step.exam, avatar: step.avatar, onboarded: true });
        save();
        render();
      };
    }
  };
  draw();
}

function applyTheme() {
  if (state.theme) document.documentElement.dataset.theme = state.theme;
  else delete document.documentElement.dataset.theme;
}

window.addEventListener("hashchange", render);
onChange(() => renderChrome(parseHash().path));
window.addEventListener("brainboro:theme", applyTheme);
window.addEventListener("brainboro:rerender", render);
applyTheme();
render();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
