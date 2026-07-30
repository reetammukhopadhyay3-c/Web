# Pulse Board

A live trending dashboard that pulls, right now, from:

- **Hacker News** (official Firebase API — top stories)
- **Reddit** (r/popular, top of the day)
- **GitHub Trending** (daily trending repos)

All three sources are fetched **server-side** via a Next.js API route (`app/api/trending/route.js`), so there are no CORS or API-key issues. The frontend polls that route every 3 minutes.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

**Option A — no GitHub needed (fastest):**

```bash
npm install -g vercel
vercel login
vercel --prod
```

Run that from inside this folder. Follow the prompts (accept the defaults — Vercel auto-detects Next.js). You'll get a live URL in under a minute.

**Option B — via GitHub (recommended if you'll keep editing it):**

1. Push this folder to a new GitHub repo.
2. Go to https://vercel.com/new, import the repo.
3. Vercel auto-detects Next.js — click **Deploy**. No environment variables needed.

## Notes

- No API keys required — all three sources are public endpoints.
- The GitHub Trending source works by reading the public trending page's HTML server-side (GitHub has no official trending API). If GitHub changes their page markup, that one channel may return empty — it'll fail gracefully and just show "Nothing came through this cycle" without breaking the rest of the site.
- Reddit occasionally rate-limits generic requests; the route sends a descriptive User-Agent to reduce that.
- To swap in different subreddits or add more sources, edit `app/api/trending/route.js`.
