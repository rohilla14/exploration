# Exploration

Private gift site (Vite frontend + Express API).

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

Set the same `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables in your host (Railway, Fly, VPS, etc.). Do not commit real passwords to git.

If either variable is missing in production, `/admin` and admin-only write/delete/list endpoints will return an error instead of serving the panel.

### What stays public

The main gift experience keeps working without Basic Auth: sessions, events, date confirmations, reading/answering questions, movies, diary writes she makes, playlist search/add, and AI sparks.
