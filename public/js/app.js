// BrainBoro — app shell, router and onboarding.
import { state, save, levelProgress, streakAlive, onChange } from "./store.js";
import { esc } from "./ui.js";
import { icon } from "./icons.js";
import { exams } from "./content.js";
import { initAccount, user, syncNow } from "./account.js";
import home from "./views/home.js";
import { explore, topicPage } from "./views/explore.js";
import { flashcards, quizRoute, practiceRoute, dailyRoute, battleRoute, mistakesRoute, reviewRoute } from "./views/study.js";
import { examList, examPage, testRoute } from "./views/exams.js";
import curriculum from "./views/curriculum.js";
import tutor from "./views/tutor.js";
import profile from "./views/profile.js";
import resourcesView from "./views/resources.js";
import { cheatList, cheatRoute } from "./views/cheats.js";
import premium from "./views/premium.js";
import planner from "./views/planner.js";
import learn from "./views/learn.js";
import { loginView, BOROUGHS } from "./views/auth.js";
import admin from "./views/admin.js";
import connect from "./views/connect.js";
import solve from "./views/solve.js";
import blitz from "./views/blitz.js";
import leaderboard from "./views/leaderboard.js";

const routes = [
  ["", home],
  ["learn", learn],
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
  ["resources", resourcesView],
  ["cheats", cheatList],
  ["cheat/:id", cheatRoute],
  ["premium", premium],
  ["planner", planner],
  ["connect", connect],
  ["solve", solve],
  ["blitz", blitz],
  ["leaderboard", leaderboard],
  ["login", loginView],
  ["admin", admin],
];

const tabs = [
  ["", "home", "Home"],
  ["learn", "learn", "Learn"],
  ["planner", "calendar", "Planner"],
  ["tutor", "spark", "Boro AI"],
  ["me", "user", "Me"],
];
// Which tab lights up for each page.
const TAB_OF = { topic: "learn", flash: "learn", quiz: "learn", practice: "learn", explore: "learn", exams: "learn", exam: "learn", test: "learn", curriculum: "learn", resources: "learn", cheats: "learn", cheat: "learn", blitz: "learn", review: "", daily: "", battle: "", connect: "planner", solve: "planner", premium: "me", admin: "me", leaderboard: "", login: "me", mistakes: "me" };

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

let lastChrome = "";
function renderChrome(path) {
  const root = path.split("/")[0];
  const active = TAB_OF[root] ?? root;
  const today = new Date().toDateString();
  const due = (state.planner.items || []).filter((t) => !t.done && new Date(t.due).toDateString() === today).length;
  const lp = levelProgress();
  const u = user();
  const streak = streakAlive() ? state.streak.count : 0;
  const key = `${active}|${due}|${lp.lv}|${streak}|${u?.picture}|${state.profile.avatar}`;
  if (key === lastChrome) return; // nothing changed: skip DOM work
  lastChrome = key;
  document.getElementById("tabs").innerHTML = tabs
    .map(([p, ic, label]) => `<a href="#/${p}" class="tab ${active === p ? "on" : ""}" ${active === p ? 'aria-current="page"' : ""}><span class="tab-i" ${p === "planner" && due ? `data-n="${due}"` : ""}>${icon(ic, 22)}</span><span>${label}</span></a>`)
    .join("");
  document.getElementById("hud").innerHTML = `
    <a href="#/me" class="hud-chip" title="Day streak"><span class="flame ${streak ? "" : "off"}">🔥</span>${streak}</a>
    <a href="#/me" class="hud-chip" title="Level ${lp.lv}">⚡ ${lp.lv}</a>
    <a href="#/me" class="hud-avatar" aria-label="Your profile">${u?.picture ? `<img src="${esc(u.picture)}" alt="" referrerpolicy="no-referrer">` : esc(state.profile.avatar)}</a>`;
}

function render() {
  if (typeof cleanup === "function") cleanup();
  cleanup = null;
  const { path, query } = parseHash();
  const main = document.getElementById("main");
  main.className = "main";
  lastChrome = "";
  if (!state.profile.onboarded && !/^(battle|cheat\/|premium|login)/.test(path)) {
    renderChrome("");
    onboarding(main);
    return;
  }
  const found = match(path);
  renderChrome(path);
  main.innerHTML = "";
  window.scrollTo(0, 0);
  if (!found) {
    main.innerHTML = `<div class="empty"><div class="big-emoji">🧭</div><h2>Page not found</h2><a class="btn" href="#/">Go home</a></div>`;
    return;
  }
  cleanup = found.view(main, found.params, query);
  main.focus({ preventScroll: true });
}

