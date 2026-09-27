import { Router } from 'express';
import { db } from '../db.js';

export const loveNotesRouter = Router();

loveNotesRouter.get('/', async (req, res) => {
  const { kind } = req.query;

  const rows =
    kind && (kind === 'memory' || kind === 'like')
      ? await db.prepare('SELECT * FROM love_notes WHERE kind = ? ORDER BY id DESC').all(kind)
      : await db.prepare('SELECT * FROM love_notes ORDER BY id DESC').all();

  res.json(rows);
});

loveNotesRouter.post('/', async (req, res) => {
  const { kind, body, occurredOn = null } = req.body ?? {};

  if (!kind || (kind !== 'memory' && kind !== 'like') || !body?.trim()) {
    res.status(400).json({ error: 'kind ("memory" or "like") and body are required' });
    return;
  }

  const result = await db
    .prepare('INSERT INTO love_notes (kind, body, occurred_on) VALUES (?, ?, ?)')
    .run(kind, body.trim(), occurredOn);

  const row = await db.prepare('SELECT * FROM love_notes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

loveNotesRouter.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { body, occurredOn } = req.body ?? {};

  const existing = await db.prepare('SELECT * FROM love_notes WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }

  await db
    .prepare('UPDATE love_notes SET body = ?, occurred_on = ? WHERE id = ?')
    .run(
      body?.trim() ?? existing.body,
      occurredOn !== undefined ? occurredOn : existing.occurred_on,
      id
    );

  res.json(await db.prepare('SELECT * FROM love_notes WHERE id = ?').get(id));
});

loveNotesRouter.delete('/:id', async (req, res) => {
  await db.prepare('DELETE FROM love_notes WHERE id = ?').run(req.params.id);
  res.status(204).end();
});
