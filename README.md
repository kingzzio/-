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

Optional env vars: `BRAINBORO_MODEL` (default `claude-opus-5-5`) and `BRAINBORO_RATE_LIMIT` (AI requests per IP per hour, default 40).

## Deploy (free)

**Vercel:** import the repo, add `ANTHROPIC_API_KEY` as an environment variable, and deploy. `vercel.json` serves `public/` and turns `api/*.js` into serverless functions.

**Any Node host** (Render, Railway, Fly…): `npm start`.

**Static only** (GitHub Pages, Netlify drop): publish the `public/` folder. Everything except AI works.

## Project layout

```
public/            the app (plain HTML/CSS/JS modules, no build step)
  js/data/         study content: math, ela, science, history, exams, curricula
  js/generators.js infinite math question generators (seeded, so battles are fair)
  js/views/        screens: home, explore, study, exams, curriculum, tutor, profile
lib/tutor.js       Claude API calls (tutor chat + quiz generator)
lib/handlers.js    HTTP handlers shared by server.js and api/
api/               Vercel serverless functions
scripts/           content + generator checks
```

## Adding content

Topics live in `public/js/data/*.js`. Each topic has `cards: [[front, back], …]` and `qs: [[question, [choices], correctIndex, explanation], …]`. Link a topic to an exam in `exams.js` or to a curriculum unit in `curricula.js`. Then run:

```bash
npm run check                    # validates ids, answers and links
node scripts/check-generators.js # sanity-checks every math generator
```

## Notes

- Exam formats and dates change (New York is rolling out new science Regents, for example). Each exam page links to the official source. Double-check there.
- Curriculum unit names follow the publishers' public scope and sequence. Schools often reorder units.
- BrainBoro isn't affiliated with NYC Public Schools, NYSED, the College Board, TACHS, or any curriculum publisher.
