import { Router } from 'express';
import { Users, Sessions, publicUser } from './db.js';
import {
  hashPassword, verifyPassword, DUMMY_HASH, createSession, destroySession,
  requireAuth, requireAdmin, createLimiter,
} from './auth.js';
import * as v from '../public/js/validation.js';

export const DOMAIN = (process.env.EMAIL_DOMAIN || 'auth4.app').toLowerCase();

const api = Router();

const loginLimiter = createLimiter({ max: 10, windowMs: 15 * 60 * 1000 });
const lookupLimiter = createLimiter({ max: 60, windowMs: 15 * 60 * 1000 });
const signupLimiter = createLimiter({ max: 10, windowMs: 60 * 60 * 1000 });
const checkLimiter = createLimiter({ max: 120, windowMs: 15 * 60 * 1000 });

const fail = (res, status, error, fields) => res.status(status).json({ error, fields });
const hasErrors = (errors) => Object.keys(errors).length > 0;
const TOO_MANY = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';

function limit(limiter) {
  return (req, res, next) => {
    if (limiter.blocked(req.ip)) return fail(res, 429, TOO_MANY);
    limiter.hit(req.ip);
    next();
  };
}

// ---------- Geral ----------

api.get('/health', (req, res) => res.json({ ok: true }));
api.get('/config', (req, res) => res.json({ appName: 'auth4', domain: DOMAIN }));

// ---------- Login ----------

api.post('/auth/lookup', limit(lookupLimiter), (req, res) => {
  const username = v.normalizeUsername(req.body?.identifier, DOMAIN);
  if (!username) return fail(res, 400, 'Digite um e-mail ou nome de usuário', { identifier: 'Digite um e-mail ou nome de usuário' });
  const user = Users.byUsername(username);
  if (!user) {
    return fail(res, 404, 'Conta não encontrada', { identifier: 'Não foi possível encontrar sua conta auth4' });
  }
  res.json({ user: { username: user.username, firstName: user.first_name, lastName: user.last_name } });
});

api.post('/auth/login', async (req, res) => {
  if (loginLimiter.blocked(req.ip)) return fail(res, 429, TOO_MANY, { password: TOO_MANY });
  const username = v.normalizeUsername(req.body?.identifier, DOMAIN);
  const password = String(req.body?.password ?? '');
  if (!password) return fail(res, 400, 'Digite uma senha', { password: 'Digite uma senha' });

  const user = username ? Users.byUsername(username) : null;
  const valid = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !valid) {
    loginLimiter.hit(req.ip);
    return fail(res, 401, 'Senha incorreta', { password: 'Senha incorreta. Tente novamente.' });
  }
  loginLimiter.reset(req.ip);
  Users.touchLogin(user.id);
  createSession(req, res, user.id);
  res.json({ user: publicUser(Users.byId(user.id)) });
});

api.post('/auth/logout', (req, res) => {
  destroySession(req, res);
  res.json({ ok: true });
});

api.get('/auth/me', (req, res) => res.json({ user: publicUser(req.user) }));

// ---------- Cadastro ----------

api.post('/signup/username', limit(checkLimiter), (req, res) => {
  const u = v.username(req.body?.username, DOMAIN);
  if (u.error) return res.json({ available: false, error: u.error });
  if (Users.byUsername(u.value)) {
    return res.json({ available: false, error: 'Esse nome de usuário já está em uso. Tente outro.' });
  }
  res.json({ available: true, username: u.value });
});

const slug = (s) =>
  String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

