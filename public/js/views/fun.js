// Fun stuff: Boro the pet, the coin shop, boss battles and the focus timer.
import { state, save, addXp, level, recordAnswer, xpToday, streakAlive, todayKey } from "../store.js";
import { esc, toast, confetti } from "../ui.js";
import { icon } from "../icons.js";
import { getTopic, buildQuiz } from "../content.js";
import { sfx } from "../fx.js";

// ---------- Pet ----------
const STAGES = [[1, "🥚", "Egg"], [3, "🐣", "Hatchling"], [6, "🐥", "Chick"], [10, "🦉", "Owl"], [15, "🦅", "Sky Scholar"]];
export const OUTFITS = [
  { id: "cap", emoji: "🧢", name: "Cap", cost: 40 },
  { id: "grad", emoji: "🎓", name: "Grad cap", cost: 80 },
  { id: "crown", emoji: "👑", name: "Crown", cost: 200 },
  { id: "shades", emoji: "🕶️", name: "Shades", cost: 60 },
  { id: "bow", emoji: "🎀", name: "Bow", cost: 50 },
  { id: "headphones", emoji: "🎧", name: "Headphones", cost: 70 },
];
export const ACCENTS = [
  { id: "ocean", color: "#0ea5e9", name: "Ocean", cost: 80 },
  { id: "mint", color: "#10b981", name: "Mint", cost: 80 },
  { id: "sunset", color: "#f97316", name: "Sunset", cost: 80 },
  { id: "rose", color: "#e11d48", name: "Rose", cost: 80 },
];
export function petLook() {
  const lv = level();
  const stage = [...STAGES].reverse().find(([min]) => lv >= min) || STAGES[0];
  const fed = state.pet.fedOn === todayKey();
  const mood = !streakAlive() && state.streak.count > 0 ? ["😢", "misses you"] : xpToday() >= state.goal.daily || fed ? ["😄", "is so happy"] : xpToday() > 0 ? ["🙂", "is having a good day"] : ["😴", "is waiting for you"];
  const outfit = OUTFITS.find((o) => o.id === state.pet.outfit);
  return { emoji: stage[1], stage: stage[2], mood, outfit };
}
const CHEERS = ["You've got this! 💪", "One more question?", "Big brain energy 🧠", "I believe in you!", "Let's beat yesterday!", "Streaks look good on you 🔥"];
export function petCard() {
  const p = petLook();
  return `<a class="card pet-card" href="#/pet"><span class="pet-av">${p.emoji}${p.outfit ? `<i class="pet-hat">${p.outfit.emoji}</i>` : ""}</span><span class="grow"><strong>${esc(state.pet.name)} ${p.mood[1]} ${p.mood[0]}</strong><small>${p.stage} · 🪙 ${state.coins} coins</small></span><span class="chev">${icon("chevron")}</span></a>`;
}

