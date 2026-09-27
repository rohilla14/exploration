import express from 'express';
import cors from 'cors';
import {
  adminFor,
  limiter,
  limitFields,
  safeUrlFields,
  writeLimiter,
} from './middleware/limits.js';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { requireAdminAuth } from './adminAuth.js';
import { sessionsRouter } from './routes/sessions.js';
import { eventsRouter } from './routes/events.js';
import { confirmationsRouter } from './routes/confirmations.js';
import { loveNotesRouter } from './routes/loveNotes.js';
import { questionsRouter } from './routes/questions.js';
import { moviesRouter } from './routes/movies.js';
import { diaryRouter } from './routes/diary.js';
import { musicRouter } from './routes/music.js';
import { aiRouter } from './routes/ai.js';
import { horoscopeRouter } from './routes/horoscope.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const distPath = join(__dirname, '..', 'dist');

export const app = express();
export const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

// Vercel always sits its own proxy in front of the function (and sets VERCEL=1 itself), so
// trust it automatically there; everywhere else (Railway, Fly, cloudflared) this needs an
// explicit TRUST_PROXY=1 since the app has no way to know a proxy is present.
if (process.env.TRUST_PROXY || process.env.VERCEL) {
  const setting = process.env.TRUST_PROXY || '1';
  app.set('trust proxy', /^\d+$/.test(setting) ? Number(setting) : setting);
}

app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Global ceiling for every API call, then per-route write limits below.
app.use('/api', limiter(600, 'API_RATE_LIMIT_MAX'));

// Sessions: public may POST/PATCH; admin list/detail are GET-only.
app.use(
  '/api/sessions',
  writeLimiter(60, 'SESSIONS_RATE_LIMIT_MAX'),
  adminFor({ methods: ['GET'] }),
  limitFields({ userAgent: 500 }),
  sessionsRouter
);

// Events: public may POST (batched by the client); admin stats are GET.
app.use(
  '/api/events',
  writeLimiter(300, 'EVENTS_RATE_LIMIT_MAX'),
  adminFor({ methods: ['GET'] }),
  eventsRouter
);

// Confirmations: public may POST; admin list is GET.
app.use(
  '/api/confirmations',
  writeLimiter(20, 'CONFIRMATIONS_RATE_LIMIT_MAX'),
  adminFor({ methods: ['GET'] }),
  limitFields({ sessionId: 100, selectedDate: 50, selectedTime: 50 }),
  confirmationsRouter
);

// Love notes: public reads (GET); admin creates/edits/deletes.
app.use(
  '/api/love-notes',
  adminFor({ except: ['GET'] }),
  limitFields({ body: 2000 }),
  loveNotesRouter
);

// Questions: public answers via POST /:id/answer; admin creates (POST /) and deletes.
app.use(
  '/api/questions',
  writeLimiter(60, 'QUESTIONS_RATE_LIMIT_MAX'),
  adminFor({ methods: ['DELETE'] }),
  adminFor({ methods: ['POST'], onlyRoot: true }),
  limitFields({ prompt: 500, myAnswer: 4000, herAnswer: 4000 }),
  questionsRouter
);

// Movies: public may list/add/rate; admin deletes.
app.use(
  '/api/movies',
  writeLimiter(60, 'MOVIES_RATE_LIMIT_MAX'),
  adminFor({ methods: ['DELETE'] }),
  limitFields({ title: 200, note: 1000, posterEmoji: 16 }),
  safeUrlFields(['posterPath']),
  moviesRouter
);

// Diary: public may list/add; admin patch/delete.
app.use(
  '/api/diary',
  writeLimiter(60, 'DIARY_RATE_LIMIT_MAX'),
  adminFor({ methods: ['PATCH', 'DELETE'] }),
  limitFields({ entryDate: 20, body: 5000, mood: 16 }),
  diaryRouter
);

// Music: public may search/list/add; admin deletes.
app.use(
  '/api/music',
  limiter(60, 'MUSIC_RATE_LIMIT_MAX'),
  adminFor({ methods: ['DELETE'] }),
  limitFields({ title: 200, artist: 200, note: 1000, spotifyId: 64 }),
  safeUrlFields(['albumArt', 'previewUrl']),
  musicRouter
);

const aiRateLimit = limiter(20, 'AI_RATE_LIMIT_MAX');
app.use('/api/ai', aiRateLimit, aiRouter);
app.use('/api/horoscope', aiRateLimit, horoscopeRouter);

if (existsSync(distPath)) {
  // Gate admin HTML before static so /admin.html is not open.
  app.use((req, res, next) => {
    const { path } = req;
    if (path === '/admin' || path === '/admin.html' || path.startsWith('/admin/')) {
      return requireAdminAuth(req, res, next);
    }
    next();
  });

  app.use(express.static(distPath));
  app.get('/admin', (_req, res) => {
    res.sendFile(join(distPath, 'admin.html'));
  });
  app.get('/admin/*', (_req, res) => {
    res.sendFile(join(distPath, 'admin.html'));
  });
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(join(distPath, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  if (err.status && err.status < 500) {
    res
      .status(err.status)
      .json({ error: err.type === 'entity.too.large' ? 'Request body too large' : 'Bad request' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