api.post('/signup/suggestions', limit(checkLimiter), (req, res) => {
  const first = slug(req.body?.firstName);
  const last = slug(req.body?.lastName);
  if (!first) return res.json({ suggestions: [] });

  const rand = (digits) => String(Math.floor(Math.random() * 10 ** digits)).padStart(digits, '0');
  const bases = last ? [`${first}.${last}`, `${first}${last}`, `${last}.${first}`] : [first, `${first}.oficial`];
  const candidates = [];
  for (const base of bases) {
    candidates.push(base, `${base}${rand(2)}`, `${base}${rand(4)}`);
  }
  const suggestions = [];
  for (let c of candidates) {
    c = c.slice(0, 30).replace(/\.$/, '');
    if (c.length < 6) c = `${c}${rand(6 - c.length + 1)}`;
    if (!v.username(c).error && !Users.byUsername(c) && !suggestions.includes(c)) suggestions.push(c);
    if (suggestions.length === 2) break;
  }
  res.json({ suggestions });
});

api.post('/signup', async (req, res) => {
  if (signupLimiter.blocked(req.ip)) return fail(res, 429, TOO_MANY);
  const body = req.body ?? {};
  const { data, errors } = v.validateProfile(body);

  const username = v.username(body.username, DOMAIN);
  if (username.error) errors.username = username.error;
  else if (Users.byUsername(username.value)) errors.username = 'Esse nome de usuário já está em uso. Tente outro.';

  const password = v.password(body.password);
  if (password.error) errors.password = password.error;

  if (body.acceptTerms !== true) errors.terms = 'Você precisa aceitar os Termos de Serviço para continuar';
  if (hasErrors(errors)) return fail(res, 400, 'Verifique as informações da sua conta', errors);

  signupLimiter.hit(req.ip);
  const user = Users.create({
    ...data,
    username: username.value,
    passwordHash: await hashPassword(password.value),
    // O primeiro usuário do sistema vira administrador.
    role: Users.adminCount() === 0 ? 'admin' : 'user',
    termsAcceptedAt: new Date().toISOString(),
  });
  Users.touchLogin(user.id);
  createSession(req, res, user.id);
  res.status(201).json({ user: publicUser(Users.byId(user.id)) });
});

// ---------- Minha conta ----------

api.patch('/me', requireAuth, (req, res) => {
  const { data, errors } = v.validateProfile(req.body ?? {}, { partial: true });
  if (hasErrors(errors)) return fail(res, 400, errors._ || 'Verifique as informações', errors);
  res.json({ user: publicUser(Users.update(req.user.id, data)) });
});

api.put('/me/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!(await verifyPassword(String(currentPassword ?? ''), req.user.password_hash))) {
    return fail(res, 400, 'Senha atual incorreta', { currentPassword: 'Senha incorreta. Tente novamente.' });
  }
  const pw = v.password(newPassword);
  if (pw.error) return fail(res, 400, pw.error, { newPassword: pw.error });
  if (await verifyPassword(pw.value, req.user.password_hash)) {
    return fail(res, 400, 'Escolha uma senha diferente da atual', { newPassword: 'Escolha uma senha diferente da atual' });
  }
  Users.update(req.user.id, { passwordHash: await hashPassword(pw.value) });
  Sessions.removeOthers(req.user.id, req.sessionId);
  res.json({ ok: true });
});

api.get('/me/sessions', requireAuth, (req, res) => {
  res.json({
    sessions: Sessions.listForUser(req.user.id).map((s) => ({
      id: s.id.slice(0, 16),
      current: s.id === req.sessionId,
      userAgent: s.user_agent,
      ip: s.ip,
      createdAt: s.created_at,
      lastSeenAt: s.last_seen_at,
    })),
  });
});

api.delete('/me/sessions/:id', requireAuth, (req, res) => {
  const session = Sessions.listForUser(req.user.id).find((s) => s.id.startsWith(req.params.id));
  if (!session) return fail(res, 404, 'Sessão não encontrada');
  if (session.id === req.sessionId) return fail(res, 400, 'Para sair deste dispositivo, use "Sair"');
  Sessions.removeForUser(session.id, req.user.id);
  res.json({ ok: true });
});

api.post('/me/sessions/logout-others', requireAuth, (req, res) => {
  Sessions.removeOthers(req.user.id, req.sessionId);
  res.json({ ok: true });
});

