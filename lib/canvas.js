// Canvas LMS import: courses, current grades and assignments, using the student's own access token.
// The token is used for this one request and never stored on the server.
import { checkUrl, FeedError } from "./calendar.js";

const DAY = 86400000;

async function canvas(base, token, path) {
  const res = await fetch(new URL(path, base), { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, redirect: "error", signal: AbortSignal.timeout(12000) });
  if (res.status === 401) throw new FeedError("Canvas didn't accept that access token. Make a new one and try again.");
  if (!res.ok) throw new FeedError(`Canvas answered ${res.status}. Check your school's Canvas address.`);
  return res.json();
}

const letter = (pct) => (pct == null ? "" : pct >= 97 ? "A+" : pct >= 93 ? "A" : pct >= 90 ? "A-" : pct >= 87 ? "B+" : pct >= 83 ? "B" : pct >= 80 ? "B-" : pct >= 77 ? "C+" : pct >= 73 ? "C" : pct >= 70 ? "C-" : pct >= 65 ? "D" : "F");

export async function importCanvas({ domain, token }) {
  const host = String(domain || "").trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) throw new FeedError("Enter your school's Canvas address, like yourschool.instructure.com");
  if (typeof token !== "string" || token.length < 20 || token.length > 200) throw new FeedError("Paste your Canvas access token.");
  const base = await checkUrl(`https://${host}/`);

  const me = await canvas(base, token, "/api/v1/users/self");
  const courses = (await canvas(base, token, "/api/v1/courses?enrollment_state=active&include[]=total_scores&per_page=40")).filter((c) => c.name).slice(0, 15);
  const now = Date.now();
  const assignments = [];
  await Promise.all(
    courses.map(async (c) => {
      const list = await canvas(base, token, `/api/v1/courses/${c.id}/assignments?include[]=submission&order_by=due_at&per_page=100`).catch(() => []);
      for (const a of list) {
        if (!a.due_at) continue;
        const due = new Date(a.due_at).getTime();
        if (due < now - 14 * DAY || due > now + 90 * DAY) continue;
        const sub = a.submission || {};
        assignments.push({
          uid: `canvas:${host}:${a.id}`,
          title: String(a.name).slice(0, 200),
          course: c.course_code || c.name,
          due: a.due_at,
          points: a.points_possible ? String(a.points_possible) : "",
          url: a.html_url,
          notes: String(a.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 600),
          done: Boolean(sub.submitted_at || sub.workflow_state === "graded"),
        });
      }
    }),
  );
  const grades = courses.map((c) => {
    const e = (c.enrollments || []).find((x) => x.type === "student") || {};
    const pct = e.computed_current_score ?? null;
    return { course: c.name, code: c.course_code || "", percent: pct, letter: e.computed_current_grade || letter(pct) };
  });
  return { student: me.name || me.short_name || "", school: host, grades, assignments };
}
