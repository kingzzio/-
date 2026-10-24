// Learn hub: tests, subjects, Cheat Codes, curriculum finder, free resources and search.
import { esc } from "../ui.js";
import { icon } from "../icons.js";
import { exams, subjects, topics, search } from "../content.js";
import { cheatcodes } from "../data/cheatcodes.js";
import { topicRow } from "./home.js";

export default function learn(root) {
  root.innerHTML = `
    <h1 class="page-title">Learn</h1>
    <div class="search">${icon("search", 20)}<input id="q" type="search" placeholder="Search any topic: slope, theme, mitosis…" aria-label="Search topics" autocomplete="off"></div>
    <div id="hits"></div>
    <div id="body">
      <div class="grid-4">${subjects.map((s) => `<a class="card subj" style="--accent:${s.color}" href="#/explore?s=${s.id}"><span class="em">${s.emoji}</span>${s.name}</a>`).join("")}</div>

      <section class="section">
        <div class="section-head"><h2>Tests</h2><a class="link" href="#/exams">All</a></div>
        <div class="row-scroll">${exams.map((e) => `<a class="card exam-mini" style="--accent:${e.color}" href="#/exam/${e.id}"><span class="em">${e.emoji}</span><strong>${esc(e.name)}</strong></a>`).join("")}</div>
      </section>

      <section class="section">
        <div class="section-head"><h2>🕹️ Cheat Codes</h2><a class="link" href="#/cheats">All ${cheatcodes.length}</a></div>
        <div class="row-scroll">${cheatcodes.slice(0, 8).map((c) => `<a class="cheat-tile" style="width:170px" href="#/cheat/${c.id}"><span class="cheat-q">${esc(c.q.length > 54 ? `${c.q.slice(0, 52)}…` : c.q)}</span><strong>▶ ${esc(c.trick)}</strong></a>`).join("")}</div>
      </section>

      <div class="list">
        <a class="row" href="#/curriculum"><span class="tile-ic" style="--accent:#0ea5e9">${icon("map")}</span><span class="grow"><strong>My class curriculum</strong><small>Eureka, Illustrative Math, Amplify, enVision… jump to your exact unit</small></span><span class="chev">${icon("chevron")}</span></a>
        <a class="row" href="#/resources"><span class="tile-ic" style="--accent:#12a150">${icon("folder")}</span><span class="grow"><strong>Free Resources</strong><small>Past Regents PDFs, official SHSAT & SAT practice</small></span><span class="chev">${icon("chevron")}</span></a>
        <a class="row" href="#/blitz"><span class="tile-ic" style="--accent:#ff8a00">${icon("bolt")}</span><span class="grow"><strong>Blitz</strong><small>60 seconds. How many can you get?</small></span><span class="chev">${icon("chevron")}</span></a>
        <a class="row" href="#/review"><span class="tile-ic" style="--accent:#ff4f8b">🃏</span><span class="grow"><strong>Flashcard review</strong><small>Cards you're about to forget</small></span><span class="chev">${icon("chevron")}</span></a>
      </div>

      <section class="section">
        <div class="section-head"><h2>Popular topics</h2><a class="link" href="#/explore">All ${topics.length}</a></div>
        <div class="list">${["a1-quadratics", "m7-percent-apps", "ela-punctuation", "bio-genetics", "geo-trig", "m8-linear"].map((id) => topics.find((t) => t.id === id)).filter(Boolean).map(topicRow).join("")}</div>
      </section>
    </div>`;
  const q = root.querySelector("#q");
  q.oninput = () => {
    const hits = search(q.value);
    root.querySelector("#body").hidden = Boolean(q.value.trim());
    root.querySelector("#hits").innerHTML = q.value.trim() ? (hits.length ? `<div class="list">${hits.slice(0, 30).map(topicRow).join("")}</div>` : `<div class="empty"><p>No topics match. <a class="link" href="#/tutor">Ask Boro</a> instead.</p></div>`) : "";
  };
}
