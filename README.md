# 🧠 BrainBoro

**Free test prep and study app for NYC students** (and anyone in grades 6–12).

SHSAT · TACHS · Regents (Algebra I, Geometry, Algebra II, ELA, Biology, Earth & Space, Chemistry, Physics, Global, U.S. History) · SAT/PSAT · plus every grade 6–12 math, ELA, science and history topic.

## What's inside

| Feature | What it does |
|---|---|
| 🃏 **Flashcards** | ~590 cards with spaced repetition (Leitner boxes). "Review due" brings cards back right before you'd forget them. |
| ✅ **Quizzes** | Hand-written exam-style questions with explanations, combo streaks and XP. |
| ♾️ **Unlimited practice** | 43 math generators (ratios, slope, systems, quadratics, trig, logs, derivatives…) make fresh problems forever. |
| ⏱️ **Timed practice tests** | Real-test feel for every exam: no hints until the end, then a review and a "study these next" list. |
| ⚡ **Daily Brain Blast** | 5 questions a day, **the same for everyone**, so friends can compare. |
| 🥊 **Brain Battles** | Play 10 questions, then send a link. Your friend gets the exact same questions and sees your score. They can send theirs back. This is the viral loop. |
| 🗺️ **Curriculum Finder** | Pick your school type → curriculum (Illustrative Math, Eureka Math/EngageNY, Amplify Desmos, enVision, Big Ideas, CPM, NYC Reads, Amplify ELA, Amplify Science…) → course → unit, and jump straight to matching practice. |
| 🤖 **Boro, the AI tutor** | Streaming chat with *Hint / Explain / Quiz me* modes, photos of homework, and "Explain with Boro" on any missed question. Also makes **brand-new AI quizzes** on any topic. |
| 🕹️ **Cheat Codes** (Premium) | 30-second animated whiteboard walkthroughs of test shortcuts (percent-of-a-percent, plug in the answers, ×11, Rule of 72, the comma delete test…), with captions and optional voiceover. 20 hand-made ones (first 3 free) plus an AI Cheat Code for any quiz question. Shared links play for anyone, which helps it spread. |
| 📅 **Planner** | Day-by-day homework list with classes, due times, priority, points and steps. Includes a 25-minute focus timer and an "all done" streak. Imports assignments from a **Canvas / Schoology / Google Classroom calendar feed**. "Break into steps" (Premium, AI) and "Help me with this" (Boro coaches in hint mode). |
| 📂 **Free Resources** | Links to official free materials: past Regents exams + answer keys, the NYC SHSAT practice portal, Bluebook SAT tests, Eureka Math free PDFs, Illustrative Math, OpenSciEd, OpenStax, CommonLit and more. |
| 👑 **Premium** | Code-based membership (no accounts): every Cheat Code, AI Cheat Codes, AI planner steps, 5× AI allowance. |
| 🔥 **Game stuff** | XP, levels, daily goal, streaks, 12 badges, mistake notebook, confetti. |
| 📱 **Works like an app** | Installable (PWA), works offline (except AI), light/dark mode, no account. Progress saves on the device, with backup/restore. |

## Run it

```bash
npm install
npm start                      # http://localhost:3000
```

Everything except the AI tutor works without any setup. To turn on Boro:

```bash
ANTHROPIC_API_KEY=sk-ant-... npm start
```

Optional env vars: `BRAINBORO_MODEL` (default `claude-opus-5-5`; `claude-haiku-5-5` costs much less at scale) and `BRAINBORO_RATE_LIMIT` (AI requests per IP per hour, default 40).

### Turning on Premium

| Variable | What it does |
|---|---|
| `BRAINBORO_PREMIUM_SECRET` | Long random string (16+ characters) used to sign membership tokens. Required. |
| `BRAINBORO_PREMIUM_CODES` | Comma-separated codes that unlock Premium, e.g. `BORO-7Q2K,BORO-X9P1`. |
| `BRAINBORO_CHECKOUT_URL` | Optional payment link (e.g. a Stripe Payment Link) shown on the Upgrade page. Send buyers a code after they pay. |
| `BRAINBORO_PREMIUM_DAYS` | How long a redeemed code lasts (default 31). |

Links like `/#/premium?code=BORO-7Q2K` redeem automatically. AI Premium features are checked on the server. The hand-made Cheat Codes ship inside the page, so a technical user could read them; that's fine for teasers. Move them behind the API if that matters to you. Since most users are minors, make purchases go through a parent.

## Deploy (free)

**Vercel:** import the repo, add `ANTHROPIC_API_KEY` as an environment variable, and deploy. `vercel.json` serves `public/` and turns `api/*.js` into serverless functions.

**Any Node host** (Render, Railway, Fly…): `npm start`.

**Static only** (GitHub Pages, Netlify drop): publish the `public/` folder. Everything except AI works.

## Project layout

```
public/            the app (plain HTML/CSS/JS modules, no build step)
  js/data/         study content: math, ela, science, history, exams, curricula
  js/generators.js infinite math question generators (seeded, so battles are fair)
  js/views/        screens: home, explore, study, exams, curriculum, tutor, profile,
                   cheats, planner, resources, premium
lib/tutor.js       Claude API calls (tutor chat, quizzes, Cheat Codes, planner steps)
lib/premium.js     signed Premium tokens
lib/calendar.js    .ics feed import with SSRF protection
lib/handlers.js    HTTP handlers shared by server.js and api/
api/               Vercel serverless functions
scripts/           content + generator checks
```

## Adding content

Topics live in `public/js/data/*.js`. Each topic has `cards: [[front, back], …]` and `qs: [[question, [choices], correctIndex, explanation], …]`. Link a topic to an exam in `exams.js` or to a curriculum unit in `curricula.js`. Then run:

```bash
npm run check                    # validates ids, answers, cheat codes, resources and links
node scripts/check-generators.js # sanity-checks every math generator
node scripts/check-server.js     # calendar parser, feed URL safety, premium tokens
```

## Notes

- **Curriculum PDFs are linked, not copied.** Eureka Math, OpenStax and OpenSciEd are free under non-commercial licenses (CC BY-NC / CC BY-NC-SA), and a paid Premium tier counts as commercial use. So BrainBoro sends students to the official download pages. That also keeps them on the newest versions.
- **The planner reads calendar feeds, not Canvas logins.** Importing grades (like some planner apps do) would need each school's Canvas developer key or student access tokens.
- The calendar endpoint only fetches public `https` feeds and refuses private/internal addresses.

- Exam formats and dates change (New York is rolling out new science Regents, for example). Each exam page links to the official source. Double-check there.
- Curriculum unit names follow the publishers' public scope and sequence. Schools often reorder units.
- BrainBoro isn't affiliated with NYC Public Schools, NYSED, the College Board, TACHS, or any curriculum publisher.
