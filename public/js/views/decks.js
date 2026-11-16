// Custom flashcard decks: make your own, turn notes (typed or a photo) into a deck with AI,
// study with spaced repetition, and share a deck with a link.
import { state, save } from "../store.js";
import { esc, toast, post, readImage, aiAvailable, share, baseUrl } from "../ui.js";
import { icon } from "../icons.js";
import { runDeck } from "./study.js";

const uid = () => Math.random().toString(36).slice(2, 9);
// Share links carry the deck itself (base64 of compact JSON), so no server is needed.
const encode = (d) => btoa(unescape(encodeURIComponent(JSON.stringify({ t: d.title, c: d.cards.map((c) => [c.term, c.definition]) })))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const decode = (s) => {
  const j = JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/")))));
  return { title: String(j.t || "Shared deck").slice(0, 60), cards: (j.c || []).slice(0, 60).map(([term, definition]) => ({ term: String(term).slice(0, 120), definition: String(definition).slice(0, 300) })).filter((c) => c.term && c.definition) };
};

export function decksView(root, _p, query) {
  if (query.d) {
    try {
      const d = decode(query.d);
      root.innerHTML = `<a class="back" href="#/decks">${icon("back", 18)} My decks</a><div class="empty"><div class="big-emoji">🗂️</div><h2>${esc(d.title)}</h2><p>${d.cards.length} cards shared with you</p><button class="btn" id="imp">Add to my decks</button></div>`;
      root.querySelector("#imp").onclick = () => {
        state.decks.unshift({ id: uid(), ...d, at: Date.now() });
        save();
        location.hash = "#/decks";
      };
      return;
    } catch {
      toast("That deck link looks broken.", { emoji: "⚠️" });
    }
  }
  root.innerHTML = `
    <a class="back" href="#/learn">${icon("back", 18)} Learn</a>
    <h1 class="page-title">🗂️ My decks</h1>
    <div class="grid-2"><button class="card tile" id="new"><div class="tile-emoji">✏️</div><h3>New deck</h3><p>Type your own cards</p></button><button class="card tile" id="ai"><div class="tile-emoji">✨</div><h3>Notes → cards</h3><p>Paste or snap your notes</p></button></div>
    <div class="list" style="margin-top:12px">${state.decks.map((d, i) => `<div class="row"><span class="tile-ic" style="--accent:#7c3aed">🗂️</span><span class="grow"><strong>${esc(d.title)}</strong><small>${d.cards.length} cards</small></span><span class="btns"><a class="btn small" href="#/deck/${d.id}">Study</a><button class="btn small ghost" data-share="${i}" aria-label="Share">${icon("share", 16)}</button><button class="btn small ghost" data-edit="${i}">Edit</button></span></div>`).join("") || `<div class="empty"><p class="muted">No decks yet. Make one, or turn your class notes into cards in seconds.</p></div>`}</div>`;
  root.querySelector("#new").onclick = () => edit(root, null);
  root.querySelector("#ai").onclick = () => fromNotes(root);
  root.querySelectorAll("[data-edit]").forEach((b) => (b.onclick = () => edit(root, state.decks[Number(b.dataset.edit)])));
  root.querySelectorAll("[data-share]").forEach((b) => (b.onclick = () => {
    const d = state.decks[Number(b.dataset.share)];
    share({ title: d.title, text: `Study my "${d.title}" flashcards on BrainBoro 🧠`, url: `${baseUrl()}#/decks?d=${encode(d)}` });
  }));
}

function edit(root, deck) {
  const d = deck ? { ...deck, cards: deck.cards.map((c) => ({ ...c })) } : { id: uid(), title: "", cards: [{ term: "", definition: "" }, { term: "", definition: "" }, { term: "", definition: "" }], at: Date.now() };
  const draw = () => {
    root.innerHTML = `
      <button class="back" id="bk">${icon("back", 18)} My decks</button>
      <h1 class="page-title">${deck ? "Edit deck" : "New deck"}</h1>
      <label class="field"><span>Deck name</span><input id="dt" maxlength="60" value="${esc(d.title)}" placeholder="e.g. Unit 3 vocab"></label>
      <div id="cards">${d.cards.map((c, i) => `<div class="card deck-edit"><span class="small muted">Card ${i + 1}</span><input data-i="${i}" data-f="term" maxlength="120" placeholder="Term or question" value="${esc(c.term)}"><textarea data-i="${i}" data-f="definition" rows="2" maxlength="300" placeholder="Meaning or answer">${esc(c.definition)}</textarea><button class="link small" data-rm="${i}">Remove</button></div>`).join("")}</div>
      <div class="btn-row wrap"><button class="btn ghost" id="more">+ Add card</button><button class="btn" id="save">Save deck</button>${deck ? `<button class="btn danger ghost" id="del">Delete</button>` : ""}</div>`;
    root.querySelector("#bk").onclick = () => decksView(root, {}, {});
    root.querySelector("#dt").oninput = (e) => (d.title = e.target.value);
    root.querySelectorAll("[data-f]").forEach((el) => (el.oninput = () => (d.cards[Number(el.dataset.i)][el.dataset.f] = el.value)));
    root.querySelectorAll("[data-rm]").forEach((b) => (b.onclick = () => (d.cards.splice(Number(b.dataset.rm), 1), draw())));
    root.querySelector("#more").onclick = () => (d.cards.push({ term: "", definition: "" }), draw());
    root.querySelector("#del")?.addEventListener("click", () => {
      if (!confirm("Delete this deck?")) return;
      state.decks = state.decks.filter((x) => x.id !== d.id);
      save();
      decksView(root, {}, {});
    });
    root.querySelector("#save").onclick = () => {
      d.cards = d.cards.filter((c) => c.term.trim() && c.definition.trim());
      if (!d.title.trim()) return toast("Give your deck a name.", { emoji: "🏷️" });
      if (d.cards.length < 2) return toast("Add at least 2 cards.", { emoji: "🃏" });
      const i = state.decks.findIndex((x) => x.id === d.id);
      if (i >= 0) state.decks[i] = d;
      else state.decks.unshift(d);
      save();
      toast("Deck saved", { emoji: "✅" });
      decksView(root, {}, {});
    };
  };
  draw();
}

function fromNotes(root) {
  let image = null;
  root.innerHTML = `
    <a class="back" href="#/decks">${icon("back", 18)} My decks</a>
    <h1 class="page-title">✨ Notes → flashcards</h1>
    <p class="lead">Paste your class notes or snap a photo. Boro turns them into a study deck.</p>
    <textarea id="nt" rows="8" maxlength="6000" placeholder="Paste notes here…" class="big-text"></textarea>
    <div class="btn-row wrap"><label class="btn ghost" style="cursor:pointer"><input type="file" accept="image/*" id="ph" hidden>${icon("camera", 18)} Photo of notes</label><button class="btn" id="mk">Make my deck</button></div>
    <div id="pv"></div>`;
  root.querySelector("#ph").onchange = async (e) => {
    try {
      image = await readImage(e.target.files[0], 1600);
      root.querySelector("#pv").innerHTML = `<img src="${image.preview}" alt="Your notes" class="notes-preview">`;
    } catch (err) {
      toast(err.message, { emoji: "⚠️" });
    }
  };
  root.querySelector("#mk").onclick = async (e) => {
    const notes = root.querySelector("#nt").value.trim();
    if (!notes && !image) return toast("Paste notes or add a photo first.", { emoji: "📝" });
    if (!(await aiAvailable())) return toast("AI isn't switched on for this site yet.", { emoji: "🔌" });
    e.target.disabled = true;
    e.target.textContent = "Making cards…";
    try {
      const out = await (await post("api/cards", { notes, image: image && { mediaType: image.mediaType, data: image.data } })).json();
      if (!out.cards.length) throw new Error("Couldn't find facts to make cards from. Try clearer notes.");
      const d = { id: uid(), title: out.title, cards: out.cards, at: Date.now() };
      edit(root, d);
      toast(`Made ${out.cards.length} cards. Check them, then save!`, { emoji: "✨" });
    } catch (err) {
      toast(err.message, { emoji: "⚠️" });
      e.target.disabled = false;
      e.target.textContent = "Make my deck";
    }
  };
}

export function deckStudy(root, { id }) {
  const d = state.decks.find((x) => x.id === id);
  if (!d) return (location.hash = "#/decks");
  const topic = { id: `deck-${d.id}`, name: d.title };
  runDeck(root, d.cards.map((c, i) => ({ front: c.term, back: c.definition, id: `deck-${d.id}-${i}`, topic })), { title: d.title, back: "#/decks" });
}
