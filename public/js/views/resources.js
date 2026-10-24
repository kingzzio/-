// Free Resources library: official PDFs, past exams and free curricula.
import { esc } from "../ui.js";
import { resources, resourceKinds } from "../data/resources.js";
import { exams } from "../content.js";

export function resourceCard(r) {
  return `<a class="row res" href="${esc(r.url)}" target="_blank" rel="noopener">
    <span class="em">${r.emoji}</span>
    <span class="grow"><strong>${esc(r.name)}</strong><small>${esc(r.by)} • ${esc(r.kind)}</small><span class="res-desc">${esc(r.desc)}</span></span>
    <span class="chev">↗</span>
  </a>`;
}

export default function resourcesView(root, _p, query) {
  let kind = query.kind || "";
  let exam = query.exam || "";
  const draw = () => {
    const list = resources.filter((r) => (!kind || r.kind === kind) && (!exam || r.exams?.includes(exam)));
    root.innerHTML = `
      <a class="back" href="#/explore">← Explore</a>
      <h1 class="page-title">📂 Free Resources</h1>
      <p class="lead">Official free PDFs, past exams and curricula, all in one place.</p>
      <div class="chip-row"><button class="chip ${!kind ? "on" : ""}" data-kind="">All</button>${resourceKinds.map((k) => `<button class="chip ${kind === k ? "on" : ""}" data-kind="${esc(k)}">${esc(k)}</button>`).join("")}</div>
      <div class="chip-row"><button class="chip ${!exam ? "on" : ""}" data-exam="">Any test</button>${exams.map((e) => `<button class="chip ${exam === e.id ? "on" : ""}" data-exam="${e.id}">${e.emoji} ${esc(e.name)}</button>`).join("")}</div>
      <div class="list">${list.map(resourceCard).join("") || `<p class="muted">Nothing here yet.</p>`}</div>
      <p class="small muted">These links go to the official sites so you always get the newest version. Some materials are free for personal and classroom use only, so download them from the source.</p>`;
    root.querySelectorAll("[data-kind]").forEach((b) => (b.onclick = () => ((kind = b.dataset.kind), draw())));
    root.querySelectorAll("[data-exam]").forEach((b) => (b.onclick = () => ((exam = b.dataset.exam), draw())));
  };
  draw();
}
