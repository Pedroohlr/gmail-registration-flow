import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Sessions, DATA_DIR } from './db.js';
import { sessionMiddleware } from './auth.js';
import api from './api.js';

const PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.disable('x-powered-by');
// Easypanel coloca a aplicação atrás de um proxy (Traefik); confia no primeiro salto
// para que req.ip e req.secure reflitam o cliente real.
app.set('trust proxy', 1);

app.use((req, res, next) => {
  res.set({
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    'X-Frame-Options': 'DENY',
  });
  next();
});

app.use(express.json({ limit: '20kb' }));
app.use(sessionMiddleware);

// Bloqueia requisições de escrita vindas de outras origens (proteção contra CSRF).
app.use('/api', (req, res, next) => {
  const origin = req.get('origin');
  if (req.method !== 'GET' && origin && new URL(origin).host !== req.get('host')) {
    return res.status(403).json({ error: 'Origem não permitida' });
  }
  next();
});
app.use('/api', api);

const page = (file) => (req, res) => res.sendFile(path.join(PUBLIC, file));
const guestOnly = (req, res, next) => (req.user ? res.redirect('/conta') : next());
const authOnly = (req, res, next) =>
  req.user ? next() : res.redirect('/login?continuar=' + encodeURIComponent(req.originalUrl));

app.get('/', (req, res) => res.redirect(req.user ? '/conta' : '/login'));
app.get('/login', guestOnly, page('login.html'));
app.get('/cadastro', guestOnly, page('signup.html'));
app.get('/conta', authOnly, page('app.html'));
app.use(express.static(PUBLIC, { index: false, extensions: [] }));
app.use((req, res) => res.redirect('/'));

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Requisição inválida' });
  console.error(err);
  res.status(500).json({ error: 'Algo deu errado. Tente novamente.' });
});

Sessions.purgeExpired();
setInterval(() => Sessions.purgeExpired(), 60 * 60 * 1000).unref();

app.listen(PORT, () => {
  console.log(`auth4 rodando em http://localhost:${PORT} (dados em ${DATA_DIR})`);
});
