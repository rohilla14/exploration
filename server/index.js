import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { DB_PATH } from './db.js';
import { seedIfEmpty } from './seed.js';
import { sessionsRouter } from './routes/sessions.js';
import { eventsRouter } from './routes/events.js';
import { confirmationsRouter } from './routes/confirmations.js';
import { loveNotesRouter } from './routes/loveNotes.js';
import { questionsRouter } from './routes/questions.js';
import { moviesRouter } from './routes/movies.js';
import { diaryRouter } from './routes/diary.js';
import { musicRouter } from './routes/music.js';
import { aiRouter } from './routes/ai.js';

seedIfEmpty();

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = join(__dirname, '..', 'dist');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: DB_PATH });
});

app.use('/api/sessions', sessionsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/confirmations', confirmationsRouter);
app.use('/api/love-notes', loveNotesRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/movies', moviesRouter);
app.use('/api/diary', diaryRouter);
app.use('/api/music', musicRouter);
app.use('/api/ai', aiRouter);

if (existsSync(distPath)) {
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
  if (existsSync(distPath)) {
    console.log(`Serving frontend from ${distPath}`);
    console.log(`Admin dashboard: http://localhost:${PORT}/admin.html`);
  }
});
