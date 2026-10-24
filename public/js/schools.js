// School connections: Google Classroom, Canvas and calendar feeds → planner assignments + grades.
import { state, save } from "./store.js";
import { post } from "./ui.js";
import { googleAccessToken } from "./account.js";

const DAY = 86400000;
const uid = () => Math.random().toString(36).slice(2, 10);
export const CLASSROOM_SCOPES = ["https://www.googleapis.com/auth/classroom.courses.readonly", "https://www.googleapis.com/auth/classroom.coursework.me.readonly"];

export const letter = (pct) => (pct == null ? "" : pct >= 97 ? "A+" : pct >= 93 ? "A" : pct >= 90 ? "A-" : pct >= 87 ? "B+" : pct >= 83 ? "B" : pct >= 80 ? "B-" : pct >= 77 ? "C+" : pct >= 73 ? "C" : pct >= 70 ? "C-" : pct >= 65 ? "D" : "F");

export function guessType(title) {
  const s = title.toLowerCase();
  if (/\b(test|exam|midterm|final)\b/.test(s)) return "Test";
  if (/\bquiz\b/.test(s)) return "Quiz";
  if (/\blab\b/.test(s)) return "Lab";
  if (/\b(essay|paragraph|draft|paper)\b/.test(s)) return "Essay";
  if (/\b(read|chapter)\b/.test(s)) return "Reading";
  if (/\bproject\b/.test(s)) return "Project";
  return "Homework";
}

/** Adds or updates imported assignments in the planner. Returns how many were new. */
export function mergeAssignments(list, source) {
  let added = 0;
  for (const ev of list) {
    const key = `${source}:${ev.uid || `${ev.title}|${ev.due}`}`;
    const existing = state.planner.items.find((t) => t.key === key);
    if (existing) {
      Object.assign(existing, { due: ev.due, title: ev.title, url: ev.url || existing.url, points: ev.points || existing.points });
      if (ev.done && !existing.done) existing.done = true;
      continue;
    }
    if (new Date(ev.due).getTime() < Date.now() - 14 * DAY) continue; // skip old stuff
    state.planner.items.push({ id: uid(), key, title: ev.title, course: ev.course || "", due: ev.due, type: guessType(ev.title), priority: "Medium", points: ev.points || "", steps: [], notes: ev.notes || "", url: ev.url || "", done: Boolean(ev.done), source });
    added++;
  }
  save();
  return added;
}

// ---------- Google Classroom (runs in the browser with a short-lived token) ----------
async function gapi(token, path) {
  const res = await fetch(`https://classroom.googleapis.com/v1/${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 403) throw new Error("Your school's Google account doesn't allow this app yet. Ask your school's tech admin to allow BrainBoro, or use your calendar link.");
  if (!res.ok) throw new Error(`Google Classroom answered ${res.status}.`);
  return res.json();
}

async function importClassroom(onStep) {
  onStep(0);
  const token = await googleAccessToken(CLASSROOM_SCOPES);
  onStep(1);
  const { courses = [] } = await gapi(token, "courses?studentId=me&courseStates=ACTIVE&pageSize=30");
  onStep(2);
  const assignments = [];
  const grades = [];
  await Promise.all(
    courses.slice(0, 20).map(async (c) => {
      const [{ courseWork = [] }, { studentSubmissions = [] }] = await Promise.all([
        gapi(token, `courses/${c.id}/courseWork?pageSize=60&orderBy=dueDate%20desc`).catch(() => ({})),
        gapi(token, `courses/${c.id}/courseWork/-/studentSubmissions?userId=me&pageSize=200`).catch(() => ({})),
      ]);
      const subs = new Map(studentSubmissions.map((s) => [s.courseWorkId, s]));
      let got = 0, max = 0;
      for (const w of courseWork) {
        const s = subs.get(w.id);
        if (s?.assignedGrade != null && w.maxPoints) {
          got += s.assignedGrade;
          max += w.maxPoints;
        }
        if (!w.dueDate) continue;
        const { year, month, day } = w.dueDate;
        const { hours = 23, minutes = 59 } = w.dueTime || {};
        assignments.push({
          uid: w.id,
          title: w.title,
          course: c.name,
          due: new Date(Date.UTC(year, month - 1, day, hours, minutes)).toISOString(),
          points: w.maxPoints ? String(w.maxPoints) : "",
          url: w.alternateLink,
          notes: (w.description || "").slice(0, 600),
          done: ["TURNED_IN", "RETURNED"].includes(s?.state),
        });
      }
      const pct = max ? Math.round((got / max) * 1000) / 10 : null;
      grades.push({ course: c.name, code: c.section || "", percent: pct, letter: letter(pct) });
    }),
  );
  onStep(3);
  return { student: "", school: "Google Classroom", grades, assignments };
}

const LABELS = { classroom: "Google Classroom", canvas: "Canvas", calendar: "Calendar link" };

/** Connects (or re-syncs) a school account. `onStep(i)` reports progress for the loading screen. */
export async function connectSchool(type, fields = {}, onStep = () => {}) {
  let result;
  if (type === "classroom") result = await importClassroom(onStep);
  else if (type === "canvas") {
    onStep(0);
    const promise = post("api/canvas", { domain: fields.domain, token: fields.token }).then((r) => r.json());
    onStep(1);
    result = await promise;
    onStep(2);
  } else {
    onStep(0);
    const { events } = await (await post("api/calendar", { url: fields.url })).json();
    onStep(2);
    result = { student: "", school: fields.label || "Calendar", grades: [], assignments: events };
  }
  const conns = (state.planner.connections ||= []);
  const id = fields.id || `${type}:${fields.domain || fields.url || "google"}`;
  let conn = conns.find((c) => c.id === id);
  if (!conn) conns.push((conn = { id, type, label: fields.label || LABELS[type], domain: fields.domain || "", url: fields.url || "", token: fields.token || "" }));
  const added = mergeAssignments(result.assignments, id);
  Object.assign(conn, { student: result.student, school: result.school, grades: result.grades, count: result.assignments.length, lastSync: Date.now() });
  save();
  onStep(4);
  return { conn, added };
}

export function disconnect(id) {
  state.planner.connections = (state.planner.connections || []).filter((c) => c.id !== id);
  save();
}

/** Re-syncs connections that don't need a popup (Canvas, calendar feeds). */
export async function syncQuiet() {
  let added = 0;
  for (const c of state.planner.connections || []) {
    if (c.type === "classroom" || Date.now() - (c.lastSync || 0) < 30 * 60000) continue;
    try {
      added += (await connectSchool(c.type, c)).added;
    } catch {
      /* try again later */
    }
  }
  return added;
}
