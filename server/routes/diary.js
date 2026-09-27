import { Router } from 'express';
import { db } from '../db.js';

export const diaryRouter = Router();

diaryRouter.get('/', async (req, res) => {
  const { month } = req.query;

  const rows = month
    ? await db
        .prepare(
          `SELECT * FROM diary_entries WHERE entry_date LIKE ? ORDER BY entry_date DESC, id DESC`
        )
        .all(`${month}%`)
    : await db.prepare('SELECT * FROM diary_entries ORDER BY entry_date DESC, id DESC').all();

  res.json(rows);
});

diaryRouter.post('/', async (req, res) => {
  const { entryDate, body, mood = null } = req.body ?? {};

  if (!entryDate || !body?.trim()) {
    res.status(400).json({ error: 'entryDate and body are required' });
    return;
  }

  const result = await db
    .prepare('INSERT INTO diary_entries (entry_date, body, mood) VALUES (?, ?, ?)')
    .run(entryDate, body.trim(), mood);

  res
    .status(201)
    .json(await db.prepare('SELECT * FROM diary_entries WHERE id = ?').get(result.lastInsertRowid));
});

diaryRouter.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { body, mood } = req.body ?? {};

  const existing = await db.prepare('SELECT * FROM diary_entries WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }

  await db
    .prepare(
      "UPDATE diary_entries SET body = ?, mood = ?, updated_at = datetime('now') WHERE id = ?"
    )
    .run(body?.trim() ?? existing.body, mood !== undefined ? mood : existing.mood, id);

  res.json(await db.prepare('SELECT * FROM diary_entries WHERE id = ?').get(id));
});

diaryRouter.delete('/:id', async (req, res) => {
  await db.prepare('DELETE FROM diary_entries WHERE id = ?').run(req.params.id);
  res.status(204).end();
});
