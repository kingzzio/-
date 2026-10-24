// Boro, the AI study coach: streaming chat with hint/explain/quiz modes and homework photos.
import { state, save, addXp } from "../store.js";
import { esc, md, toast, aiAvailable, streamTutor, readImage, celebrateBadges } from "../ui.js";
import { getTopic, getExam } from "../content.js";

const MODES = [
  ["hint", "💡 Hint", "Nudges, not answers"],
  ["explain", "📖 Explain", "Step-by-step"],
  ["quiz", "❓ Quiz me", "Practice Qs"],
];

const STARTERS = [
  "How do I find the slope from two points?",
  "Give me a 2-week SHSAT study plan",
  "What's the difference between mitosis and meiosis?",
  "How do I write a strong thesis for the ELA Regents?",
  "Quiz me on Algebra I Regents functions",
  "Explain the Enlightenment like I'm 13",
];

let chat = []; // kept in memory for the session; cleared on reload

export default function tutor(root, _p, query) {
  const topic = getTopic(query.topic);
  const exam = getExam(query.exam || state.profile.exam);
  let mode = sessionStorage.getItem("brainboro:mode") || "explain";
  let image = null;
  let controller = null;

  root.className = "main chat-page";
  root.innerHTML = `
    <div class="chat-head">
      <div class="boro">🤖</div>
      <div class="grow"><h1>Boro</h1><p class="small muted">Your AI study coach${exam ? ` • ${esc(exam.name)}` : ""}${topic ? ` • ${esc(topic.name)}` : ""}</p></div>
      <button class="btn ghost small" id="clear" title="New chat">🧹</button>
    </div>
    <div class="modes" role="radiogroup" aria-label="Tutor mode">${MODES.map(([id, label, sub]) => `<button class="mode ${mode === id ? "on" : ""}" data-mode="${id}" role="radio" aria-checked="${mode === id}"><strong>${label}</strong><small>${sub}</small></button>`).join("")}</div>
    <div class="chat-log" id="log" aria-live="polite"></div>
    <div id="offline"></div>
    <form class="composer" id="form">
      <div id="preview"></div>
      <div class="composer-row">
        <label class="icon-btn" title="Add a photo of your homework"><input type="file" accept="image/*" id="file" hidden>📷</label>
        <textarea id="msg" rows="1" maxlength="4000" placeholder="Ask anything… or snap your homework 📷"></textarea>
        <button class="send" id="send" aria-label="Send">➤</button>
      </div>
      <p class="tiny muted">Boro can make mistakes — double-check important facts. Don't share personal info.</p>
    </form>`;

  const log = root.querySelector("#log");
  const msg = root.querySelector("#msg");
  const sendBtn = root.querySelector("#send");

  const drawLog = () => {
    if (!chat.length) {
      log.innerHTML = `<div class="chat-empty"><p>Hey ${esc(state.profile.name || "there")}! I can explain concepts, check your work, quiz you, or make a study plan. Try:</p>
        <div class="starters">${STARTERS.map((s) => `<button class="starter">${esc(s)}</button>`).join("")}</div></div>`;
      log.querySelectorAll(".starter").forEach((b) => (b.onclick = () => send(b.textContent)));
      return;
    }
    log.innerHTML = chat
      .map((m) => `<div class="bubble ${m.role}">${m.image ? `<img src="${m.image.preview}" alt="Homework photo">` : ""}${m.role === "assistant" ? md(m.text || "…") : `<p>${esc(m.text).replace(/\n/g, "<br>")}</p>`}</div>`)
      .join("");
    log.scrollTop = log.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
  };

  const send = async (text) => {
    text = (text ?? msg.value).trim();
    if ((!text && !image) || controller) return;
    if (!(await aiAvailable())) {
      root.querySelector("#offline").innerHTML = offlineNote();
      return;
    }
    chat.push({ role: "user", text: text || "Can you help me with this problem?", image });
    msg.value = "";
    image = null;
    root.querySelector("#preview").innerHTML = "";
    const reply = { role: "assistant", text: "" };
    chat.push(reply);
    drawLog();
    controller = new AbortController();
    sendBtn.disabled = true;
    try {
      await streamTutor(
        {
          mode,
          topic: topic ? `${topic.name} (${topic.course})` : undefined,
          exam: exam?.name,
          grade: state.profile.grade,
          // Only the latest photo is re-sent, to keep requests small.
          messages: chat.slice(0, -1).map((m, n, arr) => ({ role: m.role, text: m.text, image: n === arr.length - 1 ? m.image : undefined })),
        },
        (soFar) => {
          reply.text = soFar;
          const last = log.lastElementChild;
          if (last) last.innerHTML = md(soFar);
          log.scrollTop = log.scrollHeight;
        },
        controller.signal,
      );
      state.stats.aiChats++;
      celebrateBadges(addXp(3));
      save();
    } catch (err) {
      reply.text = `⚠️ ${err.message}`;
      if (err.name !== "AbortError") toast(err.message, { emoji: "⚠️" });
    } finally {
      controller = null;
      sendBtn.disabled = false;
      drawLog();
    }
  };

  root.querySelectorAll("[data-mode]").forEach(
    (b) =>
      (b.onclick = () => {
        mode = b.dataset.mode;
        sessionStorage.setItem("brainboro:mode", mode);
        root.querySelectorAll("[data-mode]").forEach((x) => {
          x.classList.toggle("on", x === b);
          x.setAttribute("aria-checked", x === b);
        });
      }),
  );
  root.querySelector("#clear").onclick = () => {
    controller?.abort();
    chat = [];
    drawLog();
  };
  root.querySelector("#form").onsubmit = (e) => {
    e.preventDefault();
    send();
  };
  msg.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
  msg.addEventListener("input", () => {
    msg.style.height = "auto";
    msg.style.height = `${Math.min(160, msg.scrollHeight)}px`;
  });
  root.querySelector("#file").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      image = await readImage(file);
      root.querySelector("#preview").innerHTML = `<div class="preview"><img src="${image.preview}" alt="Selected photo"><button type="button" id="rm" aria-label="Remove photo">✕</button></div>`;
      root.querySelector("#rm").onclick = () => ((image = null), (root.querySelector("#preview").innerHTML = ""));
    } catch (err) {
      toast(err.message, { emoji: "⚠️" });
    }
  };

  drawLog();
  aiAvailable().then((ok) => {
    if (!ok) root.querySelector("#offline").innerHTML = offlineNote();
  });

  // A question handed over from a quiz ("Explain with Boro").
  const handoff = sessionStorage.getItem("brainboro:ask");
  if (handoff) {
    sessionStorage.removeItem("brainboro:ask");
    const { text } = JSON.parse(handoff);
    mode = "explain";
    send(text);
  } else msg.focus();

  return () => {
    controller?.abort();
    root.className = "main";
  };
}

function offlineNote() {
  return `<div class="card warn"><strong>🔌 Boro isn't connected on this site yet.</strong>
    <p class="small">The AI tutor needs the site owner to add an Anthropic API key on the server (see the README). Everything else — flashcards, quizzes, timed tests, battles — works without it!</p></div>`;
}
