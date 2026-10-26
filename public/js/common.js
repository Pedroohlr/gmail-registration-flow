// Utilitários compartilhados pelo frontend do auth4.

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
export const GENDER_LABELS = { female: 'Feminino', male: 'Masculino', unspecified: 'Prefiro não dizer', custom: 'Personalizado' };
export const PRONOUN_LABELS = { female: 'Feminino (ela)', male: 'Masculino (ele)', other: 'Outro (elu)' };

export const icons = {
  error: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>',
  chevronDown: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5z"/></svg>',
  chevronRight: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>',
  person: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/></svg>',
  cake: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6a2 2 0 0 0 2-2c0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97A2 2 0 0 0 12 6zm6 3h-5V7h-2v2H6a3 3 0 0 0-3 3v1.54c0 1.08.88 1.96 1.96 1.96.52 0 1.02-.2 1.38-.57l2.14-2.13 2.13 2.13c.74.74 2.03.74 2.77 0l2.14-2.13 2.13 2.13c.37.37.86.57 1.38.57 1.08 0 1.96-.88 1.96-1.96V12A3 3 0 0 0 18 9zm-1 7.97c-.84 0-1.63-.32-2.22-.92L13.7 15l-1.07 1.07a3.13 3.13 0 0 1-4.43 0L7.14 15l-1.08 1.07c-.58.59-1.37.92-2.06.93V21a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4.03c-.68 0-1.4-.33-2-.99z"/></svg>',
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
  badge: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2zm12 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm-9 8c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1H6v-1z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8h-1V6A5 5 0 0 0 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zm-6 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm3.1-9H8.9V6a3.1 3.1 0 0 1 6.2 0v2z"/></svg>',
  group: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05A4.22 4.22 0 0 1 17 16.5V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z"/></svg>',
  edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
  computer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg>',
  smartphone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 1H7a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm0 18H7V5h10v14z"/></svg>',
  add: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>',
};

export const logoMark = `<svg class="logo-mark" viewBox="0 0 32 32" aria-hidden="true">
  <rect x="2" y="2" width="13" height="13" rx="4" fill="#4f3fd8"/>
  <rect x="17" y="2" width="13" height="13" rx="6.5" fill="#12a39b"/>
  <rect x="2" y="17" width="13" height="13" rx="6.5" fill="#f2994a"/>
  <rect x="17" y="17" width="13" height="13" rx="4" fill="#e04f7e"/>
</svg>`;

export const logo = (sub = '') =>
  `<span class="logo">${logoMark}<span class="logo-word">auth<b>4</b></span>${sub ? `<span class="logo-sub">${esc(sub)}</span>` : ''}</span>`;

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

let configPromise;
export const getConfig = () => (configPromise ??= api('/config'));

export async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch('/api' + path, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    });
  } catch {
    throw Object.assign(new Error('Não foi possível conectar. Verifique sua internet e tente novamente.'), { fields: {} });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Algo deu errado. Tente novamente.');
    err.status = res.status;
    err.fields = data.fields || {};
    throw err;
  }
  return data;
}

// ---------- campos ----------

const errorSlot = () => `<div class="field-error" role="alert">${icons.error}<span></span></div>`;

export function textField({ name, label, value = '', type = 'text', autocomplete = 'off', suffix = '', inputmode = '', maxlength = '', hint = '' }) {
  const id = `f-${name}-${Math.random().toString(36).slice(2, 7)}`;
  return `<div class="field" data-field="${name}">
    <input class="field-input" id="${id}" name="${name}" type="${type}" placeholder=" " value="${esc(value)}"
      autocomplete="${autocomplete}" ${inputmode ? `inputmode="${inputmode}"` : ''} ${maxlength ? `maxlength="${maxlength}"` : ''}
      ${suffix ? 'data-suffix' : ''} spellcheck="false">
    <label class="field-label" for="${id}">${esc(label)}</label>
    ${suffix ? `<span class="field-suffix">${esc(suffix)}</span>` : ''}
    ${hint ? `<p class="field-hint">${esc(hint)}</p>` : ''}
    ${errorSlot()}
  </div>`;
}

