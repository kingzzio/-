# 🧠 BrainBoro

**Free test prep, homework planner and AI tutor for NYC students** (and anyone in grades 6–12).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fkingzzio%2F-&project-name=brainboro&repository-name=brainboro)

👉 **New to this? Follow [SETUP.md](SETUP.md)**: about 15 minutes of clicking, $0, no coding.

SHSAT · TACHS · Regents (Algebra I, Geometry, Algebra II, ELA, Biology, Earth & Space, Chemistry, Physics, Global, U.S. History) · SAT/PSAT · plus every grade 6–12 math, ELA, science and history topic.

## What's inside

| Feature | What it does |
|---|---|
| 👤 **Accounts** | Sign up with email or **Continue with Google**. Progress syncs across devices. Guests can still use everything on one device. |
| 🏫 **Connect your school** | Google Classroom (read-only Google sign-in), Canvas (address + access token), and Schoology / StudentVue / PowerSchool / Aeries / Infinite Campus via a calendar link. Imports assignments and **shows your grades**, with Sync now and Disconnect. |
| 📅 **Planner** | Today view with To do / Done / Progress, steps, due times, priority, points, a focus timer and an "all done" streak. On every assignment: **Solve**, **Scan for more steps** (photo of the worksheet), **Break into steps**, and **Help me with this**. |
| 📸 **Snap & Answer** | Gauth-style: photo of your homework → it finds every problem and gives the **answer + steps** for each, with **▶ Watch it** on the animated whiteboard, "Explain more" and "Practice this". Answers are saved in Recent. On Android you can share a photo straight to BrainBoro from the share sheet. 3 free a day; unlimited with Premium. |
| ✍️ **Essay Coach** | **Plan** (what the prompt really asks, 3 thesis options, outline with sentence starters, evidence tips, counterclaim) → **Write** (your draft autosaves) → **Feedback** (Regents-style rubric scores, quoted fixes, grammar). |
| 🕹️ **Cheat Codes** | 30-second whiteboard shortcut videos for test tricks, with captions and voiceover. 20 hand-made ones, plus an AI Cheat Code for any quiz question. |
| 🎯 **Score Reveal** | Finish a full practice test and get an estimated SAT / SHSAT / Regents score card, which you can save as an image for your story. |
| 🏆 **Borough Wars** | Weekly XP leaderboard: Manhattan vs Brooklyn vs Queens vs The Bronx vs Staten Island, plus the top students. |
| ⚡ **Blitz** | 60-second speed round with a shareable "beat my score" link. |
| 🥊 **Brain Battles** | Send a link and your friend plays the exact same 10 questions. |
| ⚡ **Daily Brain Blast** | The same 5 questions for everyone, every day. |
| 🃏 **Flashcards & quizzes** | 586 cards with spaced repetition, 234 hand-written questions, and 43 generators for unlimited math practice. |
| ⏱️ **Timed practice tests** | For every exam and section, ending with a "study these next" list. |
| 🗺️ **Curriculum Finder** | Illustrative Math, Eureka/EngageNY, Amplify, enVision, Big Ideas, CPM, NYC Reads… pick your unit and jump to practice. |
| 📂 **Free Resources** | Past Regents exams, the NYC SHSAT practice portal, Bluebook, Eureka Math PDFs and more (linked to the official sources). |
| 🤖 **Boro AI tutor** | Hint / Explain / Quiz-me chat with homework photos. |
| 👑 **Premium** | Unlimited Solve, every Cheat Code, Scan & Break into steps, and a 5× AI allowance. Sold with codes you create in the admin dashboard. |
| 🛡️ **Admin dashboard** | User list and search, grant/remove Premium, disable accounts, generate Premium codes, stats. |

## Is it an app? (free)

Yes, as an installable web app (PWA). It costs nothing:

- **iPhone:** open the site in Safari → Share ⬆️ → **Add to Home Screen**.
- **Android:** Chrome menu ⋮ → **Install app** (or tap "Get the BrainBoro app" inside the app).

It gets its own icon and opens full screen like any app. It works offline, launches instantly after the first visit, has home-screen shortcuts (Snap & Answer, Planner, Daily Blast, Ask Boro) and shows up in Android's share sheet.

Putting it in the **App Store** costs $99/year (Apple developer account). **Google Play** is a one-time $25. If you ever want that, the same code can be wrapped with Capacitor; nothing needs to be rewritten. The web app + website path is completely free.

**What does cost money:** hosting (Vercel), the database (Upstash) and Google sign-in are free. The **AI is not free**: Anthropic bills per use. Set `BRAINBORO_MODEL=claude-haiku-5-5` to make it very cheap, keep the free daily limits, and let Premium sales cover the bill. Without an API key, everything except the AI features still works.

## Run it locally

```bash
npm install
npm start          # builds the app, then serves http://localhost:3000
```

