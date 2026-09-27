# Exploration

Private gift site (Vite frontend + Express API + libSQL/SQLite).

## Quick start

```bash
npm install
cp server/.env.example server/.env   # then fill in what you need
npm run dev                          # web on :5173, API on :3001
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server and API together |
| `npm run build` | Production build into `dist/` |
| `npm run preview:prod` | Build, then serve `dist/` and the API from Express on :3001 |
| `npm run share` | Build, serve, and open a public tunnel (see `scripts/share.sh`) |
| `npm test` | API tests (auth, validation, limits) using a throwaway database |
| `npm run lint` | ESLint |
| `npm run format` / `format:check` | Prettier |

## Deploying

The database is [libSQL](https://turso.tech) via `@libsql/client`. Locally it just writes to a
file (`server/data/exploration.db`, or `DB_PATH`), no setup needed. On a host with a read-only
or ephemeral filesystem — Vercel, most serverless platforms — set `TURSO_DATABASE_URL` and
`TURSO_AUTH_TOKEN` instead and it talks to a real database over the network. Same code either
way; `server/db.js` picks the mode based on whether those two variables are set.

### Vercel

1. Create a free database: [turso.tech](https://turso.tech) → sign up → `turso db create our-world`
   (or use their web dashboard). Then grab the two values it needs:
   ```bash
   turso db show our-world --url            # → TURSO_DATABASE_URL
   turso db tokens create our-world         # → TURSO_AUTH_TOKEN
   ```
2. Push this repo to GitHub, then [import it on vercel.com](https://vercel.com/new). Vercel
   reads `vercel.json` automatically — no other config needed.
3. In the Vercel project's **Settings → Environment Variables**, add:
   - `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` — from step 1
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD` — see below; required for `/admin`
   - Optional: `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET`, `TMDB_API_KEY`,
     `OPENROUTER_API_KEY` (see `server/.env.example` for what each unlocks)
4. Deploy. The site and the API (`/api/*`) are served from the same domain, so nothing else
   needs pointing at anything.

One tradeoff of this setup: `vercel.json` only routes `/api/*` requests to the server function —
`/admin` and `/admin.html` are served as static files, like any other page, so the login-gated
*page shell* is reachable without a password. That is fine: the shell has no data in it, and
every admin API call it makes (listing sessions, questions, diary entries, and so on) still goes
through `requireAdminAuth` and refuses without the real password. On a plain Node host (below),
`/admin` itself is also gated before that.

### Any other Node host (Railway, Fly, a VPS, ...)

Run `npm run build` then `npm start` (`node server/index.js`). Set these in the host's environment:

- `ADMIN_USERNAME`, `ADMIN_PASSWORD` — required for `/admin` (serve over HTTPS; Basic Auth is plain text otherwise)
- `ALLOWED_ORIGIN` — the deployed frontend URL if it is served from a different origin
- `TRUST_PROXY=1` — when behind a proxy or tunnel, so rate limits use the real client IP
- `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` — only if the host's disk is not persistent; otherwise leave unset and it uses a local file
- `DB_PATH` — a path on persistent storage, if not using Turso (defaults to `server/data/exploration.db`)

See `server/.env.example` for the rate-limit overrides and optional Spotify / TMDB / OpenRouter keys.

## API protection

Public write endpoints are rate limited per IP and capped in body size and field length. Image URLs saved by the API must be `http(s)`. Request bodies over 100 kb are refused.

## Photos

Every photo is listed in the `gallery` array in `src/config.js` (with an optional caption) and is also assigned to one or more screens under `photos`. Add a photo by dropping it in `public/assets/` and adding one line to `gallery`. Keep photos under about 1600 px on the long edge and strip location metadata (re-saving through an image editor or script does this). Unused originals live in `originals/` so they are not served.

## Admin panel authentication

The admin dashboard (`/admin`) and admin-only API endpoints are protected with **HTTP Basic Auth**. Without credentials configured, those routes **fail closed** (they refuse access) — they do not stay open.

### Local setup

1. Copy `server/.env.example` to `server/.env` (if you do not already have one).
2. Set:

```bash
ADMIN_USERNAME=your-username
ADMIN_PASSWORD=a-long-random-secret
```

3. Restart the API (`npm run dev` or your process manager).
4. Visit `/admin` — the browser will show its native login prompt.

### Production

Set the same `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables in your host: Vercel's
project settings, or Railway/Fly/a VPS's own env config. Do not commit real passwords to git.

If either variable is missing in production, `/admin` and admin-only write/delete/list endpoints will return an error instead of serving the panel.

### What stays public

The main gift experience keeps working without Basic Auth: sessions, events, date confirmations, reading/answering questions, movies, diary writes she makes, playlist search/add, and AI sparks.
