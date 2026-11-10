// Scholarship Hunt: New York high schools that run scholarship / entrance exams, with countdowns,
// one-tap "add to planner", and the matching practice test.
import { state, save } from "../store.js";
import { esc, toast } from "../ui.js";
import { icon } from "../icons.js";
import { scholarshipSchools } from "../data/entrance.js";
import { getExam } from "../content.js";

const DAY = 86400000;
const EXAM_LABEL = { hspt: "HSPT", own: "School's own exam", tachs: "TACHS-based", hunter: "Hunter exam" };
const PRACTICE = { hspt: "hspt", own: "hspt", tachs: "tachs", hunter: "hunter" };

const parse = (d) => new Date(`${d}T09:00:00`);
export const daysUntil = (d) => Math.ceil((parse(d).getTime() - Date.now()) / DAY);
const nextDate = (s) => [s.date, s.date2].filter(Boolean).find((d) => daysUntil(d) >= 0) || null;
const nice = (d) => parse(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
const when = (n) => (n === 0 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`);

/** The test day the student picked, if it's still ahead. */
export function testDay() {
  const t = state.testDay;
  return t && daysUntil(t.date) >= 0 ? { ...t, days: daysUntil(t.date) } : null;
}

export default function scholarships(root, _p, query) {
  const filter = query.f || "all";
  const areas = [...new Set(scholarshipSchools.map((s) => s.area))];
  const list = scholarshipSchools
    .filter((s) => filter === "all" || s.area === filter || s.exam === filter)
    .map((s) => ({ ...s, next: nextDate(s) }))
    .sort((a, b) => (a.next ? daysUntil(a.next) : 9999) - (b.next ? daysUntil(b.next) : 9999));
  const td = testDay();
  root.innerHTML = `
    <a class="back" href="#/exams">${icon("back", 18)} Tests</a>
    <h1 class="page-title">🎓 Scholarship Hunt</h1>
    <p class="lead">New York high schools that give scholarship or entrance exams. Pick yours, add it to your planner, and practice the exact format.</p>
    ${td ? `<div class="card banner testday"><span class="big-num">${td.days}</span><span class="grow"><strong>${td.days === 0 ? "Test day is TODAY. You've got this! 💪" : `day${td.days === 1 ? "" : "s"} until ${esc(td.name)}`}</strong><small>${nice(td.date)} · ${esc(getExam(td.exam)?.name || "")} format</small></span><a class="btn small" href="#/fulltest/${td.exam}">Practice</a></div>` : ""}
    <div class="chip-row"><a class="chip ${filter === "all" ? "on" : ""}" href="#/scholarships">All</a><a class="chip ${filter === "hspt" ? "on" : ""}" href="#/scholarships?f=hspt">HSPT</a><a class="chip ${filter === "own" ? "on" : ""}" href="#/scholarships?f=own">Own exam</a>${areas.map((a) => `<a class="chip ${filter === a ? "on" : ""}" href="#/scholarships?f=${encodeURIComponent(a)}">${esc(a)}</a>`).join("")}</div>
    <div class="list" style="margin-top:12px">${list
      .map((s, i) => {
        const n = s.next ? daysUntil(s.next) : null;
        const ex = PRACTICE[s.exam];
        return `<div class="card sch">
          <div class="sch-top"><span class="grow"><strong>${esc(s.name)}</strong><small>${esc(s.area)} · ${EXAM_LABEL[s.exam]}</small></span>${n !== null ? `<span class="sch-count ${n <= 7 ? "soon" : ""}">${n}<small>day${n === 1 ? "" : "s"}</small></span>` : ""}</div>
          ${s.next ? `<p class="sch-date">📅 ${nice(s.next)} (${when(n)})${s.date2 && s.next !== s.date2 ? ` · also ${nice(s.date2)}` : ""}</p>` : s.date ? `<p class="sch-date muted">📅 This year's date has passed. Check the school for next year.</p>` : ""}
          <p class="small">${esc(s.what)}</p>
          <p class="tiny muted">${esc(s.note)}</p>
          <div class="btn-row wrap">
            <a class="btn small" href="#/${ex === "tachs" ? "exam" : "fulltest"}/${ex}">Practice ${esc(getExam(ex)?.name || "")}${s.exam === "own" ? " style" : ""}</a>
            ${s.next ? `<button class="btn small ghost" data-plan="${i}">${icon("calendar", 16)} Add to planner</button><button class="btn small ghost" data-day="${i}">🎯 My test day</button>` : ""}
            <a class="btn small ghost" href="${esc(s.url)}" target="_blank" rel="noopener">School site ↗</a>
          </div>
        </div>`;
      })
      .join("")}</div>
    <p class="tiny muted" style="margin-top:12px">Dates and rules are from each school's website (checked November 2026) and change every year. "Own exam" schools don't publish their format; HSPT practice covers the usual mix of verbal, quantitative, reading, math and language.</p>`;

  root.querySelectorAll("[data-plan]").forEach((b) => (b.onclick = () => {
    const s = list[Number(b.dataset.plan)];
    const key = `scholarship:${s.name}:${s.next}`;
    if (state.planner.items.some((x) => x.key === key)) return toast("Already in your planner", { emoji: "📅" });
    state.planner.items.push({ id: `sch${Date.now()}`, key, title: `${s.name} scholarship exam`, course: EXAM_LABEL[s.exam], due: parse(s.next).toISOString(), type: "Test", priority: "High", points: "", steps: [{ t: "Register on the school's site", done: false }, { t: "Take a full practice test", done: false }, { t: "Pack pencils (and a calculator if allowed)", done: false }], notes: s.note, url: s.url, done: false, source: "scholarship" });
    save();
    toast("Added to your planner", { emoji: "📅" });
  }));
  root.querySelectorAll("[data-day]").forEach((b) => (b.onclick = () => {
    const s = list[Number(b.dataset.day)];
    state.testDay = { name: s.name, date: s.next, exam: PRACTICE[s.exam] };
    save();
    toast(`Counting down to ${s.name}`, { emoji: "🎯" });
    scholarships(root, _p, query);
  }));
}
