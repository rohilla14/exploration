import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || join(__dirname, 'data', 'exploration.db');

mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
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

try {
  db.exec(`ALTER TABLE date_confirmations ADD COLUMN activities TEXT`);
} catch {
  // column already exists
}

try {
  db.exec(`ALTER TABLE questions ADD COLUMN depth TEXT NOT NULL DEFAULT 'closer'`);
} catch {
  // column already exists
}

try {
  db.exec(`ALTER TABLE movies ADD COLUMN tmdb_id INTEGER`);
} catch {
  // column already exists
}

try {
  db.exec(`ALTER TABLE movies ADD COLUMN poster_path TEXT`);
} catch {
  // column already exists
}

try {
  db.exec(`ALTER TABLE songs ADD COLUMN album_art TEXT`);
} catch {
  // column already exists
}

export { db, DB_PATH };
