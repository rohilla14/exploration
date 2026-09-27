import { Router } from 'express';
import { db } from '../db.js';
import { searchTracks, credentialsConfigured } from '../spotify.js';

export const musicRouter = Router();

/**
 * Pull the video id out of whatever YouTube link was pasted, or accept a bare id.
 * Returns null when there is nothing usable, so a bad paste never breaks the row.
 * @param {unknown} value
 */
function parseYoutubeId(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (/^[\w-]{11}$/.test(raw)) return raw;
  const m = raw.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

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

musicRouter.get('/songs', async (_req, res) => {
  res.json(await db.prepare('SELECT * FROM songs ORDER BY id DESC').all());
});

musicRouter.post('/songs', async (req, res) => {
  const {
    spotifyId = null,
    title,
    artist = null,
    albumArt = null,
    previewUrl = null,
    addedBy = 'her',
    note = null,
    youtubeId = null,
  } = req.body ?? {};

  if (!title?.trim()) {
    res.status(400).json({ error: 'title is required' });
    return;
  }
  if (addedBy !== 'you' && addedBy !== 'her') {
    res.status(400).json({ error: 'addedBy must be "you" or "her"' });
    return;
  }

  const result = await db
    .prepare(
      `INSERT INTO songs (spotify_id, title, artist, album_art, preview_url, added_by, note, youtube_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      spotifyId,
      title.trim(),
      artist,
      albumArt,
      previewUrl,
      addedBy,
      note,
      parseYoutubeId(youtubeId)
    );

  res
    .status(201)
    .json(await db.prepare('SELECT * FROM songs WHERE id = ?').get(result.lastInsertRowid));
});

musicRouter.post('/songs/bulk-import', async (req, res) => {
  const { titles, addedBy = 'her' } = req.body ?? {};

  if (!Array.isArray(titles) || !titles.length) {
    res.status(400).json({ error: 'titles must be a non-empty array of strings' });
    return;
  }

  if (!credentialsConfigured()) {
    res.status(503).json({
      error:
        'Spotify search is not configured yet. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to server/.env.',
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
      await insert.run(
        match.spotifyId,
        match.title,
        match.artist,
        match.albumArt,
        match.previewUrl,
        addedBy
      );
      added.push(match);
    } catch {
      notFound.push(query);
    }
  }

  res.status(201).json({ added, notFound });
});

musicRouter.delete('/songs/:id', async (req, res) => {
  await db.prepare('DELETE FROM songs WHERE id = ?').run(req.params.id);
  res.status(204).end();
});