// Step 1: account (or guest). Step 2: name, avatar, grade, borough, test.
function onboarding(main) {
  const avatars = ["🦉", "🐯", "🦊", "🐼", "🐸", "🦄", "🐙", "🐝", "🦖", "🐧", "🐨", "👾"];
  const step = { n: state.account ? 1 : 0, name: state.profile.name || user()?.name || "", grade: state.profile.grade, exam: state.profile.exam, avatar: state.profile.avatar, borough: user()?.borough || state.profile.borough || "" };
  const draw = () => {
    if (step.n === 0) {
      loginView(main, {}, { onboarding: "1" }, {
        onDone: () => ((step.n = 1), (step.name ||= user()?.name || ""), draw()),
        onGuest: () => ((step.n = 1), draw()),
      });
      return;
    }
    const grades = ["6", "7", "8", "9", "10", "11", "12"];
    main.innerHTML = `
      <section class="onboard">
        <h1>Let's set you up ${esc(step.avatar)}</h1>
        <p class="lead">Takes 20 seconds. You can change it anytime.</p>
        <label class="field"><span>What should we call you?</span><input id="ob-name" maxlength="20" placeholder="First name or nickname" value="${esc(step.name)}" autocomplete="given-name"></label>
        <div class="field"><span>Pick your study buddy</span><div class="avatar-grid">${avatars.map((a) => `<button class="avatar ${a === step.avatar ? "on" : ""}" data-a="${a}" aria-label="Avatar ${a}">${a}</button>`).join("")}</div></div>
        <div class="field"><span>Grade</span><div class="chip-row">${grades.map((g) => `<button class="chip ${g === step.grade ? "on" : ""}" data-g="${g}">${g}th</button>`).join("")}</div></div>
        <div class="field"><span>Your borough <small>(for Borough Wars 🏆)</small></span><div class="chip-row">${BOROUGHS.map((b) => `<button class="chip ${b === step.borough ? "on" : ""}" data-b="${esc(b)}">${esc(b)}</button>`).join("")}</div></div>
        <div class="field"><span>What are you studying for?</span>
          <div class="exam-pick">${exams.map((e) => `<button class="exam-opt ${e.id === step.exam ? "on" : ""}" data-e="${e.id}" style="--accent:${e.color}"><span>${e.emoji}</span>${esc(e.name)}</button>`).join("")}
          <button class="exam-opt ${step.exam === "" ? "on" : ""}" data-e=""><span>📘</span>Just class / homework</button></div></div>
        <button class="btn big glow" id="ob-go">Let's go 🚀</button>
      </section>`;
    const keep = () => (step.name = main.querySelector("#ob-name").value);
    main.querySelectorAll("[data-a]").forEach((b) => (b.onclick = () => (keep(), (step.avatar = b.dataset.a), draw())));
    main.querySelectorAll("[data-g]").forEach((b) => (b.onclick = () => (keep(), (step.grade = b.dataset.g), draw())));
    main.querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => (keep(), (step.borough = b.dataset.b), draw())));
    main.querySelectorAll("[data-e]").forEach((b) => (b.onclick = () => (keep(), (step.exam = b.dataset.e), draw())));
    main.querySelector("#ob-go").onclick = () => {
      keep();
      Object.assign(state.profile, { name: step.name.trim(), grade: step.grade, exam: step.exam, avatar: step.avatar, borough: step.borough, onboarded: true });
      save();
      if (user()) syncNow({ name: step.name.trim() || undefined, borough: step.borough });
      render();
    };
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
// Hairline under the top bar once you scroll.
const topbar = document.querySelector(".topbar");
addEventListener("scroll", () => topbar.classList.toggle("scrolled", scrollY > 4), { passive: true });
applyTheme();
render();
// Check the session in the background; re-render if it changes who's logged in.
initAccount().then((u) => {
  if (u && ["", "me", "planner"].includes(parseHash().path) && !document.querySelector(".onboard")) render();
  else renderChrome(parseHash().path);
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
