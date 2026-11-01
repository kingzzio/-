// Screen Coach: share your screen while doing IXL / DeltaMath / Khan homework and Boro works through
// each problem with you, looking again whenever the screen changes. It guides; you do the answering.
import { state, save, addXp, isPremium } from "../store.js";
import { esc, md, toast, aiAvailable, streamTutor, celebrateBadges, readImage } from "../ui.js";
import { icon } from "../icons.js";

const MAX_SIDE = 1400;
const AUTO_GAP_MS = 12000; // at most one automatic look every 12 seconds
const FREE_AUTO_LOOKS = 40; // per session for free accounts (Premium: unlimited)

// Background tabs throttle setInterval, but a worker's timer keeps ticking while you're on another tab.
function ticker(ms, fn) {
  try {
    const w = new Worker(URL.createObjectURL(new Blob([`setInterval(() => postMessage(0), ${ms})`], { type: "text/javascript" })));
    w.onmessage = fn;
    return () => w.terminate();
  } catch {
    const id = setInterval(fn, ms);
    return () => clearInterval(id);
  }
}

// Reads Boro's replies out loud, so you can keep your eyes on the homework.
const speakable = (text) => text.replace(/[*_`#>]/g, "").replace(/\s+/g, " ").trim();
function speak(text) {
  if (!("speechSynthesis" in window) || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(speakable(text));
  u.rate = 1.05;
  speechSynthesis.speak(u);
}

// Phones can't share their screen with a web page, so on phones you send screenshots instead.
// The chat is kept in sessionStorage so it survives switching to the homework app and back.
const CHAT_KEY = "brainboro:coach";
const loadChat = () => {
  try {
    return JSON.parse(sessionStorage.getItem(CHAT_KEY) || "[]");
  } catch {
    return [];
  }
};
const saveChat = (chat) => {
  try {
    sessionStorage.setItem(CHAT_KEY, JSON.stringify(chat.slice(-30).map(({ role, text, auto }) => ({ role, text, auto }))));
  } catch {
    /* private mode */
  }
};

export default function coach(root) {
  const canShare = Boolean(navigator.mediaDevices?.getDisplayMedia);
  let stream = null, video = null, grabber = null, stopTick = null, pip = null;
  let chat = [], busy = false, controller = null, phone = false;
  let voice = Boolean(state.coachVoice);
  let auto = true, autoLooks = 0, lastAuto = 0, lastSig = null, pendingSig = null;

  const intro = () => {
    root.innerHTML = `
      <a class="back" href="#/tutor">${icon("back", 18)} Boro</a>
      <h1 class="page-title">Screen Coach</h1>
      <p class="lead">Share your screen while you do IXL, DeltaMath, Khan Academy or any homework site. Boro watches along and works through each problem <strong>with</strong> you: the first step, a hint when you're stuck, and a check of your answer.</p>
      <div class="card">
        <div class="coach-steps">
          <div><span class="coach-n">1</span><span>Open your homework in another tab.</span></div>
          <div><span class="coach-n">2</span><span>Tap <strong>Share my screen</strong> and pick that tab.</span></div>
          <div><span class="coach-n">3</span><span>Tap <strong>Pop out</strong> so Boro floats on top while you work.</span></div>
        </div>
      </div>
      ${canShare
        ? `<button class="btn big" id="share" style="margin-top:14px">${icon("eye", 20)} Share my screen</button>`
        : `<div class="card" style="margin-top:14px"><strong>📱 On a phone? Use screenshots</strong>
            <div class="coach-steps" style="margin-top:10px">
              <div><span class="coach-n">1</span><span>In your homework app, take a screenshot (iPhone: side button + volume up. Android: power + volume down).</span></div>
              <div><span class="coach-n">2</span><span>Swipe back to BrainBoro and tap <strong>Add screenshot</strong>. Boro picks up right where you left off.</span></div>
              <div><span class="coach-n">3</span><span>Turn on <strong>🔊 Talk</strong> and Boro reads each step out loud.</span></div>
            </div>
            <button class="btn big" id="phone" style="margin-top:12px">${icon("camera", 20)} Start coaching</button>
            <p class="tiny muted" style="margin:8px 0 0">Live screen sharing works on a laptop or Chromebook in Chrome or Edge.</p></div>`}
      <p class="tiny muted center" style="margin-top:12px">Boro only sees what you share, only while you share it, and nothing is saved. It won't fill in answers or play live games for you, so you actually learn it (and don't get flagged).</p>`;
    root.querySelector("#share")?.addEventListener("click", start);
    root.querySelector("#phone")?.addEventListener("click", startPhone);
  };

  const startPhone = async () => {
    if (!(await aiAvailable())) return toast("AI isn't switched on for this site yet.", { emoji: "🔌" });
    phone = true;
    chat = loadChat();
    drawPanel();
  };

  const start = async () => {
    if (!(await aiAvailable())) return toast("AI isn't switched on for this site yet.", { emoji: "🔌" });
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "browser", frameRate: 2 }, audio: false, selfBrowserSurface: "exclude", surfaceSwitching: "include" });
    } catch {
      return toast("Screen sharing was cancelled.", { emoji: "🙈" });
    }
    const track = stream.getVideoTracks()[0];
    track.onended = stop;
    grabber = "ImageCapture" in window ? new ImageCapture(track) : null;
    video = Object.assign(document.createElement("video"), { muted: true, playsInline: true, srcObject: stream });
    await video.play().catch(() => {});
    chat = [];
    autoLooks = 0;
    lastSig = null;
    drawPanel();
    look("Here's my screen. Help me with the problem I'm on.");
    stopTick = ticker(3000, watch);
  };

  const stop = () => {
    stopTick?.();
    stopTick = null;
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    controller?.abort();
    pip?.close();
    if (phone) {
      phone = false;
      chat = [];
      saveChat(chat);
    }
    if (location.hash.startsWith("#/coach")) intro();
  };

  // Grabs the current frame as a canvas (ImageCapture works even when this tab is in the background).
  const frame = async () => {
    let src = video;
    if (grabber) src = await grabber.grabFrame().catch(() => video);
    const w = src.width || src.videoWidth, h = src.height || src.videoHeight;
    if (!w || !h) return null;
    const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
    const c = document.createElement("canvas");
    c.width = Math.round(w * scale);
    c.height = Math.round(h * scale);
    c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
    return c;
  };

  // A tiny 16×9 grayscale fingerprint, to notice when the page changes (a new question, feedback…).
  const signature = (canvas) => {
    const s = document.createElement("canvas");
    s.width = 16;
    s.height = 9;
    const g = s.getContext("2d", { willReadFrequently: true });
    g.drawImage(canvas, 0, 0, 16, 9);
    const px = g.getImageData(0, 0, 16, 9).data;
    const out = [];
    for (let i = 0; i < px.length; i += 4) out.push((px[i] + px[i + 1] + px[i + 2]) / 3);
    return out;
  };
  const changed = (a, b) => !a || !b || a.reduce((n, v, i) => n + (Math.abs(v - b[i]) > 18 ? 1 : 0), 0) >= 6;

  const watch = async () => {
    if (!stream || !auto || busy) return;
    const c = await frame();
    if (!c) return;
    const sig = signature(c);
    // Wait until the screen has changed AND settled (same for two ticks) before looking.
    if (!changed(sig, lastSig)) return (pendingSig = null);
    if (!pendingSig || changed(sig, pendingSig)) return (pendingSig = sig);
    if (Date.now() - lastAuto < AUTO_GAP_MS) return;
    if (!isPremium() && autoLooks >= FREE_AUTO_LOOKS) {
      auto = false;
      drawControls();
      return toast("Auto-follow paused (free limit). Tap Look at my screen anytime, or go Premium for unlimited.", { emoji: "👑", ms: 5000 });
    }
    autoLooks++;
    lastAuto = Date.now();
    look("(My screen changed.)", c, sig);
  };

  const look = async (text, canvas, sig) => {
    if (busy) return;
    canvas ||= await frame();
    if (!canvas) return toast("Couldn't see your screen yet. Try again in a second.", { emoji: "👀" });
    lastSig = sig || signature(canvas);
    pendingSig = null;
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    send(text, { mediaType: "image/jpeg", data: dataUrl.split(",")[1] });
  };

  const send = async (text, image) => {
    if (busy || (!text && !image)) return;
    busy = true;
    chat.push({ role: "user", text, image, auto: text.startsWith("(") });
    const reply = { role: "assistant", text: "" };
    chat.push(reply);
    drawLog();
    controller = new AbortController();
    try {
      // Send the recent conversation; only the newest screenshot rides along, to keep it fast.
      const recent = chat.slice(-17, -1);
      while (recent.length && recent[0].role !== "user") recent.shift();
      const lastImg = recent.map((m) => Boolean(m.image)).lastIndexOf(true);
      await streamTutor(
        { mode: "coach", grade: state.profile.grade, messages: recent.map((m, i) => ({ role: m.role, text: m.text, image: i === lastImg ? m.image : undefined })) },
        (soFar) => {
          reply.text = soFar;
          const el = panelEl()?.querySelector(".coach-log .bubble.assistant:last-child");
          if (el) el.innerHTML = md(soFar);
          scrollLog();
        },
        controller.signal,
      );
      state.stats.aiChats++;
      celebrateBadges(addXp(2));
      save();
      if (voice) speak(reply.text);
    } catch (err) {
      reply.text = `⚠️ ${err.message}`;
      if (err.status === 429) {
        auto = false;
        drawControls();
      }
    } finally {
      busy = false;
      controller = null;
      if (phone) saveChat(chat);
      drawLog();
    }
  };

  // ---- UI (the panel can move into a floating Picture-in-Picture window) ----
  const panelEl = () => (pip ? pip.document : document).querySelector("#coach-panel");
  const scrollLog = () => {
    const log = panelEl()?.querySelector(".coach-log");
    if (log) log.scrollTop = log.scrollHeight;
  };

  const drawPanel = () => {
    root.innerHTML = `
      <div id="coach-panel" class="coach-panel">
        <div class="coach-head"><span class="boro">🤖</span><span class="grow"><strong>Screen Coach</strong><small class="muted">${phone ? "Send a screenshot anytime" : `<span class="live-dot"></span> Watching your screen`}</small></span><button class="btn small ghost" id="stop">${phone ? "New chat" : "Stop"}</button></div>
        <div class="coach-log" aria-live="polite"></div>
        <div class="coach-controls"></div>
        <form class="composer-row coach-compose"><input id="say" placeholder="Tell Boro your answer or ask…" autocomplete="off" style="flex:1;min-width:0;border:0;background:transparent;padding:9px 8px;outline:none"><button class="send" aria-label="Send">${icon("send", 18)}</button></form>
      </div>`;
    wire();
    drawControls();
    drawLog();
  };

  const wire = () => {
    const p = panelEl();
    p.querySelector("#stop").onclick = stop;
    p.querySelector("form").onsubmit = (e) => {
      e.preventDefault();
      const input = p.querySelector("#say");
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      if (phone) send(text);
      else look(text); // every message includes a fresh look at the screen
    };
  };

  const drawControls = () => {
    const box = panelEl()?.querySelector(".coach-controls");
    if (!box) return;
    const talk = "speechSynthesis" in window ? `<button class="chip ${voice ? "on" : ""}" id="talk">${voice ? "🔊 Talk on" : "🔈 Talk off"}</button>` : "";
    if (phone) {
      box.innerHTML = `
        <label class="btn small" style="cursor:pointer"><input type="file" accept="image/*" id="shot" hidden>${icon("camera", 16)} Add screenshot</label>
        <button class="btn small ghost" id="hint">I'm stuck</button>
        ${talk}`;
      box.querySelector("#shot").onchange = async (e) => {
        const f = e.target.files[0];
        e.target.value = "";
        if (!f) return;
        try {
          const img = await readImage(f, MAX_SIDE);
          send(chat.length ? "Here's my screen now." : "Here's my homework. Help me with the problem I'm on.", { mediaType: img.mediaType, data: img.data });
        } catch (err) {
          toast(err.message, { emoji: "⚠️" });
        }
      };
      box.querySelector("#hint").onclick = () => send("I'm stuck on this step. Give me a smaller hint (not the answer).");
      wireTalk(box);
      return;
    }
    box.innerHTML = `
      <button class="btn small" id="lookbtn">${icon("eye", 16)} Look at my screen</button>
      <button class="btn small ghost" id="hint">I'm stuck</button>
      <button class="chip ${auto ? "on" : ""}" id="auto">${auto ? "Auto-follow on" : "Auto-follow off"}</button>
      ${talk}
      ${"documentPictureInPicture" in window && !pip ? `<button class="chip" id="pop">Pop out ↗</button>` : ""}`;
    wireTalk(box);
    box.querySelector("#lookbtn").onclick = () => look("Look at my screen now.");
    box.querySelector("#hint").onclick = () => look("I'm stuck on this step. Give me a smaller hint (not the answer).");
    box.querySelector("#auto").onclick = () => {
      auto = !auto;
      drawControls();
    };
    box.querySelector("#pop")?.addEventListener("click", popOut);
  };

  const wireTalk = (box) => {
    const b = box.querySelector("#talk");
    if (!b) return;
    b.onclick = () => {
      voice = !voice;
      state.coachVoice = voice;
      save();
      // Speaking once from a tap unlocks speech on iPhone for the later replies.
      if (voice) speak("Okay, I'll read my answers out loud.");
      else speechSynthesis.cancel();
      drawControls();
    };
  };

  const drawLog = () => {
    const log = panelEl()?.querySelector(".coach-log");
    if (!log) return;
    if (!chat.length && phone) {
      log.innerHTML = `<div class="chat-empty"><p>Take a screenshot of the problem you're on, then tap <strong>Add screenshot</strong>. I'll work through it with you one step at a time.</p></div>`;
      return;
    }
    log.innerHTML = chat
      .filter((m) => !(m.role === "user" && m.auto))
      .map((m) => (m.role === "assistant" ? `<div class="bubble assistant">${md(m.text || "👀 Looking…")}</div>` : `<div class="bubble user">${m.image && phone ? `<img src="data:${m.image.mediaType};base64,${m.image.data}" alt="Your screenshot" style="max-height:160px;border-radius:10px">` : ""}<p>${esc(m.text)}</p></div>`))
      .join("");
    scrollLog();
  };

  // Floating window that stays on top of IXL / DeltaMath (Chrome & Edge on computers).
  const popOut = async () => {
    try {
      pip = await window.documentPictureInPicture.requestWindow({ width: 380, height: 560 });
    } catch {
      return toast("Couldn't pop out here. Put this tab side by side with your homework.", { emoji: "🪟" });
    }
    for (const sheet of document.querySelectorAll('link[rel="stylesheet"], style')) pip.document.head.append(sheet.cloneNode(true));
    pip.document.documentElement.dataset.theme = document.documentElement.dataset.theme || "";
    pip.document.body.className = "pip-body";
    pip.document.body.append(document.querySelector("#coach-panel"));
    root.innerHTML = `<div class="empty"><div class="big-emoji">🪟</div><h2>Boro popped out</h2><p class="muted">Keep working on your homework. Close the little window to bring Boro back here.</p></div>`;
    drawControls();
    pip.addEventListener("pagehide", () => {
      const panel = pip.document.querySelector("#coach-panel");
      pip = null;
      if (stream && panel && location.hash.startsWith("#/coach")) {
        root.innerHTML = "";
        root.append(panel);
        drawControls();
        scrollLog();
      }
    });
  };

  // Coming back from the homework app with a chat in progress: pick up where you left off.
  if (!canShare && loadChat().length) startPhone();
  else intro();
  return () => {
    stopTick?.();
    stream?.getTracks().forEach((t) => t.stop());
    controller?.abort();
    pip?.close();
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  };
}