export function selectField({ name, label, options, value = '', placeholder = '' }) {
  const id = `f-${name}-${Math.random().toString(36).slice(2, 7)}`;
  const opts = (placeholder !== null ? `<option value="" ${value ? '' : 'selected'} disabled>${esc(placeholder)}</option>` : '') +
    options.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(l)}</option>`).join('');
  return `<div class="field" data-field="${name}">
    <select class="field-input" id="${id}" name="${name}">${opts}</select>
    <label class="field-label" for="${id}">${esc(label)}</label>
    ${errorSlot()}
  </div>`;
}

export function dateFields(value = '') {
  const [y = '', m = '', d = ''] = value ? value.split('-') : [];
  return `<div class="field-group" data-field="birthDate">
    <div class="field-row">
      ${textField({ name: 'day', label: 'Dia', value: d ? String(Number(d)) : '', inputmode: 'numeric', maxlength: 2, autocomplete: 'bday-day' })}
      ${selectField({ name: 'month', label: 'Mês', value: m ? String(Number(m)) : '', options: MONTHS.map((n, i) => [i + 1, n]) })}
      ${textField({ name: 'year', label: 'Ano', value: y, inputmode: 'numeric', maxlength: 4, autocomplete: 'bday-year' })}
    </div>
    ${errorSlot()}
  </div>`;
}

export function genderFields(user = {}) {
  return `${selectField({ name: 'gender', label: 'Gênero', value: user.gender || '', options: Object.entries(GENDER_LABELS) })}
    <div class="gender-custom" ${user.gender === 'custom' ? '' : 'hidden'}>
      ${textField({ name: 'genderCustom', label: 'Qual é o seu gênero?', value: user.genderCustom || '', maxlength: 50 })}
      ${selectField({ name: 'pronoun', label: 'Refira-se a mim como', value: user.pronoun || '', options: Object.entries(PRONOUN_LABELS) })}
    </div>`;
}

export function wireGender(root) {
  const select = root.querySelector('[name="gender"]');
  const custom = root.querySelector('.gender-custom');
  if (!select || !custom) return;
  select.addEventListener('change', () => {
    custom.hidden = select.value !== 'custom';
    if (!custom.hidden) custom.querySelector('input')?.focus();
  });
}

export function readDate(root) {
  const d = root.querySelector('[name="day"]').value.trim();
  const m = root.querySelector('[name="month"]').value;
  const y = root.querySelector('[name="year"]').value.trim();
  if (!d || !m || !y) return '';
  if (!/^\d{1,2}$/.test(d) || !/^\d{4}$/.test(y)) return 'invalid';
  return `${y}-${String(m).padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export const readGender = (root) => ({
  gender: root.querySelector('[name="gender"]').value,
  genderCustom: root.querySelector('[name="genderCustom"]')?.value ?? '',
  pronoun: root.querySelector('[name="pronoun"]')?.value ?? '',
});

// Ajusta o espaço do texto quando o campo tem sufixo (ex.: @auth4.app).
export function fitSuffixes(root) {
  root.querySelectorAll('input[data-suffix]').forEach((input) => {
    const suffix = input.parentElement.querySelector('.field-suffix');
    if (suffix && suffix.offsetWidth) input.style.paddingRight = `${suffix.offsetWidth + 24}px`;
  });
}

export function onlyDigits(input) {
  input?.addEventListener('input', () => {
    const v = input.value.replace(/\D/g, '');
    if (v !== input.value) input.value = v;
  });
}

// ---------- erros ----------

export function setError(root, field, message) {
  const el = root.querySelector(`[data-field="${field}"]`);
  if (!el) return false;
  el.classList.add('invalid');
  const slot = el.querySelector(':scope > .field-error');
  if (slot) {
    slot.querySelector('span').textContent = message;
    slot.classList.add('show');
  }
  return true;
}

export function clearErrors(root) {
  root.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
  root.querySelectorAll('.field-error.show').forEach((el) => el.classList.remove('show'));
  root.querySelectorAll('.form-error').forEach((el) => el.remove());
}

export function showFormError(container, message) {
  const box = document.createElement('div');
  box.className = 'form-error';
  box.setAttribute('role', 'alert');
  box.innerHTML = `${icons.error}<span></span>`;
  box.querySelector('span').textContent = message;
  container.prepend(box);
}

// Mostra os erros de campo vindos do servidor; retorna true se algum foi exibido.
export function showErrors(root, fields = {}) {
  let shown = false;
  for (const [field, msg] of Object.entries(fields)) {
    if (setError(root, field, msg)) shown = true;
  }
  focusFirstInvalid(root);
  return shown;
}

export function focusFirstInvalid(root) {
  root.querySelector('.invalid input, .invalid select')?.focus();
}

// Limpa o erro do campo assim que a pessoa edita.
export function liveClear(root) {
  const handler = (e) => {
    const group = e.target.closest('.field-group') || e.target.closest('.field');
    group?.classList.remove('invalid');
    group?.querySelector(':scope > .field-error')?.classList.remove('show');
  };
  root.addEventListener('input', handler);
  root.addEventListener('change', handler);
}

// ---------- outros ----------

export function avatar(user, size = '') {
  const name = user?.firstName || user?.username || '?';
  let h = 0;
  for (const ch of user?.username || name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `<span class="avatar ${size} c${h % 8}" aria-hidden="true">${esc(name.trim().charAt(0))}</span>`;
}

export const fullName = (u) => [u.firstName, u.lastName].filter(Boolean).join(' ');

export function formatDate(iso, opts = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!iso) return '';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + 'T12:00:00') : new Date(iso);
  return date.toLocaleDateString('pt-BR', opts);
}

export function formatDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function genderLabel(u) {
  return u.gender === 'custom' ? u.genderCustom : GENDER_LABELS[u.gender] || '';
}

export function formatPhone(p) {
  if (!p) return '';
  const d = p.replace(/\D/g, '');
  if (!p.startsWith('+') && d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (!p.startsWith('+') && d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return p;
}

let toastTimer;
export function toast(message) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = message;
  document.body.append(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 4000);
}

export function setLoading(el, on) {
  el.classList.toggle('loading', on);
  el.setAttribute('aria-busy', on ? 'true' : 'false');
}

export const footerHTML = `<footer class="auth-footer">
  <select aria-label="Idioma"><option>Português (Brasil)</option></select>
  <nav><a href="#ajuda">Ajuda</a><a href="#privacidade">Privacidade</a><a href="#termos">Termos</a></nav>
</footer>`;

export const STRENGTH_LABELS = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];
