import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import db from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = 'mahjong-secret-key';

function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = await db.get('SELECT * FROM admins WHERE username = ? AND password = ?', [username, password]);
  if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: admin.id, username: admin.username }, SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// Logout (client-side only, but provide endpoint for completeness)
app.post('/api/logout', auth, (req, res) => {
  res.json({ ok: true });
});

// List users with pagination and search
app.get('/api/users', auth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  let where = '';
  let params = [];
  if (search) {
    where = 'WHERE nickname LIKE ? OR uuid LIKE ? OR phone LIKE ?';
    params = [`%${search}%`, `%${search}%`, `%${search}%`];
  }

  const rows = await db.all(`SELECT id, uuid, nickname, avatar_url, phone, exp, personal_room_cards, club_room_cards, faan, score, inventory, rank_tier, win_games, total_games, feed_games, self_draw_games, max_faan, playstyle_tags, reputation_score, created_at FROM users ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  const countRow = await db.get(`SELECT COUNT(*) as total FROM users ${where}`, params);
  res.json({ data: rows, total: countRow.total, page, limit });
});

// Create user
app.post('/api/users', auth, async (req, res) => {
  const { uuid, nickname, avatar_url, phone, exp, personal_room_cards, club_room_cards, faan, score, rank_tier, reputation_score, inventory, win_games, total_games, feed_games, self_draw_games, max_faan, playstyle_tags } = req.body;
  if (!nickname) return res.status(400).json({ error: 'Nickname is required' });
  await db.run(
    `INSERT INTO users (uuid, nickname, avatar_url, phone, exp, personal_room_cards, club_room_cards, faan, score, inventory, rank_tier, win_games, total_games, feed_games, self_draw_games, max_faan, playstyle_tags, reputation_score)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [uuid || crypto.randomUUID(), nickname, avatar_url || null, phone || null, exp || 0, personal_room_cards || 0, club_room_cards || 0, faan || 0, score || 0, inventory || 0, rank_tier || 'beginner', win_games || 0, total_games || 0, feed_games || 0, self_draw_games || 0, max_faan || 0, playstyle_tags || '[]', reputation_score || 100]
  );
  const user = await db.get('SELECT * FROM users ORDER BY id DESC LIMIT 1');
  res.json(user);
});

// Update user
app.put('/api/users/:id', auth, async (req, res) => {
  const { nickname, avatar_url, phone, exp, personal_room_cards, club_room_cards, faan, score, rank_tier, reputation_score, inventory, win_games, total_games, feed_games, self_draw_games, max_faan, playstyle_tags } = req.body;
  await db.run(
    `UPDATE users SET nickname = ?, avatar_url = ?, phone = ?, exp = ?, personal_room_cards = ?, club_room_cards = ?, faan = ?, score = ?, inventory = ?, rank_tier = ?, win_games = ?, total_games = ?, feed_games = ?, self_draw_games = ?, max_faan = ?, playstyle_tags = ?, reputation_score = ? WHERE id = ?`,
    [nickname, avatar_url || null, phone || null, exp, personal_room_cards, club_room_cards, faan, score, inventory || 0, rank_tier, win_games || 0, total_games || 0, feed_games || 0, self_draw_games || 0, max_faan || 0, playstyle_tags || '[]', reputation_score, req.params.id]
  );
  const user = await db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);
  res.json(user);
});

// Delete user
app.delete('/api/users/:id', auth, async (req, res) => {
  await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// Export all users (for CSV/XLS)
app.get('/api/users/export', auth, async (req, res) => {
  const rows = await db.all(`SELECT id, uuid, nickname, avatar_url, phone, exp, personal_room_cards, club_room_cards, faan, score, inventory, rank_tier, win_games, total_games, feed_games, self_draw_games, max_faan, playstyle_tags, reputation_score, created_at FROM users ORDER BY id DESC`);
  res.json({ data: rows });
});

// Create transaction log
app.post('/api/transactions', auth, async (req, res) => {
  const { user_uuid, trace_id, type, currency_type, amount, balance_after, room_id } = req.body;
  if (!user_uuid || !trace_id || !type || !currency_type || amount === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  await db.run(
    `INSERT INTO transaction_logs (user_uuid, trace_id, type, currency_type, amount, balance_after, room_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [user_uuid, trace_id, type, currency_type, amount, balance_after, room_id || null]
  );
  res.json({ ok: true });
});

// Get transaction logs
app.get('/api/transactions', auth, async (req, res) => {
  const user_uuid = req.query.user_uuid;
  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const logs = await db.all(
    `SELECT * FROM transaction_logs WHERE user_uuid = ? ORDER BY id DESC LIMIT ?`,
    [user_uuid, limit]
  );
  res.json({ data: logs });
});

// Create match history
app.post('/api/match-history', auth, async (req, res) => {
  const { user_uuid, match_id, result, faan, score_delta } = req.body;
  if (!user_uuid || !match_id || !result) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  await db.run(
    `INSERT INTO match_history (user_uuid, match_id, result, faan, score_delta)
     VALUES (?, ?, ?, ?, ?)`,
    [user_uuid, match_id, result, faan || 0, score_delta || 0]
  );
  res.json({ ok: true });
});

// Get match history
app.get('/api/match-history', auth, async (req, res) => {
  const user_uuid = req.query.user_uuid;
  const limit = Math.min(50, parseInt(req.query.limit) || 50);
  const matches = await db.all(
    `SELECT * FROM match_history WHERE user_uuid = ? ORDER BY id DESC LIMIT ?`,
    [user_uuid, limit]
  );
  res.json({ data: matches });
});

app.listen(3001, () => console.log('Server running on http://localhost:3001'));
