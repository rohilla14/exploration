import { Router } from 'express';
import { db } from '../db.js';
import { requireFields } from '../middleware/validate.js';
import { sendDateConfirmationEmails } from '../mailer.js';

export const confirmationsRouter = Router();

confirmationsRouter.post(
  '/',
  requireFields(['sessionId', 'selectedDate', 'selectedTime']),
  async (req, res) => {
    const { sessionId, selectedDate, selectedTime, activities } = req.body ?? {};

    const session = await db.prepare('SELECT id FROM sessions WHERE id = ?').get(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const activitiesJson =
      Array.isArray(activities) && activities.length ? JSON.stringify(activities) : null;

    await db
      .prepare(
        `INSERT INTO date_confirmations (session_id, selected_date, selected_time, activities)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(session_id) DO UPDATE SET
           selected_date = excluded.selected_date,
           selected_time = excluded.selected_time,
           activities = excluded.activities,
           confirmed_at = datetime('now')`
      )
      .run(sessionId, selectedDate, selectedTime, activitiesJson);

    await db
      .prepare(`UPDATE sessions SET completed = 1, ended_at = datetime('now') WHERE id = ?`)
      .run(sessionId);

    // Best-effort: a mail problem never fails the confirmation itself. Awaited (not fired and
    // forgotten) because on a serverless host, work started after the response is sent is not
    // guaranteed to actually finish.
    let mail = { sent: false, reason: 'not_configured' };
    try {
      mail = await sendDateConfirmationEmails({
        selectedDate,
        selectedTime,
        activities: Array.isArray(activities) ? activities : [],
      });
    } catch (err) {
      console.warn('[confirmations] Could not send the calendar invite', err.message);
    }

    res.status(201).json({ ok: true, mailSent: mail.sent });
  }
);

confirmationsRouter.get('/', async (_req, res) => {
  const rows = await db
    .prepare(
      `SELECT d.*, s.started_at, s.user_agent
       FROM date_confirmations d
       JOIN sessions s ON s.id = d.session_id
       ORDER BY d.confirmed_at DESC`
    )
    .all();

  res.json(rows);
});
