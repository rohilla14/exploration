import { Router } from 'express';
import { db } from '../db.js';
import { searchMovies, credentialsConfigured } from '../tmdb.js';

export const moviesRouter = Router();

function moviesWithRatings() {
  const movies = db.prepare('SELECT * FROM movies ORDER BY id DESC').all();
  const ratings = db.prepare('SELECT * FROM movie_ratings').all();

  return movies.map((m) => ({
    ...m,
    ratings: ratings.filter((r) => r.movie_id === m.id),
  }));
}

moviesRouter.get('/search', async (req, res) => {
  const { q } = req.query;

  if (!q?.trim()) {
    res.status(400).json({ error: 'q query param is required' });
    return;
  }

  if (!credentialsConfigured()) {
    res.status(503).json({
      error:
        'TMDB search is not configured yet. Add TMDB_API_KEY to server/.env (free, from themoviedb.org/settings/api).',
    });
    return;
  }

  try {
    const results = await searchMovies(q.trim());
    res.json(results);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

moviesRouter.get('/', (_req, res) => {
  res.json(moviesWithRatings());
});

moviesRouter.post('/', (req, res) => {
  const {
    title,
    note = null,
    posterEmoji = null,
    addedBy = 'you',
    tmdbId = null,
    posterPath = null,
  } = req.body ?? {};

  if (!title?.trim()) {
    res.status(400).json({ error: 'title is required' });
    return;
  }
  if (addedBy !== 'you' && addedBy !== 'her') {
    res.status(400).json({ error: 'addedBy must be "you" or "her"' });
    return;
  }

  const result = db
    .prepare(
      `INSERT INTO movies (title, note, poster_emoji, tmdb_id, poster_path, added_by)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(title.trim(), note, posterEmoji, tmdbId, posterPath, addedBy);

  const row = db.prepare('SELECT * FROM movies WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...row, ratings: [] });
});

moviesRouter.post('/:id/rate', (req, res) => {
  const { id } = req.params;
  const { rater, rating, note = null } = req.body ?? {};

  if (rater !== 'you' && rater !== 'her') {
    res.status(400).json({ error: 'rater must be "you" or "her"' });
    return;
  }
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    res.status(400).json({ error: 'rating must be an integer 1-5' });
    return;
  }

  const movie = db.prepare('SELECT id FROM movies WHERE id = ?').get(id);
  if (!movie) {
    res.status(404).json({ error: 'Movie not found' });
    return;
  }

  db.prepare(
    `INSERT INTO movie_ratings (movie_id, rater, rating, note)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(movie_id, rater) DO UPDATE SET
       rating = excluded.rating,
       note = excluded.note,
       rated_at = datetime('now')`
  ).run(id, rater, ratingNum, note);

  const ratings = db.prepare('SELECT * FROM movie_ratings WHERE movie_id = ?').all(id);
  res.status(201).json({ ratings });
});

moviesRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM movies WHERE id = ?').run(req.params.id);
  res.status(204).end();
});
