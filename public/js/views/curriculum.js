// Curriculum Finder: school type → curriculum → course → unit → matching practice.
import { state, save, mastery } from "../store.js";
import { esc } from "../ui.js";
import { curricula, schoolTypes, getTopic, subjectOf } from "../content.js";
import { resourcesFor } from "../data/resources.js";
import { resourceCard } from "./resources.js";

export default function curriculum(root, _p, query) {
  const pick = state.profile.curriculum || {};
  const sel = { school: query.school ?? pick.school ?? "", cur: query.c ?? pick.cur ?? "", course: query.course ?? pick.course ?? "" };

  const remember = () => {
    state.profile.curriculum = { ...sel };
    save();
    history.replaceState(null, "", `#/curriculum?${new URLSearchParams(Object.entries(sel).filter(([, v]) => v !== ""))}`);
  };

  const draw = () => {
    const school = schoolTypes.find((s) => s.id === sel.school);
    const cur = curricula.find((c) => c.id === sel.cur);
    const course = cur?.courses[Number(sel.course)];
    const ordered = school ? [...school.picks.map((id) => curricula.find((c) => c.id === id)), ...curricula.filter((c) => !school.picks.includes(c.id))] : curricula;

    root.innerHTML = `
      <a class="back" href="#/explore">← Explore</a>
      <h1 class="page-title">🗺️ Curriculum Finder</h1>
      <p class="lead">Tell us what your class uses and we'll match every unit to flashcards, quizzes and practice.</p>

      <div class="search"><span>🔎</span><input id="uq" type="search" placeholder="Search a unit: “Module 4”, “Dilations”, “Probability”…" aria-label="Search units"></div>
      <div id="uresults"></div>

      <section class="section">
        <div class="section-head"><h2>1. Where do you go to school?</h2></div>
        <div class="chip-row">${schoolTypes.map((s) => `<button class="chip ${sel.school === s.id ? "on" : ""}" data-school="${s.id}">${esc(s.name)}</button>`).join("")}</div>
        ${school ? `<p class="tip">💡 ${esc(school.tip)}</p>` : ""}
      </section>

      <section class="section">
        <div class="section-head"><h2>2. Which curriculum?</h2></div>
        <div class="cur-grid">${ordered
          .map((c) => `<button class="cur ${sel.cur === c.id ? "on" : ""}" data-cur="${c.id}" style="--accent:${subjectOf(c.subject).color}">
            <span class="eyebrow">${subjectOf(c.subject).emoji} ${subjectOf(c.subject).name}${school?.picks.includes(c.id) ? " • common here" : ""}</span>
            <strong>${esc(c.name)}</strong><small>${esc(c.where)}</small></button>`)
          .join("")}</div>
        <p class="small muted">Not sure? Check the cover of your textbook or workbook, your class website/Google Classroom, or ask your teacher. Schools sometimes reorder or skip units.</p>
      </section>

      ${cur && resourcesFor({ curriculum: cur.id }).length ? `
      <section class="section">
        <div class="section-head"><h2>📂 Free ${esc(cur.name.split(" (")[0])} materials</h2></div>
        <div class="list">${resourcesFor({ curriculum: cur.id }).map(resourceCard).join("")}</div>
      </section>` : ""}

      ${cur ? `
      <section class="section">
        <div class="section-head"><h2>3. Which course or grade?</h2></div>
        <div class="chip-row">${cur.courses.map((c, i) => `<button class="chip ${sel.course === String(i) ? "on" : ""}" data-course="${i}">${esc(c.name)}</button>`).join("")}</div>
      </section>` : ""}

      ${course ? `
      <section class="section">
        <div class="section-head"><h2>4. Pick your unit</h2><span class="muted small">${esc(cur.name)} • ${esc(course.name)}</span></div>
        <div class="units">${course.units.map(([unit, ids], n) => unitCard(unit, ids, n)).join("")}</div>
      </section>` : ""}`;

    root.querySelectorAll("[data-school]").forEach((b) => (b.onclick = () => ((sel.school = b.dataset.school), remember(), draw())));
    root.querySelectorAll("[data-cur]").forEach((b) => (b.onclick = () => ((sel.cur = b.dataset.cur), (sel.course = ""), remember(), draw(), root.querySelector("[data-course]")?.scrollIntoView({ behavior: "smooth", block: "center" }))));
    root.querySelectorAll("[data-course]").forEach((b) => (b.onclick = () => ((sel.course = b.dataset.course), remember(), draw(), root.querySelector(".units")?.scrollIntoView({ behavior: "smooth", block: "start" }))));
    const uq = root.querySelector("#uq");
    uq.oninput = () => searchUnits(uq.value, root.querySelector("#uresults"));
  };
  draw();
}

function unitCard(unit, ids, n) {
  const ts = ids.map(getTopic).filter(Boolean);
  return `<div class="unit">
    <div class="unit-head"><span class="unit-n">${n + 1}</span><strong>${esc(unit)}</strong></div>
    <div class="unit-topics">${ts
      .map((t) => {
        const m = mastery(t.id);
        return `<a class="unit-topic" href="#/topic/${t.id}"><span>${esc(t.name)}</span><span class="small muted">${m === null ? "start →" : `${m}%`}</span></a>`;
      })
      .join("")}</div>
  </div>`;
}

function searchUnits(q, box) {
  q = q.trim().toLowerCase();
  if (q.length < 2) {
    box.innerHTML = "";
    return;
  }
  const hits = [];
  for (const c of curricula)
    for (const course of c.courses)
      for (const [unit, ids] of course.units) if (`${unit} ${course.name} ${c.name}`.toLowerCase().includes(q)) hits.push({ c, course, unit, ids });
  box.innerHTML = hits.length
    ? `<div class="list">${hits
        .slice(0, 12)
        .map((h) => `<a class="row" href="#/topic/${h.ids[0]}"><span class="grow"><strong>${esc(h.unit)}</strong><small>${esc(h.c.name)} • ${esc(h.course.name)} → ${h.ids.map((id) => esc(getTopic(id)?.name)).join(", ")}</small></span><span class="chev">›</span></a>`)
        .join("")}</div>`
    : `<p class="small muted">No units match “${esc(q)}”. Try the topic search in Explore, or ask Boro.</p>`;
}
