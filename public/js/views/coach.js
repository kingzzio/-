// Screen Coach: share your screen while doing IXL / DeltaMath / Khan homework and Boro works through
// each problem with you, looking again whenever the screen changes. It guides; you do the answering.
import { state, save, addXp, isPremium } from "../store.js";
import { esc, md, toast, aiAvailable, streamTutor, celebrateBadges } from "../ui.js";
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

export default function coach(root) {
  const canShare = Boolean(navigator.mediaDevices?.getDisplayMedia);
  let stream = null, video = null, grabber = null, stopTick = null, pip = null;
  let chat = [], busy = false, controller = null;
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
        : `<div class="card warn" style="margin-top:14px"><strong>Screen sharing works on a laptop or Chromebook</strong><p class="small">Open BrainBoro in Chrome or Edge on a computer. On a phone, screenshot the problem and send it to Boro or Snap & Answer instead.</p><div class="btn-row"><a class="btn small" href="#/answer">Snap & Answer</a><a class="btn small ghost" href="#/tutor">Ask Boro</a></div></div>`}
      <p class="tiny muted center" style="margin-top:12px">Boro only sees what you share, only while you share it, and nothing is saved. It won't fill in answers or play live games for you, so you actually learn it (and don't get flagged).</p>`;
    root.querySelector("#share")?.addEventListener("click", start);
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
    } catch (err) {
      reply.text = `⚠️ ${err.message}`;
      if (err.status === 429) {
        auto = false;
        drawControls();
      }
    } finally {
      busy = false;
      controller = null;
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
        <div class="coach-head"><span class="boro">🤖</span><span class="grow"><strong>Screen Coach</strong><small class="muted"><span class="live-dot"></span> Watching your screen</small></span><button class="btn small ghost" id="stop">Stop</button></div>
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
      look(text); // every message includes a fresh look at the screen
    };
  };

  const drawControls = () => {
    const box = panelEl()?.querySelector(".coach-controls");
    if (!box) return;
    box.innerHTML = `
      <button class="btn small" id="lookbtn">${icon("eye", 16)} Look at my screen</button>
      <button class="btn small ghost" id="hint">I'm stuck</button>
      <button class="chip ${auto ? "on" : ""}" id="auto">${auto ? "Auto-follow on" : "Auto-follow off"}</button>
      ${"documentPictureInPicture" in window && !pip ? `<button class="chip" id="pop">Pop out ↗</button>` : ""}`;
    box.querySelector("#lookbtn").onclick = () => look("Look at my screen now.");
    box.querySelector("#hint").onclick = () => look("I'm stuck on this step. Give me a smaller hint (not the answer).");
    box.querySelector("#auto").onclick = () => {
      auto = !auto;
      drawControls();
    };
    box.querySelector("#pop")?.addEventListener("click", popOut);
  };

  const drawLog = () => {
    const log = panelEl()?.querySelector(".coach-log");
    if (!log) return;
    log.innerHTML = chat
      .filter((m) => !(m.role === "user" && m.auto))
      .map((m) => (m.role === "assistant" ? `<div class="bubble assistant">${md(m.text || "👀 Looking…")}</div>` : `<div class="bubble user"><p>${esc(m.text)}</p></div>`))
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

  intro();
  return stop;
}
