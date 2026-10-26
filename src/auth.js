import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { Sessions, Users } from './db.js';

const scrypt = promisify(crypto.scrypt);
const SCRYPT = { N: 16384, r: 8, p: 1 };
const KEYLEN = 64;

export const COOKIE_NAME = 'auth4_sid';
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const TOUCH_EVERY_MS = 5 * 60 * 1000;

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, KEYLEN, SCRYPT);
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(password, stored) {
  const [algo, N, r, p, salt, hash] = String(stored).split('$');
  if (algo !== 'scrypt') return false;
  const expected = Buffer.from(hash, 'base64');
  const key = await scrypt(password, Buffer.from(salt, 'base64'), expected.length, {
    N: Number(N), r: Number(r), p: Number(p),
  });
  return crypto.timingSafeEqual(key, expected);
}

// Usado quando o usuário não existe, para o tempo de resposta não revelar isso.
export const DUMMY_HASH = await hashPassword(crypto.randomBytes(16).toString('hex'));

const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');

function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    const k = part.slice(0, i).trim();
    try { out[k] = decodeURIComponent(part.slice(i + 1).trim()); } catch { /* cookie inválido */ }
  }
  return out;
}

export function createSession(req, res, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const id = sha256(token);
  Sessions.create(id, userId, Date.now() + SESSION_MS, String(req.get('user-agent') || '').slice(0, 300), req.ip);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure,
    maxAge: SESSION_MS,
    path: '/',
  });
  req.sessionId = id;
}

export function destroySession(req, res) {
  if (req.sessionId) Sessions.remove(req.sessionId);
  res.clearCookie(COOKIE_NAME, { path: '/', httpOnly: true, sameSite: 'lax', secure: req.secure });
}

export function sessionMiddleware(req, res, next) {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (token) {
    const session = Sessions.get(sha256(token));
    const user = session && Users.byId(session.user_id);
    if (user) {
      req.user = user;
      req.sessionId = session.id;
      if (Date.now() - Date.parse(session.last_seen_at) > TOUCH_EVERY_MS) Sessions.touch(session.id);
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Faça login para continuar' });
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Faça login para continuar' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso restrito a administradores' });
  next();
}

// Limitador simples em memória (por IP).
export function createLimiter({ max, windowMs }) {
  const hits = new Map();
  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [k, e] of hits) if (e.start < cutoff) hits.delete(k);
  }, windowMs).unref();

  const entry = (key) => {
    const e = hits.get(key);
    if (e && Date.now() - e.start < windowMs) return e;
    hits.delete(key);
    return null;
  };
  return {
    blocked: (key) => (entry(key)?.count ?? 0) >= max,
    hit(key) {
      const e = entry(key);
      if (e) e.count++;
      else hits.set(key, { start: Date.now(), count: 1 });
    },
    reset: (key) => hits.delete(key),
  };
}
