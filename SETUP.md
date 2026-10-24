# Put BrainBoro online (about 15 minutes, $0, AI included)

You'll end up with a link like `https://brainboro.vercel.app` that anyone can open on their phone and install like an app. No coding needed: it's all clicking.

> **Before you start:** merge the pull request on GitHub (open the PR → green **Merge pull request** button), so the `main` branch has the app.

---

## Step 1: Put the site online (5 min)

1. Go to **vercel.com** → **Sign Up** → **Continue with GitHub** (use the same GitHub account that has this repo).
2. Click **Add New… → Project**.
3. Find this repo in the list → **Import**.
4. Project name: `brainboro` (this becomes your link: `brainboro.vercel.app`).
5. Don't change anything else → click **Deploy**.
6. Wait about 1 minute → click **Continue to Dashboard** → **Visit**. 🎉 The site is live.

Or use the one-click button in the README: **Deploy with Vercel**.

At this point flashcards, quizzes, tests, battles, the planner, Cheat Codes and everything else work. The next steps turn on accounts and AI (both free).

## Step 2: Turn on accounts (2 min, free)

Accounts need a small database so logins don't disappear.

1. In your Vercel project, click the **Storage** tab.
2. Click **Create Database** (or **Browse Marketplace**) → pick **Upstash** → **Redis** → **Continue**.
3. Free plan → name it `brainboro` → **Create** → make sure your project is checked → **Connect**.
4. Go to **Deployments** → the ⋯ menu on the top one → **Redeploy**.

Done. Sign up / log in now works and saves forever. (The login secret is created automatically.)

## Step 3: Turn on the AI for free (3 min, $0)

This powers Snap & Answer, Boro, Essay Coach, Cheat Codes and AI quizzes.

> Google and Groq require the account holder to be an adult. If you're under 18, have a parent or guardian make these keys.

**Free option A: Google Gemini (recommended)**
1. Go to **aistudio.google.com** → sign in with Google → **Get API key** → **Create API key** → copy it.
2. In Vercel: your project → **Settings → Environment Variables** → Name `GEMINI_API_KEY`, Value = the key → **Save**.
3. **Deployments → ⋯ → Redeploy.** Done: the AI works, and it reads homework photos too.

**Free option B: Groq (add it as a backup)**
1. Go to **console.groq.com** → sign up → **API Keys** → **Create API Key** → copy it.
2. In Vercel add `GROQ_API_KEY` = the key → **Save** → **Redeploy**.

If you add both, BrainBoro uses Gemini first. When Gemini runs out of free uses for the day, it switches to Groq on its own. Your **Admin dashboard** shows which AI is on.

**Things to know about free AI**
- Free tiers have daily limits (they change; check each site's limits page). For a few hundred students a day, Gemini + Groq together usually cover it. When both run out, students see "The free AI is busy, try again in a bit."
- On Google's free tier, Google may use what's sent to improve its products. Students shouldn't type personal info (Boro already tells them not to).
- If Google renames its models, set `GEMINI_MODEL` (default `gemini-flash-lite-latest`, which follows Google's newest Flash-Lite automatically).

**Paid option: Claude (best answers)**
1. **console.anthropic.com** → sign up → **Billing**: add $5 and set a monthly limit → **API Keys → Create Key**.
2. In Vercel add `ANTHROPIC_API_KEY` = the key (and `BRAINBORO_MODEL` = `claude-haiku-5-5` to keep it cheap) → **Redeploy**.

With Claude plus the free keys, Claude goes first and the free ones are the backup. To put the free ones first, add `AI_PROVIDERS` = `gemini,groq,anthropic`.

## Step 4: Google sign-in + Google Classroom + make yourself admin (5 min, free)

1. Go to **console.cloud.google.com** → sign in with **esanni104@gmail.com** → top bar **Select a project → New Project** → name `BrainBoro` → **Create**.
2. Search bar: **Google Classroom API** → **Enable**.
3. Left menu **APIs & Services → OAuth consent screen** → **Get started**:
   - App name `BrainBoro`, support email = yours → Audience **External** → your email again → **Create**.
   - **Data Access → Add or remove scopes** → search `classroom` → check **classroom.courses.readonly** and **classroom.coursework.me.readonly** → **Update → Save**.
   - **Audience → Test users → Add users** → add your email (and up to 100 friends who want Classroom import while Google reviews the app).
4. **Clients → Create client** → type **Web application** → under **Authorized JavaScript origins** click **Add URI** → paste your site link (e.g. `https://brainboro.vercel.app`) → **Create** → copy the **Client ID**.
5. In Vercel → **Settings → Environment Variables** → Name `GOOGLE_CLIENT_ID`, Value = the Client ID → **Save** → **Redeploy**.
6. Open your site → **Continue with Google** with **esanni104@gmail.com**. You're now admin: Me tab → **Admin dashboard**, and everything is unlocked.

> Google sign-in works for everyone right away. **Classroom import** only works for test users until Google approves the app (in the Google console: **Audience → Publish app**, then submit for verification; it can take a few weeks). Some school Google accounts block outside apps until the school's IT allows them. Those students can use the **Calendar Link** option instead.

## Step 5: Get it on people's phones

Send people your link. On their phone:

- **iPhone:** open in **Safari** → **Share** ⬆️ → **Add to Home Screen** → **Add**.
- **Android:** open in **Chrome** → tap **Get the BrainBoro app** in the app (or menu ⋮ → **Install app**).

It gets a real icon, opens full screen, works offline, and on Android shows up when you share a photo.

## Optional

- **Sell Premium:** make a free Stripe account → create a **Payment Link** → put it in `BRAINBORO_CHECKOUT_URL`. When someone pays, make a code in **Admin → Premium codes** and send it to them.
- **Your own domain** (like `brainboro.com`, about $10/year): Vercel → **Settings → Domains**.
- **Play Store:** go to **pwabuilder.com** → paste your link → **Package for stores → Android**. That gives you a file to upload to Google Play ($25 one time). Apple's App Store needs a $99/year developer account and a Mac.
