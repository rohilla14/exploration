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

  CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
  CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
  CREATE INDEX IF NOT EXISTS idx_events_screen ON events(screen_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at);
`);

try {
  db.exec(`ALTER TABLE date_confirmations ADD COLUMN activities TEXT`);
} catch {
  // column already exists
}

export { db, DB_PATH };
