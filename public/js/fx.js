// Feel-good effects: tiny synthesized sounds (no audio files), haptics, the level-up celebration,
// and accessibility settings (text size, readable font, reduced motion).
import { state, levelName } from "./store.js";
import { confetti, toast } from "./ui.js";

let ctx;
function tone(freqs, { dur = 0.12, type = "sine", gap = 0.07, vol = 0.08 } = {}) {
  if (!state.settings.sound) return;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    const t0 = ctx.currentTime;
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type;
      o.frequency.value = f;
      const s = t0 + i * gap;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(vol, s + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, s + dur);
      o.connect(g).connect(ctx.destination);
      o.start(s);
      o.stop(s + dur + 0.02);
    });
  } catch {
    /* no audio */
  }
}
const buzz = (ms) => state.settings.haptics && navigator.vibrate?.(ms);

export const sfx = {
  right: () => (tone([660, 880], { dur: 0.14 }), buzz(15)),
  wrong: () => (tone([220, 180], { type: "triangle", dur: 0.16, vol: 0.06 }), buzz([30, 40, 30])),
  coin: () => tone([988, 1319], { dur: 0.1, gap: 0.06, type: "square", vol: 0.04 }),
  levelUp: () => (tone([523, 659, 784, 1047], { dur: 0.22, gap: 0.11 }), buzz([20, 60, 20, 60, 40])),
  tap: () => buzz(8),
  hit: () => (tone([150, 110], { type: "sawtooth", dur: 0.12, vol: 0.05 }), buzz(25)),
};

addEventListener("bb:answer", (e) => (e.detail.ok ? sfx.right() : sfx.wrong()));
addEventListener("bb:freeze", () => toast("🧊 A streak freeze saved your streak!", { emoji: "🧊", ms: 4000 }));
addEventListener("bb:levelup", (e) => {
  sfx.levelUp();
  const lv = e.detail.lv;
  const el = document.createElement("div");
  el.className = "levelup";
  el.innerHTML = `<div class="levelup-card"><div class="lu-burst">⚡</div><p class="lu-small">LEVEL UP</p><div class="lu-num">${lv}</div><p class="lu-name">${levelName(lv)}</p><p class="small muted">+25 coins</p></div>`;
  document.body.append(el);
  state.coins += 25;
  confetti(140);
  const close = () => el.remove();
  el.onclick = close;
  setTimeout(close, 2600);
});

/** Applies text size, readable font and reduced motion settings to the page. */
export function applySettings() {
  const s = state.settings;
  const root = document.documentElement;
  root.dataset.text = s.textSize || "m";
  root.classList.toggle("readable", Boolean(s.readable));
  root.classList.toggle("reduce-motion", Boolean(s.reduceMotion));
  if (s.accent) root.style.setProperty("--brand", s.accent);
  else root.style.removeProperty("--brand");
}

/** Reads text out loud (questions, Boro replies). */
export function speak(text) {
  if (!("speechSynthesis" in window)) return toast("Read-aloud isn't supported on this browser.", { emoji: "🔇" });
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(text).replace(/[*_`#>]/g, "").slice(0, 1200));
  u.rate = 0.98;
  speechSynthesis.speak(u);
}
