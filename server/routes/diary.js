import { Router } from 'express';
import { db } from '../db.js';

export const diaryRouter = Router();

diaryRouter.get('/', (req, res) => {
  const { month } = req.query;

  const rows = month
    ? db
        .prepare(
          `SELECT * FROM diary_entries WHERE entry_date LIKE ? ORDER BY entry_date DESC, id DESC`
        )
        .all(`${month}%`)
    : db.prepare('SELECT * FROM diary_entries ORDER BY entry_date DESC, id DESC').all();

  res.json(rows);
});

diaryRouter.post('/', (req, res) => {
  const { entryDate, body, mood = null } = req.body ?? {};

  if (!entryDate || !body?.trim()) {
    res.status(400).json({ error: 'entryDate and body are required' });
    return;
  }

  const result = db
    .prepare('INSERT INTO diary_entries (entry_date, body, mood) VALUES (?, ?, ?)')
    .run(entryDate, body.trim(), mood);

  res.status(201).json(db.prepare('SELECT * FROM diary_entries WHERE id = ?').get(result.lastInsertRowid));
});

diaryRouter.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { body, mood } = req.body ?? {};

  const existing = db.prepare('SELECT * FROM diary_entries WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }

  db.prepare("UPDATE diary_entries SET body = ?, mood = ?, updated_at = datetime('now') WHERE id = ?").run(
    body?.trim() ?? existing.body,
    mood !== undefined ? mood : existing.mood,
    id
  );

  res.json(db.prepare('SELECT * FROM diary_entries WHERE id = ?').get(id));
});

diaryRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM diary_entries WHERE id = ?').run(req.params.id);
  res.status(204).end();
});
