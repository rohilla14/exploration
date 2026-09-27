import { createClient } from '@libsql/client';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Turso (or any libSQL-compatible host) in production; a plain local file everywhere else.
// This is what makes the same code run on Vercel (read-only, ephemeral filesystem, so it
// needs a real database) and on your own machine (no account needed, just a file on disk).
const remoteUrl = process.env.TURSO_DATABASE_URL;

let url;
let describeLocation;
if (remoteUrl) {
  url = remoteUrl;
  describeLocation = remoteUrl.replace(/\/\/.*@/, '//');
} else {
  const localPath = process.env.DB_PATH || join(__dirname, 'data', 'exploration.db');
  mkdirSync(dirname(localPath), { recursive: true });
  url = `file:${localPath}`;
  describeLocation = localPath;
}

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
  // Keep every INTEGER column a plain JS number (what the rest of the app already expects,
  // and what better-sqlite3 gave it before) instead of libsql's default of widening to BigInt.
  intMode: 'number',
});

/** Turn a libsql result row (array-like, indexed by column position) into a plain object. */
function toObject(row, columns) {
  const obj = {};
  columns.forEach((col, i) => {
    obj[col] = row[i];
  });
  return obj;
}

/**
 * A drop-in-shaped replacement for the handful of better-sqlite3 methods this project uses,
 * backed by an async libsql client. Every call site was updated to `await` these.
 */
function prepare(sql) {
  return {
    async run(...args) {
      const res = await client.execute({ sql, args });
      return {
        changes: res.rowsAffected,
        lastInsertRowid: res.lastInsertRowid == null ? 0 : Number(res.lastInsertRowid),
      };
    },
    async get(...args) {
      const res = await client.execute({ sql, args });
      return res.rows.length ? toObject(res.rows[0], res.columns) : undefined;
    },
    async all(...args) {
      const res = await client.execute({ sql, args });
      return res.rows.map((row) => toObject(row, res.columns));
    },
  };
}

/**
 * Run several statements as one atomic round trip (all succeed or none do).
 * @param {{ sql: string, args?: unknown[] }[]} statements
 */
async function batch(statements) {
  await client.batch(
    statements.map((s) => ({ sql: s.sql, args: s.args ?? [] })),
    'write'
  );
}

/**
 * Sequential, non-atomic stand-in for better-sqlite3's synchronous transactions (which cannot
 * exist once the database is a network call away). `fn` is expected to `await` its own
 * `db.prepare(...)` calls. Used only at startup for idempotent seeding, where a genuine rollback
 * on failure was never load-bearing. `events.js` uses `db.batch` directly instead, since that
 * route does need real atomicity.
 */
function transaction(fn) {
  return async (...args) => fn(...args);
}

const db = { prepare, batch, transaction };

/** Every table and index the app needs, created if missing. Safe to run on every cold start. */
async function migrate() {
  await client.execute('PRAGMA foreign_keys = ON');

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      user_agent TEXT,
      viewport_width INTEGER,
      viewport_height INTEGER,
      completed INTEGER NOT NULL DEFAULT 0,
      last_screen_id TEXT,
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      screen_id TEXT,
      event_type TEXT NOT NULL,
      payload TEXT,
      client_timestamp TEXT NOT NULL,
      server_timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS date_confirmations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL UNIQUE,
      selected_date TEXT NOT NULL,
      selected_time TEXT NOT NULL,
      confirmed_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS love_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL CHECK (kind IN ('memory', 'like')),
      body TEXT NOT NULL,
      occurred_on TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prompt TEXT NOT NULL,
      my_answer TEXT NOT NULL,
      depth TEXT NOT NULL DEFAULT 'closer' CHECK (depth IN ('light', 'closer', 'deep')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS question_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL UNIQUE,
      her_answer TEXT NOT NULL,
      answered_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      note TEXT,
      poster_emoji TEXT,
      tmdb_id INTEGER,
      poster_path TEXT,
      added_by TEXT NOT NULL DEFAULT 'you' CHECK (added_by IN ('you', 'her')),
      added_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS movie_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER NOT NULL,
      rater TEXT NOT NULL CHECK (rater IN ('you', 'her')),
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      note TEXT,
      rated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
      UNIQUE (movie_id, rater)
    );

    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spotify_id TEXT,
      title TEXT NOT NULL,
      artist TEXT,
      album_art TEXT,
      preview_url TEXT,
      added_by TEXT NOT NULL DEFAULT 'her' CHECK (added_by IN ('you', 'her')),
      note TEXT,
      added_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS diary_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_date TEXT NOT NULL,
      body TEXT NOT NULL,
      mood TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS horoscopes (
      date TEXT PRIMARY KEY,
      personal TEXT NOT NULL,
      together TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
    CREATE INDEX IF NOT EXISTS idx_events_screen ON events(screen_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at);
    CREATE INDEX IF NOT EXISTS idx_love_notes_kind ON love_notes(kind);
    CREATE INDEX IF NOT EXISTS idx_movie_ratings_movie ON movie_ratings(movie_id);
    CREATE INDEX IF NOT EXISTS idx_diary_entries_date ON diary_entries(entry_date);
  `);

  // Columns added after the tables above first shipped. executeMultiple can't swallow errors
  // per-statement the way a try/catch loop can, so these stay as individual ALTERs.
  const alters = [
    `ALTER TABLE date_confirmations ADD COLUMN activities TEXT`,
    `ALTER TABLE questions ADD COLUMN depth TEXT NOT NULL DEFAULT 'closer'`,
    `ALTER TABLE movies ADD COLUMN tmdb_id INTEGER`,
    `ALTER TABLE movies ADD COLUMN poster_path TEXT`,
    `ALTER TABLE songs ADD COLUMN album_art TEXT`,
    // A YouTube video id, so a song can play in full without a Spotify account.
    `ALTER TABLE songs ADD COLUMN youtube_id TEXT`,
  ];
  for (const stmt of alters) {
    try {
      await client.execute(stmt);
    } catch {
      // column already exists
    }
  }
}

// Runs once, the moment this module is first imported. Every caller (server/index.js locally,
// api/index.js on Vercel, and the test file) reaches `db` through a static or dynamic import,
// and ES modules do not finish evaluating a module until its own top-level await settles, so
// nothing can touch the tables before they exist.
await migrate();

export { db, describeLocation as DB_PATH };
