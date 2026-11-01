// BrainBoro Live: a class game. The host puts the PIN on the big screen, everyone joins on their phone,
// and fast right answers score the most points. Works with any exam or topic (or AI questions).
import { state, save, addXp } from "../store.js";
import { esc, toast, post, confetti, baseUrl, aiAvailable, aiQuiz, celebrateBadges } from "../ui.js";
import { icon } from "../icons.js";
import { exams, getExam, examTopicIds, topics, buildQuiz } from "../content.js";

const SHAPES = ["▲", "◆", "●", "■"];
const call = async (body) => (await post("api/live", body)).json();
const saved = (k) => {
  try {
    return JSON.parse(sessionStorage.getItem(k) || "null");
  } catch {
    return null;
  }
};
const remember = (k, v) => {
  try {
    sessionStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* private mode */
  }
};

export default function live(root, _p, query) {
  let timer = null, tick = null, offset = 0;
  const cleanup = () => {
    clearTimeout(timer);
    clearInterval(tick);
  };
  const countdown = (endsAt, el) => {
    clearInterval(tick);
    const draw = () => {
      const left = Math.max(0, Math.ceil((endsAt - (Date.now() + offset)) / 1000));
      if (el()) el().textContent = left;
      return left;
    };
    draw();
    tick = setInterval(draw, 250);
    return draw;
  };

  // ---------- Start ----------
  const home = () => {
    cleanup();
    root.innerHTML = `
      <a class="back" href="#/learn">${icon("back", 18)} Learn</a>
      <h1 class="page-title">${icon("users", 26)} BrainBoro Live</h1>
      <p class="lead">A game for your whole class. Put the PIN on the board, everyone joins on their phone, and the fastest right answers win.</p>
      <div class="card">
        <strong>Join a game</strong>
        <div class="grid-2 tight" style="margin-top:8px">
          <label class="field"><span>Game PIN</span><input id="pin" inputmode="numeric" maxlength="6" placeholder="123456" value="${esc(query.pin || "")}"></label>
          <label class="field"><span>Nickname</span><input id="nick" maxlength="20" placeholder="Your name" value="${esc(state.profile.name || "")}"></label>
        </div>
        <button class="btn" id="join">Join</button>
      </div>
      <div class="divider">or</div>
      <button class="btn ghost big" id="host">${icon("plus", 20)} Host a game</button>`;
    root.querySelector("#join").onclick = join;
    root.querySelector("#host").onclick = setup;
    if (query.pin) root.querySelector("#nick").focus();
  };

  // ---------- Player ----------
  const join = async () => {
    const pin = root.querySelector("#pin").value.replace(/\D/g, "");
    const name = root.querySelector("#nick").value.trim();
    if (pin.length !== 6) return toast("Game PINs are 6 digits.", { emoji: "🔢" });
    if (!name) return toast("Pick a nickname.", { emoji: "🏷️" });
    try {
      const me = await call({ action: "join", pin, name });
      remember(`live:${pin}`, me);
      play(pin, me);
    } catch (err) {
      toast(err.message, { emoji: "⚠️" });
    }
  };

  const play = (pin, me) => {
    history.replaceState(null, "", `#/live?pin=${pin}`);
    let last = "";
    const poll = async () => {
      try {
        const s = await call({ action: "state", pin, playerId: me.playerId });
        offset = s.now - Date.now();
        const key = `${s.phase}:${s.index}:${s.myAnswer ? 1 : 0}`;
        if (key !== last) {
          last = key;
          drawPlayer(pin, me, s);
        }
        if (s.phase === "done") return;
      } catch (err) {
        if (err.status === 404) return (root.innerHTML = `<div class="empty"><h2>That game ended</h2><a class="btn" href="#/live">Back</a></div>`);
      }
      timer = setTimeout(poll, 1200);
    };
    poll();
  };

  const drawPlayer = (pin, me, s) => {
    clearInterval(tick);
    const head = `<div class="live-top"><span class="tag">PIN ${pin}</span><strong>${esc(me.name)}</strong>${s.me ? `<span class="tag">${s.me.score.toLocaleString()} pts</span>` : ""}</div>`;
    if (s.phase === "lobby") {
      root.innerHTML = `${head}<div class="empty"><div class="big-emoji">✅</div><h2>You're in!</h2><p class="muted">Look for your name on the big screen. The game starts soon.</p></div>`;
      return;
    }
    if (s.phase === "question") {
      if (s.myAnswer) {
        root.innerHTML = `${head}<div class="empty"><div class="spinner"></div><h2>Answer locked in</h2><p class="muted">Waiting for everyone else…</p></div>`;
        return;
      }
      root.innerHTML = `${head}
        <p class="muted small center">Question ${s.index + 1} of ${s.total} · <span id="left"></span>s</p>
        <p class="q-text center">${esc(s.question.q)}</p>
        <div class="live-answers">${s.question.choices.map((c, i) => `<button class="live-ans c${i}" data-i="${i}"><span class="shape">${SHAPES[i]}</span><span>${esc(c)}</span></button>`).join("")}</div>`;
      countdown(s.endsAt, () => root.querySelector("#left"));
      root.querySelectorAll("[data-i]").forEach((b) => (b.onclick = async () => {
        root.querySelectorAll("[data-i]").forEach((x) => (x.disabled = true));
        b.classList.add("picked");
        try {
          await call({ action: "answer", pin, playerId: me.playerId, secret: me.secret, choice: Number(b.dataset.i) });
          root.innerHTML = `${head}<div class="empty"><div class="spinner"></div><h2>Answer locked in</h2><p class="muted">Waiting for everyone else…</p></div>`;
        } catch (err) {
          toast(err.message, { emoji: "⏱️" });
        }
      }));
      return;
    }
    if (s.phase === "reveal") {
      const r = s.myAnswer;
      root.innerHTML = `${head}<div class="empty live-result ${r?.correct ? "ok" : "no"}">
        <div class="big-emoji">${r?.correct ? "🎉" : r ? "😬" : "⏱️"}</div>
        <h2>${r?.correct ? `Correct! +${r.points}` : r ? "Not this time" : "Too slow!"}</h2>
        <p>Answer: <strong>${esc(s.question.choices[s.answer])}</strong></p>
        ${s.me?.rank ? `<p class="muted">You're #${s.me.rank} of ${s.playerCount}</p>` : ""}</div>`;
      return;
    }
    // done
    const rank = s.me?.rank || 0;
    if (rank && rank <= 3) confetti(140);
    celebrateBadges(addXp(rank === 1 ? 60 : rank <= 3 ? 40 : 20));
    save();
    root.innerHTML = `${head}<div class="empty"><div class="big-emoji">${["🥇", "🥈", "🥉"][rank - 1] || "🏁"}</div><h2>${rank ? `You finished #${rank}` : "Game over"}</h2><p class="muted">${(s.me?.score || 0).toLocaleString()} points</p>
      ${podium(s.leaders)}<a class="btn" href="#/live">Play again</a></div>`;
  };

  // ---------- Host ----------
  const setup = async () => {
    cleanup();
    const ai = await aiAvailable();
    const examId = state.profile.exam || exams[0]?.id;
    root.innerHTML = `
      <button class="back" id="bk">${icon("back", 18)} Back</button>
      <h1 class="page-title">Host a game</h1>
      <div class="card">
        <label class="field"><span>Questions from</span><select id="src">
          <optgroup label="Tests">${exams.map((e) => `<option value="exam:${e.id}" ${e.id === examId ? "selected" : ""}>${esc(e.name)}</option>`).join("")}</optgroup>
          <optgroup label="Topics">${topics.map((t) => `<option value="topic:${t.id}">${esc(t.course)}: ${esc(t.name)}</option>`).join("")}</optgroup>
          ${ai ? `<option value="ai">✨ Any topic (AI writes the questions)</option>` : ""}
        </select></label>
        <label class="field" id="aiTopicWrap" hidden><span>Topic</span><input id="aiTopic" maxlength="120" placeholder="e.g. The Great Depression, photosynthesis, slope"></label>
        <div class="grid-2 tight">
          <label class="field"><span>Questions</span><select id="n">${[5, 10, 15, 20].map((n) => `<option ${n === 10 ? "selected" : ""}>${n}</option>`).join("")}</select></label>
          <label class="field"><span>Seconds each</span><select id="sec">${[10, 20, 30, 45].map((n) => `<option ${n === 20 ? "selected" : ""}>${n}</option>`).join("")}</select></label>
        </div>
        <button class="btn big" id="make">Create game</button>
      </div>`;
    root.querySelector("#bk").onclick = home;
    const src = root.querySelector("#src");
    src.onchange = () => (root.querySelector("#aiTopicWrap").hidden = src.value !== "ai");
    root.querySelector("#make").onclick = async (e) => {
      const n = Number(root.querySelector("#n").value);
      const [kind, id] = src.value.split(":");
      e.target.disabled = true;
      e.target.textContent = "Making the game…";
      try {
        let questions, title;
        if (kind === "ai") {
          title = root.querySelector("#aiTopic").value.trim();
          if (!title) throw new Error("Type a topic for the AI.");
          questions = await aiQuiz({ topic: title, count: Math.min(n, 10), grade: state.profile.grade });
        } else if (kind === "exam") {
          const exam = getExam(id);
          title = exam.name;
          questions = buildQuiz(examTopicIds(exam), n);
        } else {
          const t = topics.find((x) => x.id === id);
          title = t.name;
          questions = buildQuiz([id], n);
        }
        const game = await call({ action: "create", title, seconds: Number(root.querySelector("#sec").value), questions: questions.map(({ q, choices, a, exp }) => ({ q, choices, a, exp })) });
        remember(`live-host:${game.pin}`, game);
        hostView(game);
      } catch (err) {
        toast(err.message, { emoji: "⚠️" });
        e.target.disabled = false;
        e.target.textContent = "Create game";
      }
    };
  };

  const hostView = ({ pin, hostKey }) => {
    history.replaceState(null, "", `#/live?pin=${pin}&host=1`);
    let s = null, last = "", acting = false;
    const act = async (step) => {
      if (acting) return;
      acting = true;
      try {
        s = await call({ action: "host", pin, hostKey, step });
        last = "";
        draw();
      } catch (err) {
        toast(err.message, { emoji: "⚠️" });
      } finally {
        acting = false;
      }
    };
    const poll = async () => {
      try {
        s = await call({ action: "state", pin, hostKey });
        offset = s.now - Date.now();
        draw();
        // Reveal when time is up or everyone has answered.
        if (s.phase === "question" && (Date.now() + offset > s.endsAt + 600 || (s.playerCount && s.answered >= s.playerCount))) await act("reveal");
      } catch (err) {
        if (err.status === 404) return (root.innerHTML = `<div class="empty"><h2>Game expired</h2><a class="btn" href="#/live">New game</a></div>`);
      }
      if (s?.phase !== "done") timer = setTimeout(poll, 1000);
    };
    const draw = () => {
      if (!s) return;
      const key = `${s.phase}:${s.index}:${s.phase === "lobby" ? s.playerCount : s.phase === "question" ? s.answered : ""}`;
      if (key === last) return;
      last = key;
      clearInterval(tick);
      const link = `${baseUrl()}#/live?pin=${pin}`;
      if (s.phase === "lobby") {
        root.innerHTML = `
          <div class="live-host">
            <p class="muted center">Go to <strong>${esc(location.host)}</strong> → Learn → BrainBoro Live, or open the link</p>
            <div class="live-pin">${pin.slice(0, 3)} ${pin.slice(3)}</div>
            <div class="btn-row" style="justify-content:center"><button class="btn small ghost" id="copy">${icon("link", 16)} Copy join link</button></div>
            <div class="live-players">${(s.players || []).map((n) => `<span class="live-name">${esc(n)}</span>`).join("") || `<p class="muted">Waiting for players…</p>`}</div>
            <div class="btn-row" style="justify-content:center;align-items:center"><span class="tag" style="flex:none">${s.playerCount} joined</span><button class="btn big" id="go" ${s.playerCount ? "" : "disabled"}>Start</button></div>
          </div>`;
        root.querySelector("#copy").onclick = () => navigator.clipboard?.writeText(link).then(() => toast("Join link copied", { emoji: "📋" }));
        root.querySelector("#go").onclick = () => act("next");
        return;
      }
      if (s.phase === "question") {
        root.innerHTML = `
          <div class="live-host">
            <div class="live-bar"><span class="tag">${s.index + 1}/${s.total}</span><span class="live-clock" id="clock"></span><span class="tag">${s.answered}/${s.playerCount} answered</span></div>
            <p class="live-q">${esc(s.question.q)}</p>
            <div class="live-answers big">${s.question.choices.map((c, i) => `<div class="live-ans c${i}"><span class="shape">${SHAPES[i]}</span><span>${esc(c)}</span></div>`).join("")}</div>
            <div class="btn-row" style="justify-content:center"><button class="btn small ghost" id="skip">End question</button></div>
          </div>`;
        countdown(s.endsAt, () => root.querySelector("#clock"));
        root.querySelector("#skip").onclick = () => act("reveal");
        return;
      }
      if (s.phase === "reveal") {
        const max = Math.max(1, ...s.dist);
        root.innerHTML = `
          <div class="live-host">
            <p class="live-q">${esc(s.question.q)}</p>
            <div class="live-dist">${s.question.choices.map((c, i) => `<div class="live-col c${i} ${i === s.answer ? "right" : "dim"}"><span class="n">${s.dist[i]}</span><div class="col" style="height:${Math.max(6, (s.dist[i] / max) * 120)}px"></div><span class="shape">${SHAPES[i]}${i === s.answer ? " ✓" : ""}</span></div>`).join("")}</div>
            <p class="center"><strong>${esc(s.question.choices[s.answer])}</strong>${s.exp ? `<br><span class="small muted">${esc(s.exp)}</span>` : ""}</p>
            <div class="card"><strong>Top 5</strong>${(s.leaders || []).map((l, i) => `<div class="live-lead"><span>${i + 1}. ${esc(l.name)}</span><strong>${l.score.toLocaleString()}</strong></div>`).join("")}</div>
            <div class="btn-row" style="justify-content:center"><button class="btn big" id="nx">${s.index + 1 < s.total ? "Next question" : "Show podium"}</button></div>
          </div>`;
        root.querySelector("#nx").onclick = () => act("next");
        return;
      }
      confetti(200);
      celebrateBadges(addXp(30));
      save();
      root.innerHTML = `<div class="live-host"><h1 class="page-title center">🏆 Final results</h1>${podium(s.leaders)}
        <div class="card">${(s.leaders || []).slice(3).map((l, i) => `<div class="live-lead"><span>${i + 4}. ${esc(l.name)}</span><strong>${l.score.toLocaleString()}</strong></div>`).join("") || `<p class="muted small center">GG everyone!</p>`}</div>
        <div class="btn-row" style="justify-content:center"><a class="btn" href="#/live">New game</a></div></div>`;
    };
    poll();
  };

  // Rejoin after a refresh.
  const pin = String(query.pin || "");
  if (query.host && saved(`live-host:${pin}`)) hostView(saved(`live-host:${pin}`));
  else if (pin && saved(`live:${pin}`)) play(pin, saved(`live:${pin}`));
  else home();
  return cleanup;
}

function podium(leaders = []) {
  const [a, b, c] = leaders;
  const spot = (p, place, h) => (p ? `<div class="pod p${place}"><strong>${esc(p.name)}</strong><span>${p.score.toLocaleString()}</span><div class="pod-col" style="height:${h}px">${place}</div></div>` : `<div class="pod"></div>`);
  return `<div class="podium">${spot(b, 2, 70)}${spot(a, 1, 100)}${spot(c, 3, 50)}</div>`;
}
