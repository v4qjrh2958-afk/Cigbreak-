# Cig Break (Web MVP)

A tiny demo app: it nudges you to take a "cig break" (cig like Cignetti, not cigarette), plays a clip, then asks if you feel better… if not, it plays another.

## Run locally
1. Install Node.js (v18 or newer).
2. In this folder:
   ```bash
   npm install
   npm run dev
   ```
3. Open http://localhost:3000

## Deploy free on Vercel (recommended)
Fastest path: GitHub + Vercel.

1. Create a new GitHub repo and push this project.
2. Create a free Vercel account.
3. In Vercel: **Add New Project** → import your GitHub repo.
4. Framework preset should auto-detect **Next.js**.
5. Click **Deploy**.

## Notes about reminders
This MVP uses browser notifications + a timer. It is best-effort and mainly for a demo.

## Swap clips
Edit `pages/index.tsx` and replace the `CLIPS` array with your licensed content or your own recordings.
