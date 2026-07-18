import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db.js';

export const sessionsRouter = Router();

sessionsRouter.post('/', (req, res) => {
  const id = randomUUID();
  const {
    userAgent = null,
    viewportWidth = null,
    viewportHeight = null,
    metadata = null,
  } = req.body ?? {};

  db.prepare(
    `INSERT INTO sessions (id, started_at, user_agent, viewport_width, viewport_height, metadata)
     VALUES (?, datetime('now'), ?, ?, ?, ?)`
  ).run(
    id,
    userAgent,
    viewportWidth,
    viewportHeight,
    metadata ? JSON.stringify(metadata) : null
  );

  res.status(201).json({ sessionId: id });
});

sessionsRouter.patch('/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const { completed, lastScreenId } = req.body ?? {};

  const session = db.prepare('SELECT id FROM sessions WHERE id = ?').get(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const updates = [];
  const values = [];

  if (typeof completed === 'boolean') {
    updates.push('completed = ?');
    values.push(completed ? 1 : 0);
  }
  if (lastScreenId !== undefined) {
    updates.push('last_screen_id = ?');
    values.push(lastScreenId);
  }
  if (completed === true) {
    updates.push("ended_at = datetime('now')");
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }

  values.push(sessionId);
  db.prepare(`UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  res.json({ ok: true });
});

sessionsRouter.get('/', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT s.*,
        (SELECT COUNT(*) FROM events e WHERE e.session_id = s.id) AS event_count,
        (SELECT confirmed_at FROM date_confirmations d WHERE d.session_id = s.id) AS date_confirmed_at
       FROM sessions s
       ORDER BY s.started_at DESC
       LIMIT 100`
    )
    .all();

  res.json(rows);
});

sessionsRouter.get('/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const events = db
    .prepare(
      `SELECT id, screen_id, event_type, payload, client_timestamp, server_timestamp
       FROM events WHERE session_id = ? ORDER BY id ASC`
    )
    .all(sessionId);

  const confirmation = db
    .prepare('SELECT * FROM date_confirmations WHERE session_id = ?')
    .get(sessionId);

  res.json({ session, events, confirmation: confirmation ?? null });
});
