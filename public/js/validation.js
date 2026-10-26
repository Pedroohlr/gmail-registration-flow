// Regras de validação compartilhadas entre o navegador e o servidor.
// Cada validador retorna { value } quando ok ou { error } com a mensagem.

const NAME_MAX = 50;
const RESERVED = new Set(['admin', 'administrador', 'root', 'suporte', 'support', 'auth4', 'sistema', 'system']);
export const GENDERS = ['female', 'male', 'unspecified', 'custom'];
export const PRONOUNS = ['female', 'male', 'other'];
export const ROLES = ['user', 'admin'];
export const MIN_AGE = 13;

const clean = (v) => String(v ?? '').trim().replace(/\s+/g, ' ');

export function normalizeUsername(value, domain) {
  let u = String(value ?? '').trim().toLowerCase();
  if (domain && u.endsWith('@' + domain.toLowerCase())) u = u.slice(0, -(domain.length + 1));
  return u;
}

export function firstName(v) {
  const s = clean(v);
  if (!s) return { error: 'Digite seu nome' };
  if (s.length > NAME_MAX) return { error: `Use no máximo ${NAME_MAX} caracteres` };
  return { value: s };
}

export function lastName(v) {
  const s = clean(v);
  if (s.length > NAME_MAX) return { error: `Use no máximo ${NAME_MAX} caracteres` };
  return { value: s || null };
}

export function birthDate(v) {
  const s = String(v ?? '').trim();
  if (!s) return { error: 'Preencha a data de nascimento completa' };
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return { error: 'Insira uma data de nascimento válida' };
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d || y < 1900) {
    return { error: 'Insira uma data de nascimento válida' };
  }
  const now = new Date();
  if (date > now) return { error: 'Insira uma data de nascimento válida' };
  let age = now.getUTCFullYear() - y;
  if (now.getUTCMonth() + 1 < mo || (now.getUTCMonth() + 1 === mo && now.getUTCDate() < d)) age--;
  if (age < MIN_AGE) return { error: `Você precisa ter pelo menos ${MIN_AGE} anos para criar uma conta` };
  return { value: s };
}

export function gender(g, custom, pronoun) {
  if (!GENDERS.includes(g)) return { error: 'Selecione seu gênero' };
  if (g !== 'custom') return { value: { gender: g, genderCustom: null, pronoun: null } };
  const c = clean(custom);
  if (!c) return { error: 'Digite qual é o seu gênero', field: 'genderCustom' };
  if (c.length > NAME_MAX) return { error: `Use no máximo ${NAME_MAX} caracteres`, field: 'genderCustom' };
  if (!PRONOUNS.includes(pronoun)) return { error: 'Selecione como devemos nos referir a você', field: 'pronoun' };
  return { value: { gender: g, genderCustom: c, pronoun } };
}

export function username(v, domain) {
  const u = normalizeUsername(v, domain);
  if (!u) return { error: 'Escolha um nome de usuário' };
  if (u.length < 6 || u.length > 30) return { error: 'Seu nome de usuário precisa ter entre 6 e 30 caracteres' };
  if (!/^[a-z0-9.]+$/.test(u)) return { error: 'Só são permitidas letras (a-z), números (0-9) e pontos (.)' };
  if (!/^[a-z0-9]/.test(u)) return { error: 'O primeiro caractere precisa ser uma letra (a-z) ou um número (0-9)' };
  if (u.endsWith('.')) return { error: 'O último caractere precisa ser uma letra (a-z) ou um número (0-9)' };
  if (u.includes('..')) return { error: 'O nome de usuário não pode ter pontos consecutivos (..)' };
  if (!/[a-z]/.test(u)) return { error: 'O nome de usuário precisa ter pelo menos uma letra' };
  if (RESERVED.has(u.replace(/\./g, ''))) return { error: 'Esse nome de usuário não é permitido. Tente outro.' };
  return { value: u };
}

export function password(v) {
  const p = String(v ?? '');
  if (!p) return { error: 'Digite uma senha' };
  if (p.length < 8) return { error: 'Use 8 caracteres ou mais para sua senha' };
  if (p.length > 128) return { error: 'Use no máximo 128 caracteres' };
  if (!/[a-zA-Z]/.test(p) || !/\d/.test(p)) {
    return { error: 'Escolha uma senha mais forte. Use uma combinação de letras, números e símbolos' };
  }
  return { value: p };
}

// 0 = muito fraca … 4 = forte
export function passwordStrength(p) {
  p = String(p ?? '');
  if (!p) return 0;
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^a-zA-Z0-9]/.test(p)) score++;
  if (p.length < 8) score = Math.min(score, 1);
  return Math.min(score, 4);
}

export function phone(v) {
  const raw = String(v ?? '').trim();
  if (!raw) return { value: null };
  const s = raw.replace(/[\s().-]/g, '');
  if (!/^\+?\d{10,15}$/.test(s)) return { error: 'Esse número de telefone não é válido' };
  return { value: s };
}

export function email(v) {
  const s = String(v ?? '').trim().toLowerCase();
  if (!s) return { value: null };
  if (s.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return { error: 'Insira um endereço de e-mail válido' };
  return { value: s };
}

const PROFILE_FIELDS = ['firstName', 'lastName', 'birthDate', 'gender', 'phone', 'recoveryEmail'];

// Valida os dados de perfil. Com partial, só valida os campos enviados.
export function validateProfile(input = {}, { partial = false } = {}) {
  const data = {};
  const errors = {};
  const has = (k) => !partial || Object.prototype.hasOwnProperty.call(input, k);
  const run = (key, result, target = key) => {
    if (result.error) errors[result.field || key] = result.error;
    else data[target] = result.value;
  };

  if (has('firstName')) run('firstName', firstName(input.firstName));
  if (has('lastName')) run('lastName', lastName(input.lastName));
  if (has('birthDate')) run('birthDate', birthDate(input.birthDate));
  if (has('gender')) {
    const g = gender(input.gender, input.genderCustom, input.pronoun);
    if (g.error) errors[g.field || 'gender'] = g.error;
    else Object.assign(data, g.value);
  }
  if (has('phone')) run('phone', phone(input.phone));
  if (has('recoveryEmail')) run('recoveryEmail', email(input.recoveryEmail));

  if (partial && !PROFILE_FIELDS.some((k) => k in input)) errors._ = 'Nenhuma alteração enviada';
  return { data, errors, ok: Object.keys(errors).length === 0 };
}
