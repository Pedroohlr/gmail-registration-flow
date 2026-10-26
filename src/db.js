import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export const DATA_DIR = path.resolve(process.env.DATA_DIR || 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(path.join(DATA_DIR, 'auth4.db'));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS users (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    username          TEXT NOT NULL UNIQUE COLLATE NOCASE,
    first_name        TEXT NOT NULL,
    last_name         TEXT,
    birth_date        TEXT NOT NULL,
    gender            TEXT NOT NULL,
    gender_custom     TEXT,
    pronoun           TEXT,
    phone             TEXT,
    recovery_email    TEXT,
    password_hash     TEXT NOT NULL,
    role              TEXT NOT NULL DEFAULT 'user',
    terms_accepted_at TEXT,
    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL,
    last_login_at     TEXT,
    password_changed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    expires_at  INTEGER NOT NULL,
    user_agent  TEXT,
    ip          TEXT
  );

  CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires_at);
`);

const now = () => new Date().toISOString();

const COLUMNS = {
  username: 'username',
  firstName: 'first_name',
  lastName: 'last_name',
  birthDate: 'birth_date',
  gender: 'gender',
  genderCustom: 'gender_custom',
  pronoun: 'pronoun',
  phone: 'phone',
  recoveryEmail: 'recovery_email',
  passwordHash: 'password_hash',
  role: 'role',
};

export function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    firstName: u.first_name,
    lastName: u.last_name,
    birthDate: u.birth_date,
    gender: u.gender,
    genderCustom: u.gender_custom,
    pronoun: u.pronoun,
    phone: u.phone,
    recoveryEmail: u.recovery_email,
    role: u.role,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
    lastLoginAt: u.last_login_at,
    passwordChangedAt: u.password_changed_at,
  };
}

const stmt = {
  byId: db.prepare('SELECT * FROM users WHERE id = ?'),
  byUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
  adminCount: db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'"),
  count: db.prepare('SELECT COUNT(*) AS n FROM users'),
  remove: db.prepare('DELETE FROM users WHERE id = ?'),
  touchLogin: db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?'),
};

export const Users = {
  byId: (id) => stmt.byId.get(id),
  byUsername: (username) => stmt.byUsername.get(username),
  adminCount: () => stmt.adminCount.get().n,
  count: () => stmt.count.get().n,

  list(q = '') {
    const term = `%${q.trim().replace(/[%_\\]/g, '\\$&')}%`;
    return db
      .prepare(
        `SELECT * FROM users
         WHERE username LIKE ?1 ESCAPE '\\' OR first_name LIKE ?1 ESCAPE '\\'
            OR last_name LIKE ?1 ESCAPE '\\' OR recovery_email LIKE ?1 ESCAPE '\\'
            OR (first_name || ' ' || IFNULL(last_name, '')) LIKE ?1 ESCAPE '\\'
         ORDER BY created_at DESC LIMIT 500`
      )
      .all(term);
  },

  create(data) {
    const ts = now();
    const row = {
      ...data,
      termsAcceptedAt: data.termsAcceptedAt ?? null,
    };
    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO users (username, first_name, last_name, birth_date, gender, gender_custom, pronoun,
           phone, recovery_email, password_hash, role, terms_accepted_at, created_at, updated_at, password_changed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        row.username, row.firstName, row.lastName ?? null, row.birthDate, row.gender, row.genderCustom ?? null,
        row.pronoun ?? null, row.phone ?? null, row.recoveryEmail ?? null, row.passwordHash, row.role ?? 'user',
        row.termsAcceptedAt, ts, ts, ts
      );
    return Users.byId(lastInsertRowid);
  },

  update(id, data) {
    const sets = [];
    const values = [];
    for (const [key, col] of Object.entries(COLUMNS)) {
      if (key in data) {
        sets.push(`${col} = ?`);
        values.push(data[key] ?? null);
      }
    }
    if ('passwordHash' in data) {
      sets.push('password_changed_at = ?');
      values.push(now());
    }
    if (sets.length) {
      sets.push('updated_at = ?');
      values.push(now(), id);
      db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    }
    return Users.byId(id);
  },

  remove: (id) => stmt.remove.run(id),
  touchLogin: (id) => stmt.touchLogin.run(now(), id),
};

const sessStmt = {
  insert: db.prepare(
    'INSERT INTO sessions (id, user_id, created_at, last_seen_at, expires_at, user_agent, ip) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ),
  get: db.prepare('SELECT * FROM sessions WHERE id = ? AND expires_at > ?'),
  touch: db.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?'),
  remove: db.prepare('DELETE FROM sessions WHERE id = ?'),
  removeForUser: db.prepare('DELETE FROM sessions WHERE id = ? AND user_id = ?'),
  removeAllForUser: db.prepare('DELETE FROM sessions WHERE user_id = ?'),
  removeOthers: db.prepare('DELETE FROM sessions WHERE user_id = ? AND id <> ?'),
  listForUser: db.prepare('SELECT * FROM sessions WHERE user_id = ? AND expires_at > ? ORDER BY last_seen_at DESC'),
  purge: db.prepare('DELETE FROM sessions WHERE expires_at <= ?'),
};

export const Sessions = {
  create: (id, userId, expiresAt, userAgent, ip) => {
    const ts = now();
    sessStmt.insert.run(id, userId, ts, ts, expiresAt, userAgent, ip);
  },
  get: (id) => sessStmt.get.get(id, Date.now()),
  touch: (id) => sessStmt.touch.run(now(), id),
  remove: (id) => sessStmt.remove.run(id),
  removeForUser: (id, userId) => sessStmt.removeForUser.run(id, userId).changes,
  removeAllForUser: (userId) => sessStmt.removeAllForUser.run(userId),
  removeOthers: (userId, keepId) => sessStmt.removeOthers.run(userId, keepId),
  listForUser: (userId) => sessStmt.listForUser.all(userId, Date.now()),
  purgeExpired: () => sessStmt.purge.run(Date.now()),
};
