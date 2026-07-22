import { Router } from 'express';
import { db } from '../db.js';
import { searchTracks, credentialsConfigured } from '../spotify.js';

export const musicRouter = Router();

musicRouter.get('/search', async (req, res) => {
  const { q } = req.query;

  if (!q?.trim()) {
    res.status(400).json({ error: 'q query param is required' });
    return;
  }

  if (!credentialsConfigured()) {
    res.status(503).json({
      error:
        'Spotify search is not configured yet. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to server/.env (free, from developer.spotify.com/dashboard).',
    });
    return;
  }

  try {
    const results = await searchTracks(q.trim());
    res.json(results);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

musicRouter.get('/songs', (_req, res) => {
  res.json(db.prepare('SELECT * FROM songs ORDER BY id DESC').all());
});

musicRouter.post('/songs', (req, res) => {
  const {
    spotifyId = null,
    title,
    artist = null,
    albumArt = null,
    previewUrl = null,
    addedBy = 'her',
    note = null,
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
      `INSERT INTO songs (spotify_id, title, artist, album_art, preview_url, added_by, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(spotifyId, title.trim(), artist, albumArt, previewUrl, addedBy, note);

  res.status(201).json(db.prepare('SELECT * FROM songs WHERE id = ?').get(result.lastInsertRowid));
});

musicRouter.post('/songs/bulk-import', async (req, res) => {
  const { titles, addedBy = 'her' } = req.body ?? {};

  if (!Array.isArray(titles) || !titles.length) {
    res.status(400).json({ error: 'titles must be a non-empty array of strings' });
    return;
  }

  if (!credentialsConfigured()) {
    res.status(503).json({
      error: 'Spotify search is not configured yet. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to server/.env.',
    });
    return;
  }

  const added = [];
  const notFound = [];
  const insert = db.prepare(
    `INSERT INTO songs (spotify_id, title, artist, album_art, preview_url, added_by)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  for (const raw of titles) {
    const query = String(raw).trim();
    if (!query) continue;

    try {
      const results = await searchTracks(query, 1);
      const match = results[0];
      if (!match) {
        notFound.push(query);
        continue;
      }
      insert.run(match.spotifyId, match.title, match.artist, match.albumArt, match.previewUrl, addedBy);
      added.push(match);
    } catch {
      notFound.push(query);
    }
  }

  res.status(201).json({ added, notFound });
});

musicRouter.delete('/songs/:id', (req, res) => {
  db.prepare('DELETE FROM songs WHERE id = ?').run(req.params.id);
  res.status(204).end();
});
