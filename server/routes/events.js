import { Router } from 'express';
import { db } from '../db.js';

export const eventsRouter = Router();

function parseEvents(body) {
  if (Array.isArray(body?.events)) return body.events;
  if (body?.eventType) return [body];
  return null;
}

eventsRouter.post('/', (req, res) => {
  const events = parseEvents(req.body);
  if (!events?.length) {
    res.status(400).json({ error: 'Expected { events: [...] } or a single event object' });
    return;
  }

  const insert = db.prepare(
    `INSERT INTO events (session_id, screen_id, event_type, payload, client_timestamp)
     VALUES (?, ?, ?, ?, ?)`
  );

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      const { sessionId, screenId = null, eventType, payload = null, clientTimestamp } = row;
      if (!sessionId || !eventType || !clientTimestamp) {
        throw new Error('Each event requires sessionId, eventType, and clientTimestamp');
      }

      const session = db.prepare('SELECT id FROM sessions WHERE id = ?').get(sessionId);
      if (!session) {
        throw new Error(`Unknown session: ${sessionId}`);
      }

      insert.run(
        sessionId,
        screenId,
        eventType,
        payload ? JSON.stringify(payload) : null,
        clientTimestamp
      );
    }
  });

  try {
    insertMany(events);
    res.status(201).json({ ok: true, count: events.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

eventsRouter.get('/stats', (_req, res) => {
  const byType = db
    .prepare(
      `SELECT event_type, COUNT(*) AS count
       FROM events GROUP BY event_type ORDER BY count DESC`
    )
    .all();

  const byScreen = db
    .prepare(
      `SELECT screen_id, COUNT(*) AS count
       FROM events WHERE screen_id IS NOT NULL
       GROUP BY screen_id ORDER BY count DESC`
    )
    .all();

  res.json({ byType, byScreen });
});
