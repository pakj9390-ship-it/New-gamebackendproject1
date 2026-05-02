import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./mahjong.db');
db.all = promisify(db.all.bind(db));
db.get = promisify(db.get.bind(db));
db.run = promisify(db.run.bind(db));
db.exec = promisify(db.exec.bind(db));

await db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    nickname TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    exp INTEGER DEFAULT 0,
    personal_room_cards INTEGER DEFAULT 0,
    club_room_cards INTEGER DEFAULT 0,
    faan INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    inventory INTEGER DEFAULT 0,
    rank_tier TEXT DEFAULT 'beginner',
    win_games INTEGER DEFAULT 0,
    total_games INTEGER DEFAULT 0,
    feed_games INTEGER DEFAULT 0,
    self_draw_games INTEGER DEFAULT 0,
    max_faan INTEGER DEFAULT 0,
    playstyle_tags TEXT DEFAULT '[]',
    reputation_score INTEGER DEFAULT 100,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transaction_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uuid TEXT NOT NULL,
    trace_id TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    currency_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    room_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS match_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uuid TEXT NOT NULL,
    match_id TEXT NOT NULL,
    result TEXT NOT NULL,
    faan INTEGER DEFAULT 0,
    score_delta INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
`);

const adminExists = await db.get('SELECT 1 FROM admins WHERE username = ?', ['admin']);
if (!adminExists) {
  await db.run('INSERT INTO admins (username, password) VALUES (?, ?)', ['admin', 'admin123']);
}

export default db;
