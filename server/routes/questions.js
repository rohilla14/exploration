import { Router } from 'express';
import { db } from '../db.js';
import { isAdminAuthenticated } from '../adminAuth.js';

export const questionsRouter = Router();

function rowsWithAnswers() {
  return db
    .prepare(
      `SELECT q.id, q.prompt, q.my_answer, q.depth, q.created_at,
              a.her_answer, a.answered_at
       FROM questions q
       LEFT JOIN question_answers a ON a.question_id = q.id
       ORDER BY
         CASE q.depth WHEN 'light' THEN 1 WHEN 'closer' THEN 2 ELSE 3 END,
         q.id ASC`
    )
    .all();
}

/** Public list redacts my_answer until she has answered (spoilers). Admin sees all. */
questionsRouter.get('/', (req, res) => {
  const admin = isAdminAuthenticated(req);
  const rows = rowsWithAnswers().map((row) => {
    if (admin || row.her_answer) return row;
    return { ...row, my_answer: null };
  });
  res.json(rows);
});

questionsRouter.post('/', (req, res) => {
  const { prompt, myAnswer, depth = 'closer' } = req.body ?? {};

  if (!prompt?.trim() || !myAnswer?.trim()) {
    res.status(400).json({ error: 'prompt and myAnswer are required' });
    return;
  }

  const safeDepth = ['light', 'closer', 'deep'].includes(depth) ? depth : 'closer';

  const result = db
    .prepare('INSERT INTO questions (prompt, my_answer, depth) VALUES (?, ?, ?)')
    .run(prompt.trim(), myAnswer.trim(), safeDepth);

  res.status(201).json({
    id: result.lastInsertRowid,
    prompt: prompt.trim(),
    my_answer: myAnswer.trim(),
    depth: safeDepth,
  });
});

questionsRouter.post('/:id/answer', (req, res) => {
  const { id } = req.params;
  const { herAnswer } = req.body ?? {};

  if (!herAnswer?.trim()) {
    res.status(400).json({ error: 'herAnswer is required' });
    return;
  }

  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
  if (!question) {
    res.status(404).json({ error: 'Question not found' });
    return;
  }

  db.prepare(
    `INSERT INTO question_answers (question_id, her_answer)
     VALUES (?, ?)
     ON CONFLICT(question_id) DO UPDATE SET
       her_answer = excluded.her_answer,
       answered_at = datetime('now')`
  ).run(id, herAnswer.trim());

  res.status(201).json({ myAnswer: question.my_answer, herAnswer: herAnswer.trim() });
});

questionsRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
  res.status(204).end();
});
