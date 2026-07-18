import { Router } from 'express';
import { db } from '../db.js';

export const confirmationsRouter = Router();

confirmationsRouter.post('/', (req, res) => {
  const { sessionId, selectedDate, selectedTime, activities } = req.body ?? {};

  if (!sessionId || !selectedDate || !selectedTime) {
    res.status(400).json({ error: 'sessionId, selectedDate, and selectedTime are required' });
    return;
  }

  const session = db.prepare('SELECT id FROM sessions WHERE id = ?').get(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const activitiesJson =
    Array.isArray(activities) && activities.length ? JSON.stringify(activities) : null;

  db.prepare(
    `INSERT INTO date_confirmations (session_id, selected_date, selected_time, activities)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(session_id) DO UPDATE SET
       selected_date = excluded.selected_date,
       selected_time = excluded.selected_time,
       activities = excluded.activities,
       confirmed_at = datetime('now')`
  ).run(sessionId, selectedDate, selectedTime, activitiesJson);

  db.prepare(`UPDATE sessions SET completed = 1, ended_at = datetime('now') WHERE id = ?`).run(
    sessionId
  );

  res.status(201).json({ ok: true });
});

confirmationsRouter.get('/', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT d.*, s.started_at, s.user_agent
       FROM date_confirmations d
       JOIN sessions s ON s.id = d.session_id
       ORDER BY d.confirmed_at DESC`
    )
    .all();

  res.json(rows);
});