export function petView(root) {
  const draw = () => {
    const p = petLook();
    const owned = new Set(state.owned);
    root.innerHTML = `
      <a class="back" href="#/">${icon("back", 18)} Home</a>
      <div class="pet-stage">
        <button class="pet-big" id="pet" aria-label="Pet ${esc(state.pet.name)}">${p.emoji}${p.outfit ? `<i class="pet-hat big">${p.outfit.emoji}</i>` : ""}</button>
        <h1 class="page-title center" id="nm">${esc(state.pet.name)}</h1>
        <p class="center muted">${p.stage} · ${p.mood[0]} ${esc(state.pet.name)} ${p.mood[1]}</p>
        <p class="center" id="say"></p>
        <div class="btn-row" style="justify-content:center"><button class="btn" id="feed" ${state.pet.fedOn === todayKey() ? "disabled" : ""}>🍎 Feed (5 coins)</button><button class="btn ghost" id="rename">✏️ Rename</button></div>
        <p class="tiny muted center">Your pet grows as you level up: 🥚 → 🐣 (Lv 3) → 🐥 (Lv 6) → 🦉 (Lv 10) → 🦅 (Lv 15)</p>
      </div>
      <section class="section"><div class="section-head"><h2>🪙 Shop</h2><span class="tag">${state.coins} coins</span></div>
        <div class="card"><strong>🧊 Streak freeze</strong><p class="small muted">Miss a day without losing your streak. You have ${state.freezes}.</p><button class="btn small" data-buy="freeze">Buy for 60</button></div>
        <h3 class="mini-head">Outfits</h3>
        <div class="shop-grid">${OUTFITS.map((o) => `<button class="shop-item ${state.pet.outfit === o.id ? "on" : ""}" data-outfit="${o.id}"><span>${o.emoji}</span><strong>${o.name}</strong><small>${owned.has(o.id) ? (state.pet.outfit === o.id ? "Wearing" : "Wear") : `🪙 ${o.cost}`}</small></button>`).join("")}</div>
        <h3 class="mini-head">App colors</h3>
        <div class="shop-grid">${[{ id: "", color: "#6d4aff", name: "Classic", cost: 0 }, ...ACCENTS].map((a) => `<button class="shop-item ${state.settings.accent === (a.id ? a.color : "") ? "on" : ""}" data-accent="${a.id}"><span class="swatch" style="background:${a.color}"></span><strong>${a.name}</strong><small>${!a.id || owned.has(a.id) ? "Use" : `🪙 ${a.cost}`}</small></button>`).join("")}</div>
        <p class="tiny muted">Earn coins: 1 for every 10 XP, a treasure chest for daily quests, and 25 for every level up.</p>
      </section>`;
    root.querySelector("#pet").onclick = (e) => {
      e.currentTarget.classList.remove("boing");
      void e.currentTarget.offsetWidth;
      e.currentTarget.classList.add("boing");
      root.querySelector("#say").textContent = CHEERS[Math.floor(Math.random() * CHEERS.length)];
      sfx.tap();
    };
    root.querySelector("#feed").onclick = () => {
      if (!spend(5)) return;
      state.pet.fedOn = todayKey();
      save();
      toast(`${state.pet.name} loved that! 🍎`, { emoji: "😄" });
      draw();
    };
    root.querySelector("#rename").onclick = () => {
      const n = prompt("Name your pet:", state.pet.name);
      if (n && n.trim()) {
        state.pet.name = n.trim().slice(0, 16);
        save();
        draw();
      }
    };
    root.querySelector('[data-buy="freeze"]').onclick = () => {
      if (!spend(60)) return;
      state.freezes++;
      save();
      toast("Streak freeze ready 🧊", { emoji: "🧊" });
      draw();
    };
    root.querySelectorAll("[data-outfit]").forEach((b) => (b.onclick = () => {
      const o = OUTFITS.find((x) => x.id === b.dataset.outfit);
      if (!state.owned.includes(o.id)) {
        if (!spend(o.cost)) return;
        state.owned.push(o.id);
      }
      state.pet.outfit = state.pet.outfit === o.id ? "" : o.id;
      save();
      draw();
    }));
    root.querySelectorAll("[data-accent]").forEach((b) => (b.onclick = () => {
      const a = ACCENTS.find((x) => x.id === b.dataset.accent);
      if (a && !state.owned.includes(a.id)) {
        if (!spend(a.cost)) return;
        state.owned.push(a.id);
      }
      state.settings.accent = a ? a.color : "";
      save();
      dispatchEvent(new Event("brainboro:settings"));
      draw();
    }));
  };
  draw();
}
function spend(n) {
  if (state.coins < n) {
    toast(`You need ${n - state.coins} more coins. Keep studying!`, { emoji: "🪙" });
    return false;
  }
  state.coins -= n;
  sfx.coin();
  return true;
}

