import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { DB_PATH } from './db.js';
import { seedIfEmpty } from './seed.js';
import { requireAdminAuth, credentialsConfigured } from './adminAuth.js';
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
dotenv.config({ path: join(__dirname, '.env') });

seedIfEmpty();

const distPath = join(__dirname, '..', 'dist');

const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: allowedOrigin,
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: DB_PATH });
});

// Sessions: public may POST/PATCH; admin list/detail are GET-only.
app.use(
  '/api/sessions',
  (req, res, next) => {
    if (req.method === 'GET') return requireAdminAuth(req, res, next);
    next();
  },
  sessionsRouter
);

// Events: public may POST; admin stats are GET.
app.use(
  '/api/events',
  (req, res, next) => {
    if (req.method === 'GET') return requireAdminAuth(req, res, next);
    next();
  },
  eventsRouter
);

// Confirmations: public may POST; admin list is GET.
app.use(
  '/api/confirmations',
  (req, res, next) => {
    if (req.method === 'GET') return requireAdminAuth(req, res, next);
    next();
  },
  confirmationsRouter
);

// Love notes: public reads (GET); admin creates/edits/deletes.
app.use(
  '/api/love-notes',
  (req, res, next) => {
    if (req.method !== 'GET') return requireAdminAuth(req, res, next);
    next();
  },
  loveNotesRouter
);

// Questions: public answers via POST /:id/answer; admin creates (POST /) and deletes.
app.use(
  '/api/questions',
  (req, res, next) => {
    if (req.method === 'DELETE') return requireAdminAuth(req, res, next);
    if (req.method === 'POST' && (req.path === '/' || req.path === '')) {
      return requireAdminAuth(req, res, next);
    }
    next();
  },
  questionsRouter
);

// Movies: public may list/add/rate; admin deletes.
app.use(
  '/api/movies',
  (req, res, next) => {
    if (req.method === 'DELETE') return requireAdminAuth(req, res, next);
    next();
  },
  moviesRouter
);

// Diary: public may list/add; admin patch/delete.
app.use(
  '/api/diary',
  (req, res, next) => {
    if (req.method === 'PATCH' || req.method === 'DELETE') {
      return requireAdminAuth(req, res, next);
    }
    next();
  },
  diaryRouter
);

const rateLimitMessage = { error: 'Too many requests, please slow down.' };

const musicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.MUSIC_RATE_LIMIT_MAX) || 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});

const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AI_RATE_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});

// Music: public may search/list/add; admin deletes.
app.use(
  '/api/music',
  musicRateLimit,
  (req, res, next) => {
    if (req.method === 'DELETE') return requireAdminAuth(req, res, next);
    next();
  },
  musicRouter
);

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
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Exploration API running on http://localhost:${PORT}`);
  console.log(`Database: ${DB_PATH}`);
  console.log(`CORS allowed origin: ${allowedOrigin}`);
  if (!process.env.ALLOWED_ORIGIN && process.env.NODE_ENV === 'production') {
    console.warn(
      '[cors] ALLOWED_ORIGIN is not set in production — defaulting to http://localhost:5173. Set ALLOWED_ORIGIN to your deployed frontend URL.'
    );
  }
  if (!credentialsConfigured()) {
    console.warn(
      '[admin-auth] ADMIN_USERNAME/ADMIN_PASSWORD missing — /admin and admin-only APIs will refuse requests.'
    );
  }
  if (existsSync(distPath)) {
    console.log(`Serving frontend from ${distPath}`);
    console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
  }
});
