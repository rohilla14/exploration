import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'exploration-test-'));
process.env.DB_PATH = join(dir, 'test.db');
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'secret';
delete process.env.OPENROUTER_API_KEY;
// Confirming a date must work even with no mail set up (most dev machines and CI won't have it).
delete process.env.SMTP_HOST;
delete process.env.SMTP_USER;
delete process.env.SMTP_PASS;
delete process.env.PARTNER_EMAIL;
delete process.env.HER_EMAIL;

const { app } = await import('../app.js');
const { seedIfEmpty } = await import('../seed.js');

let server;
let base;
const auth = { Authorization: `Basic ${Buffer.from('admin:secret').toString('base64')}` };
const json = { 'Content-Type': 'application/json' };

before(async () => {
  await seedIfEmpty();
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(() => {
  server.close();
  rmSync(dir, { recursive: true, force: true });
});

const post = (path, body, headers = json) =>
  fetch(`${base}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });

test('health is public', async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
});

test('admin-only GETs refuse anonymous and wrong credentials', async () => {
  assert.equal((await fetch(`${base}/sessions`)).status, 401);
  const bad = { Authorization: `Basic ${Buffer.from('admin:nope').toString('base64')}` };
  assert.equal((await fetch(`${base}/sessions`, { headers: bad })).status, 401);
  assert.equal((await fetch(`${base}/sessions`, { headers: auth })).status, 200);
});

test('public reads work without auth', async () => {
  assert.equal((await fetch(`${base}/love-notes`)).status, 200);
  assert.equal((await fetch(`${base}/questions`)).status, 200);
});

test('admin-only writes refuse anonymous callers', async () => {
  assert.equal((await post('/love-notes', { kind: 'like', body: 'x' })).status, 401);
  assert.equal((await post('/questions', { prompt: 'p', myAnswer: 'a' })).status, 401);
  assert.equal((await fetch(`${base}/diary/1`, { method: 'DELETE' })).status, 401);
  assert.equal((await fetch(`${base}/movies/1`, { method: 'DELETE' })).status, 401);
});

test('diary accepts a valid entry and rejects missing or oversized bodies', async () => {
  const ok = await post('/diary', { entryDate: '2026-01-01', body: 'hello' });
  assert.equal(ok.status, 201);
  assert.equal((await post('/diary', { entryDate: '2026-01-01' })).status, 400);
  const long = await post('/diary', { entryDate: '2026-01-01', body: 'x'.repeat(5001) });
  assert.equal(long.status, 413);
});

test('movies and music reject non-http(s) image URLs', async () => {
  assert.equal(
    (await post('/movies', { title: 'x', posterPath: 'javascript:alert(1)' })).status,
    400
  );
  assert.equal(
    (await post('/music/songs', { title: 'x', albumArt: 'data:text/html,hi' })).status,
    400
  );
  const ok = await post('/movies', {
    title: 'x',
    posterPath: 'https://image.tmdb.org/t/p/w200/a.jpg',
  });
  assert.equal(ok.status, 201);
});

test('events: unknown session is rejected and batches are capped', async () => {
  const one = { sessionId: 'nope', eventType: 'click', clientTimestamp: new Date().toISOString() };
  assert.equal((await post('/events', { events: [one] })).status, 400);
  assert.equal((await post('/events', { events: Array(101).fill(one) })).status, 413);
});

test('oversized JSON bodies return 413, malformed JSON returns 400', async () => {
  const big = await post('/sessions', { blob: 'x'.repeat(150_000) });
  assert.equal(big.status, 413);
  const bad = await fetch(`${base}/sessions`, { method: 'POST', headers: json, body: '{oops' });
  assert.equal(bad.status, 400);
});

test('confirming a date works end to end even with no mail configured', async () => {
  const session = await (await post('/sessions', {})).json();
  const res = await post('/confirmations', {
    sessionId: session.sessionId,
    selectedDate: '2026-09-28',
    selectedTime: '7:00 PM',
    activities: [{ place: 'Blue Tokai', emoji: '☕', moodId: 'coffee', moodLabel: 'Coffee date' }],
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.mailSent, false);

  const list = await fetch(`${base}/confirmations`, { headers: auth });
  const rows = await list.json();
  assert.ok(rows.some((r) => r.session_id === session.sessionId && r.selected_date === '2026-09-28'));
});

test('ai spark falls back without an API key and tolerates junk input', async () => {
  const res = await post('/ai/spark', {
    prompt: 'q',
    herAnswer: 'a'.repeat(5000),
    myAnswer: { x: 1 },
  });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).source, 'fallback');
});
