import { Router } from 'express';
import { db } from '../db.js';

export const moviesRouter = Router();

function moviesWithRatings() {
  const movies = db.prepare('SELECT * FROM movies ORDER BY id DESC').all();
  const ratings = db.prepare('SELECT * FROM movie_ratings').all();

  return movies.map((m) => ({
    ...m,
    ratings: ratings.filter((r) => r.movie_id === m.id),
  }));
}

moviesRouter.get('/', (_req, res) => {
  res.json(moviesWithRatings());
});

moviesRouter.post('/', (req, res) => {
  const { title, note = null, posterEmoji = null, addedBy = 'you' } = req.body ?? {};

  if (!title?.trim()) {
    res.status(400).json({ error: 'title is required' });
    return;
  }
  if (addedBy !== 'you' && addedBy !== 'her') {
    res.status(400).json({ error: 'addedBy must be "you" or "her"' });
    return;
  }

  const result = db
    .prepare('INSERT INTO movies (title, note, poster_emoji, added_by) VALUES (?, ?, ?, ?)')
    .run(title.trim(), note, posterEmoji, addedBy);

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
