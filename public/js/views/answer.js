// Snap & Answer: photo (or typed) homework → answer + steps for every problem, Gauth-style.
import { state, save, addXp } from "../store.js";
import { esc, toast, post, readImage, aiAvailable, celebrateBadges } from "../ui.js";
import { icon } from "../icons.js";
import { board, openCheat } from "./cheats.js";
import { search } from "../content.js";

const SUBJECT_COLOR = { Math: "var(--c-math)", Science: "var(--c-sci)", ELA: "var(--c-ela)", History: "var(--c-hist)", Other: "var(--brand)" };

export default function answer(root, _p, query) {
  const pre = JSON.parse(sessionStorage.getItem("brainboro:solve") || "null");
  sessionStorage.removeItem("brainboro:solve");
  let image = null;
  let closePlayer = null;

  const drawStart = () => {
    const history = state.answers || [];
    root.innerHTML = `
      <h1 class="page-title">Snap & Answer</h1>
      <label class="snap" id="snap">
        <input type="file" accept="image/*" capture="environment" id="cam" hidden>
        <div id="shot" class="snap-inner">
          <div class="snap-frame"><span></span><span></span><span></span><span></span></div>
          <div class="snap-btn">${icon("camera", 30)}</div>
          <strong>Snap your homework</strong>
          <small>Math, science, history: we find every problem and answer it, step by step</small>
        </div>
      </label>
      <div class="btn-row"><label class="btn ghost" style="cursor:pointer"><input type="file" accept="image/*" id="up" hidden>${icon("folder", 18)} Upload photo</label></div>
      <div class="divider">or type it</div>
      <div class="composer-row"><textarea id="txt" rows="1" maxlength="2000" placeholder="e.g. What is 3% of 4%?" style="flex:1;min-width:0;border:0;background:transparent;resize:none;padding:9px 8px;outline:none">${esc(pre?.problem || "")}</textarea><button class="send" id="go" aria-label="Get answer">${icon("spark", 20)}</button></div>
      ${history.length ? `<section class="section"><div class="section-head"><h2>Recent</h2><button class="link" id="clear">Clear</button></div><div class="list">${history.slice(0, 12).map((h, i) => `<button class="row" data-h="${i}" style="width:100%;text-align:left"><span class="row-dot" style="--accent:${SUBJECT_COLOR[h.subject] || "var(--brand)"}"></span><span class="grow"><strong>${esc(h.question.slice(0, 80))}</strong><small>${esc(h.concept)} · ${esc(h.answer.slice(0, 40))}</small></span><span class="chev">${icon("chevron")}</span></button>`).join("")}</div></section>` : ""}`;
    const pick = async (f) => {
      if (!f) return;
      try {
        image = await readImage(f, 1600);
        run();
      } catch (err) {
        toast(err.message, { emoji: "⚠️" });
      }
    };
    root.querySelector("#cam").onchange = (e) => pick(e.target.files[0]);
    root.querySelector("#up").onchange = (e) => pick(e.target.files[0]);
    root.querySelector("#go").onclick = () => run();
    root.querySelector("#txt").onkeydown = (e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), run());
    root.querySelector("#clear")?.addEventListener("click", () => ((state.answers = []), save(), drawStart()));
    root.querySelectorAll("[data-h]").forEach((b) => (b.onclick = () => drawResults({ problems: [state.answers[Number(b.dataset.h)]] }, null)));
  };

  const run = async () => {
    const text = root.querySelector("#txt")?.value.trim() || "";
    if (!text && !image) return toast("Snap a photo or type a question.", { emoji: "📸" });
    if (!(await aiAvailable())) return toast("AI isn't switched on for this site yet.", { emoji: "🔌" });
    root.innerHTML = `
      <div class="scan ${image ? "" : "noimg"}">${image ? `<img src="${image.preview}" alt="Your homework">` : `<p class="scan-text">${esc(text)}</p>`}<div class="scan-line"></div></div>
      <p class="center muted" id="status">Finding the problems…</p>`;
    const msgs = ["Finding the problems…", "Reading every question…", "Working it out…", "Double-checking the answers…"];
    let m = 0;
    const iv = setInterval(() => {
      const el = root.querySelector("#status");
      if (el) el.textContent = msgs[Math.min(++m, msgs.length - 1)];
    }, 1800);
    try {
      const data = await (await post("api/answer", { text, image: image && { mediaType: image.mediaType, data: image.data } })).json();
      clearInterval(iv);
      if (!data.problems.length) {
        toast(data.note || "Couldn't read that. Try a clearer, closer photo.", { emoji: "🤔", ms: 4000 });
        image = null;
        return drawStart();
      }
      state.answers = [...data.problems.map((p) => ({ ...p, at: Date.now() })), ...(state.answers || [])].slice(0, 30);
      celebrateBadges(addXp(3 * data.problems.length));
      save();
      drawResults(data, image);
    } catch (err) {
      clearInterval(iv);
      if (err.premium) {
        toast(err.message, { emoji: "👑", ms: 4000 });
        location.hash = "#/premium";
        return;
      }
      toast(err.message, { emoji: "⚠️" });
      drawStart();
    }
  };

  const drawResults = (data, img) => {
    root.innerHTML = `
      <div class="plan-head"><button class="icon-btn filled" id="new" aria-label="New question">${icon("back", 18)}</button><h1 class="grow" style="font-size:1.4rem">${data.problems.length} answer${data.problems.length === 1 ? "" : "s"}</h1><button class="btn small" id="again">${icon("camera", 16)} New</button></div>
      ${img ? `<img src="${img.preview}" alt="Your homework" class="answer-photo">` : ""}
      <div class="answers">${data.problems
        .map((p, i) => {
          const topic = search(p.concept)[0];
          return `<article class="answer-card" style="--accent:${SUBJECT_COLOR[p.subject] || "var(--brand)"}">
          <div class="answer-top"><span class="tag">${esc(p.subject)}</span><span class="small muted">${esc(p.concept)}</span></div>
          <p class="answer-q">${esc(p.question)}</p>
          <div class="answer-a"><span>Answer</span><strong>${esc(p.answer)}</strong></div>
          <details class="answer-steps"><summary>${icon("chevron", 16)} Show ${p.steps.length} steps</summary>
            <ol>${p.steps.map((s) => `<li><div class="step-board">${board(s.show)}</div><p>${esc(s.say)}</p></li>`).join("")}</ol>
          </details>
          <div class="pill-btns">
            <button class="pill-btn solid" data-watch="${i}">▶ Watch it</button>
            <button class="pill-btn" data-ask="${i}">🤖 Explain more</button>
            ${topic ? `<a class="pill-btn" href="#/${topic.gen?.length ? "practice" : "quiz"}/${topic.id}">🎯 Practice this</a>` : ""}
          </div>
        </article>`;
        })
        .join("")}</div>
      <p class="tiny muted center">Answers come from AI and can be wrong. Check the steps, and make sure you could do the next one yourself.</p>`;
    root.querySelector("#new").onclick = root.querySelector("#again").onclick = () => ((image = null), drawStart());
    root.querySelectorAll("[data-watch]").forEach((b) => (b.onclick = () => {
      const p = data.problems[Number(b.dataset.watch)];
      closePlayer = openCheat({ id: "", trick: p.concept, q: p.question, choices: [], a: -1, answer: p.answer, steps: p.steps });
    }));
    root.querySelectorAll("[data-ask]").forEach((b) => (b.onclick = () => {
      const p = data.problems[Number(b.dataset.ask)];
      sessionStorage.setItem("brainboro:ask", JSON.stringify({ mode: "explain", text: `Can you explain this more?\n${p.question}\nThe answer is ${p.answer}. I don't get the step about ${p.concept}.` }));
      location.hash = "#/tutor";
    }));
  };

  // A photo shared to BrainBoro from the phone's share sheet.
  if (query.shared === "1" && "caches" in window) {
    caches.open("brainboro-share").then(async (c) => {
      const res = await c.match("/shared-image");
      if (!res) return drawStart();
      await c.delete("/shared-image");
      image = await readImage(new File([await res.blob()], "shared.jpg", { type: res.headers.get("Content-Type") || "image/jpeg" }), 1600);
      drawStart();
      run();
    });
  } else drawStart();
  return () => closePlayer?.();
}