api.delete('/me', requireAuth, async (req, res) => {
  if (!(await verifyPassword(String(req.body?.password ?? ''), req.user.password_hash))) {
    return fail(res, 400, 'Senha incorreta', { password: 'Senha incorreta. Tente novamente.' });
  }
  if (req.user.role === 'admin' && Users.adminCount() === 1 && Users.count() > 1) {
    return fail(res, 400, 'Você é o único administrador. Promova outro usuário a administrador antes de excluir sua conta.');
  }
  destroySession(req, res);
  Users.remove(req.user.id);
  res.json({ ok: true });
});

// ---------- Administração de usuários ----------

const findUser = (req, res, next) => {
  const user = Users.byId(Number(req.params.id));
  if (!user) return fail(res, 404, 'Usuário não encontrado');
  req.target = user;
  next();
};

api.get('/admin/users', requireAdmin, (req, res) => {
  const users = Users.list(String(req.query.q ?? '')).map(publicUser);
  res.json({ users, total: Users.count() });
});

api.get('/admin/users/:id', requireAdmin, findUser, (req, res) => res.json({ user: publicUser(req.target) }));

api.post('/admin/users', requireAdmin, async (req, res) => {
  const body = req.body ?? {};
  const { data, errors } = v.validateProfile(body);
  const username = v.username(body.username, DOMAIN);
  if (username.error) errors.username = username.error;
  else if (Users.byUsername(username.value)) errors.username = 'Esse nome de usuário já está em uso. Tente outro.';
  const password = v.password(body.password);
  if (password.error) errors.password = password.error;
  if (!v.ROLES.includes(body.role)) errors.role = 'Selecione uma função';
  if (hasErrors(errors)) return fail(res, 400, 'Verifique as informações', errors);

  const user = Users.create({
    ...data,
    username: username.value,
    role: body.role,
    passwordHash: await hashPassword(password.value),
  });
  res.status(201).json({ user: publicUser(user) });
});

api.patch('/admin/users/:id', requireAdmin, findUser, async (req, res) => {
  const body = req.body ?? {};
  const target = req.target;
  const profile = Object.fromEntries(Object.entries(body).filter(([k]) => !['username', 'password', 'role'].includes(k)));
  const { data, errors } = v.validateProfile(profile, { partial: true });
  delete errors._;

  if ('username' in body) {
    const username = v.username(body.username, DOMAIN);
    if (username.error) errors.username = username.error;
    else {
      const other = Users.byUsername(username.value);
      if (other && other.id !== target.id) errors.username = 'Esse nome de usuário já está em uso. Tente outro.';
      else data.username = username.value;
    }
  }
  if ('role' in body) {
    if (!v.ROLES.includes(body.role)) errors.role = 'Selecione uma função';
    else if (target.role === 'admin' && body.role !== 'admin' && Users.adminCount() === 1) {
      errors.role = 'É preciso ter pelo menos um administrador';
    } else data.role = body.role;
  }
  let passwordChanged = false;
  if (body.password) {
    const pw = v.password(body.password);
    if (pw.error) errors.password = pw.error;
    else {
      data.passwordHash = await hashPassword(pw.value);
      passwordChanged = true;
    }
  }
  if (hasErrors(errors)) return fail(res, 400, 'Verifique as informações', errors);

  const user = Users.update(target.id, data);
  if (passwordChanged) {
    if (target.id === req.user.id) Sessions.removeOthers(target.id, req.sessionId);
    else Sessions.removeAllForUser(target.id);
  }
  res.json({ user: publicUser(user) });
});

api.delete('/admin/users/:id', requireAdmin, findUser, (req, res) => {
  if (req.target.id === req.user.id) {
    return fail(res, 400, 'Para excluir sua própria conta, use a página Segurança');
  }
  Users.remove(req.target.id);
  res.json({ ok: true });
});

api.use((req, res) => fail(res, 404, 'Rota não encontrada'));

export default api;
