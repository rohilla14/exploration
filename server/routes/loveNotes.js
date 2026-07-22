import { Router } from 'express';
import { db } from '../db.js';

export const loveNotesRouter = Router();

loveNotesRouter.get('/', (req, res) => {
  const { kind } = req.query;

  const rows =
    kind && (kind === 'memory' || kind === 'like')
      ? db.prepare('SELECT * FROM love_notes WHERE kind = ? ORDER BY id DESC').all(kind)
      : db.prepare('SELECT * FROM love_notes ORDER BY id DESC').all();

  res.json(rows);
});

loveNotesRouter.post('/', (req, res) => {
  const { kind, body, occurredOn = null } = req.body ?? {};

  if (!kind || (kind !== 'memory' && kind !== 'like') || !body?.trim()) {
    res.status(400).json({ error: 'kind ("memory" or "like") and body are required' });
    return;
  }

  const result = db
    .prepare('INSERT INTO love_notes (kind, body, occurred_on) VALUES (?, ?, ?)')
    .run(kind, body.trim(), occurredOn);

  const row = db.prepare('SELECT * FROM love_notes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

loveNotesRouter.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { body, occurredOn } = req.body ?? {};

  const existing = db.prepare('SELECT * FROM love_notes WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }

  db.prepare('UPDATE love_notes SET body = ?, occurred_on = ? WHERE id = ?').run(
    body?.trim() ?? existing.body,
    occurredOn !== undefined ? occurredOn : existing.occurred_on,
    id
  );

  res.json(db.prepare('SELECT * FROM love_notes WHERE id = ?').get(id));
});

loveNotesRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM love_notes WHERE id = ?').run(req.params.id);
  res.status(204).end();
});