Everything except AI and Google sign-in works with no setup. Accounts are saved to `data/db.json` locally.

## Launch checklist (Vercel, free tier)

1. **Import the repo on vercel.com.** It runs `npm run build` and serves `public/` + `api/`.
2. **Add a database.** In Vercel → Storage, add **Upstash Redis** (free). It sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` for you. Without it, accounts won't stick on Vercel.
3. **Add environment variables** (Settings → Environment Variables):

| Variable | What it's for |
|---|---|
| `SESSION_SECRET` | Optional. Signs logins. If you don't set it, one is generated and stored in the database. |
| `ANTHROPIC_API_KEY` | Turns on Boro, Solve, Cheat Codes and AI quizzes. Get one at console.anthropic.com. |
| `GOOGLE_CLIENT_ID` | Turns on "Continue with Google" and Google Classroom import (steps below). |
| `ADMIN_EMAILS` | Admin accounts. Defaults to `esanni104@gmail.com`. |
| `BRAINBORO_CHECKOUT_URL` | Optional payment link (e.g. Stripe Payment Link) on the Premium page. |
| `BRAINBORO_MODEL` | Optional. Default `claude-opus-5-5`. `claude-haiku-5-5` is far cheaper at scale. |
| `BRAINBORO_RATE_LIMIT` / `BRAINBORO_FREE_SOLVES` | Optional AI limits per hour / free Solves per day (defaults 40 / 3). |

4. **Become admin:** open the site and tap **Continue with Google** with `esanni104@gmail.com`. Admin requires a Google-verified email, so nobody can claim it by signing up with a password. You'll see **Admin dashboard** on the Me tab, and every Premium feature is unlocked.

### Setting up Google sign-in + Google Classroom

1. Go to console.cloud.google.com → create a project.
2. **APIs & Services → Library** → enable **Google Classroom API**.
3. **OAuth consent screen** → External → add your app name and logo. Add the scopes `classroom.courses.readonly` and `classroom.coursework.me.readonly`.
4. **Credentials → Create credentials → OAuth client ID → Web application.** Under **Authorized JavaScript origins**, add your site (e.g. `https://brainboro.vercel.app`) and `http://localhost:3000`.
5. Copy the Client ID into `GOOGLE_CLIENT_ID`.

Heads-up: until Google verifies your app (needed for the Classroom scopes, and it takes a few weeks), only test users you add on the consent screen (up to 100) can connect Classroom. Plain Google sign-in works right away. Some school Google accounts also block outside apps until the school's IT allows them. Students can still use the calendar-link option.

### Premium codes

Create codes in **Admin → Premium codes** (each works once, for the days you pick) and send them to buyers. A link like `https://your-site/#/premium?code=BORO-1A2B3C4D` redeems automatically. Logged-in users get Premium on their account, so it follows them to every device. You can also list static codes in `BRAINBORO_PREMIUM_CODES` (+ `BRAINBORO_PREMIUM_SECRET` for guest redemptions).

## Project layout

```
public/            the app (HTML/CSS + JS modules; `npm run build` bundles them into public/dist/)
  js/data/         study content: math, ela, science, history, exams, curricula, cheat codes, resources
  js/views/        screens (home, learn, planner, connect, answer, essay, blitz, leaderboard, admin, …)
  sw.js            offline cache, instant launch, Android share target
  js/schools.js    Google Classroom / Canvas / calendar import
  js/account.js    login state, Google button, progress sync
lib/auth.js        passwords (scrypt), sessions, Google ID-token verification, admin rules
lib/accounts.js    auth/profile/progress/leaderboard/admin endpoints
lib/db.js          Upstash/Vercel KV or local JSON file
lib/tutor.js       Claude API calls (tutor, quizzes, Cheat Codes, Solve, steps)
lib/canvas.js      Canvas import (token used per request, never stored server-side)
lib/calendar.js    .ics import with SSRF protection
api/               Vercel serverless functions
scripts/           build + checks
```

`npm run check` runs every content, generator, server and account check.

## Notes

- **Read-only on purpose.** School connections can see assignments and grades but can't submit work. Snap & Answer shows the steps with every answer. Essay Coach plans, teaches and grades, but students write the essay themselves. There's no AI-detector "humanizer". That keeps students out of academic-integrity trouble and keeps the app allowed at schools.
- **Curriculum PDFs are linked, not copied.** Eureka Math, OpenStax and OpenSciEd use non-commercial licenses, and a paid Premium tier would break them.
- Leaderboard XP is earned on the device and capped per week, so treat it as a fun competition, not a contest with prizes.
- Score Reveal numbers are rough estimates from practice tests, not official scores.
- Exam formats change (the SHSAT went digital in 2025 and is adaptive from fall 2026). Each exam page links to the official source.
- BrainBoro isn't affiliated with NYC Public Schools, NYSED, the College Board, TACHS, Google, Instructure or any curriculum publisher.
