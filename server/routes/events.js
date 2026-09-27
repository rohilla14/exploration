import { Router } from 'express';
import { db } from '../db.js';

export const eventsRouter = Router();

function parseEvents(body) {
  if (Array.isArray(body?.events)) return body.events;
  if (body?.eventType) return [body];
  return null;
}

eventsRouter.post('/', async (req, res) => {
  const events = parseEvents(req.body);
  if (!events?.length) {
    res.status(400).json({ error: 'Expected { events: [...] } or a single event object' });
    return;
  }

  if (events.length > 100) {
    res.status(413).json({ error: 'Too many events in one request (max 100)' });
    return;
  }

  try {
    const sessionIds = [...new Set(events.map((row) => row.sessionId))];
    for (const row of events) {
      if (!row.sessionId || !row.eventType || !row.clientTimestamp) {
        throw new Error('Each event requires sessionId, eventType, and clientTimestamp');
      }
    }

    // One round trip to check every referenced session exists, before writing anything.
    const placeholders = sessionIds.map(() => '?').join(',');
    const known = await db
      .prepare(`SELECT id FROM sessions WHERE id IN (${placeholders})`)
      .all(...sessionIds);
    const knownIds = new Set(known.map((r) => r.id));
    for (const id of sessionIds) {
      if (!knownIds.has(id)) throw new Error(`Unknown session: ${id}`);
    }

    // A single atomic batch, so a mid-way failure never leaves half the events saved.
    await db.batch(
      events.map((row) => ({
        sql: `INSERT INTO events (session_id, screen_id, event_type, payload, client_timestamp)
              VALUES (?, ?, ?, ?, ?)`,
        args: [
          row.sessionId,
          row.screenId ?? null,
          row.eventType,
          row.payload ? JSON.stringify(row.payload) : null,
          row.clientTimestamp,
        ],
      }))
    );

    res.status(201).json({ ok: true, count: events.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

eventsRouter.get('/stats', async (_req, res) => {
  const byType = await db
    .prepare(
      `SELECT event_type, COUNT(*) AS count
       FROM events GROUP BY event_type ORDER BY count DESC`
    )
    .all();

  const byScreen = await db
    .prepare(
      `SELECT screen_id, COUNT(*) AS count
       FROM events WHERE screen_id IS NOT NULL
       GROUP BY screen_id ORDER BY count DESC`
    )
    .all();

  res.json({ byType, byScreen });
});