// ---------- Boss battle ----------
const BOSSES = ["🐉", "👹", "🦖", "🤖", "👾", "🧌", "🦑"];
export function bossView(root, { id }) {
  const t = getTopic(id);
  if (!t) return (location.hash = "#/explore");
  const boss = BOSSES[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % BOSSES.length];
  let hp = 100, hearts = 3, combo = 0, q = null, n = 0;
  const qs = buildQuiz([id], 40);
  if (!qs.length) return (root.innerHTML = `<div class="empty"><h2>No questions here yet</h2><a class="btn" href="#/topic/${id}">Back</a></div>`);
  const draw = (hit) => {
    q = qs[n++ % qs.length];
    root.innerHTML = `
      <div class="study-top"><a class="back" href="#/topic/${id}" aria-label="Quit">✕</a><span class="grow small muted">${esc(t.name)} boss</span><span class="hearts">${"❤️".repeat(hearts)}${"🖤".repeat(3 - hearts)}</span></div>
      <div class="boss ${hit || ""}"><div class="boss-em">${boss}</div><div class="bar boss-hp"><div class="bar-fill" style="width:${hp}%"></div></div><small>${hp} HP${combo >= 2 ? ` · 🔥 combo ×${combo}` : ""}</small></div>
      <div class="question"><p class="q-text">${esc(q.q).replace(/\n/g, "<br>")}</p>
      <div class="choices">${q.choices.map((c, k) => `<button class="choice" data-k="${k}"><span class="letter">${"ABCD"[k]}</span><span>${esc(c)}</span></button>`).join("")}</div></div>`;
    root.querySelectorAll(".choice").forEach((b) => (b.onclick = () => answer(Number(b.dataset.k))));
  };
  const answer = (k) => {
    const ok = recordAnswer(q, k);
    root.querySelectorAll(".choice").forEach((b, i) => {
      b.disabled = true;
      if (i === q.a) b.classList.add("right");
      else if (i === k) b.classList.add("wrong");
    });
    if (ok) {
      combo++;
      hp = Math.max(0, hp - (12 + Math.min(12, combo * 3)));
    } else {
      combo = 0;
      hearts--;
      sfx.hit();
    }
    setTimeout(() => {
      if (hp <= 0) return win();
      if (hearts <= 0) return lose();
      draw(ok ? "ouch" : "attack");
    }, ok ? 650 : 1300);
  };
  const win = () => {
    state.stats.bosses = (state.stats.bosses || 0) + 1;
    state.coins += 30;
    addXp(60);
    save();
    confetti(180);
    root.innerHTML = `<div class="empty"><div class="big-emoji">🏆</div><h2>You defeated the ${esc(t.name)} boss!</h2><p>+60 XP · +30 coins</p><div class="btn-row"><a class="btn" href="#/boss/${id}">Rematch</a><a class="btn ghost" href="#/topic/${id}">Done</a></div></div>`;
  };
  const lose = () => {
    root.innerHTML = `<div class="empty"><div class="big-emoji">${boss}</div><h2>The boss won this round</h2><p class="muted">It had ${hp} HP left. Review the topic and come back stronger!</p><div class="btn-row"><a class="btn" href="#/boss/${id}">Try again</a><a class="btn ghost" href="#/flash/${id}">Study flashcards</a></div></div>`;
  };
  draw();
}

// ---------- Focus timer ----------
let noise = null;
function brownNoise(on) {
  if (!on) {
    noise?.stop();
    noise = null;
    return;
  }
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const g = ctx.createGain();
    g.gain.value = 0.25;
    src.connect(g).connect(ctx.destination);
    src.start();
    noise = { stop: () => (src.stop(), ctx.close()) };
  } catch {
    /* no audio */
  }
}
export function focusView(root) {
  let mins = 25, left = 0, timer = null, running = false;
  const draw = () => {
    const total = mins * 60;
    const s = running ? left : total;
    const frac = running ? 1 - left / total : 0;
    root.innerHTML = `
      <a class="back" href="#/">${icon("back", 18)} Home</a>
      <h1 class="page-title center">🎧 Focus mode</h1>
      <div class="focus-ring" style="--p:${frac}"><div class="focus-time">${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}</div></div>
      ${running ? "" : `<div class="chip-row" style="justify-content:center">${[15, 25, 45].map((m) => `<button class="chip ${m === mins ? "on" : ""}" data-m="${m}">${m} min</button>`).join("")}</div>`}
      <div class="btn-row" style="justify-content:center"><button class="btn big" id="go">${running ? "Stop" : "Start focus"}</button><button class="chip ${noise ? "on" : ""}" id="nz">${noise ? "🌧️ Sound on" : "🌧️ Calm sound"}</button></div>
      <p class="center small muted">Put your phone face down. Finish a session for +40 XP.</p>`;
    root.querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => ((mins = Number(b.dataset.m)), draw())));
    root.querySelector("#nz").onclick = () => (brownNoise(!noise), draw());
    root.querySelector("#go").onclick = () => {
      if (running) {
        clearInterval(timer);
        running = false;
        return draw();
      }
      running = true;
      left = mins * 60;
      const end = Date.now() + left * 1000;
      timer = setInterval(() => {
        left = Math.max(0, Math.round((end - Date.now()) / 1000));
        const ring = root.querySelector(".focus-ring");
        if (ring) {
          ring.style.setProperty("--p", 1 - left / (mins * 60));
          ring.querySelector(".focus-time").textContent = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
        }
        if (left <= 0) {
          clearInterval(timer);
          running = false;
          state.stats.focus = (state.stats.focus || 0) + 1;
          addXp(40);
          save();
          confetti(100);
          sfx.levelUp();
          toast("Focus session done! +40 XP", { emoji: "🎧" });
          draw();
        }
      }, 1000);
      draw();
    };
  };
  draw();
  return () => {
    clearInterval(timer);
    brownNoise(false);
  };
}
