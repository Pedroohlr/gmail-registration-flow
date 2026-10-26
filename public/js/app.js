import {
  api, esc, getConfig, logo, icons, avatar, fullName, formatDate, formatDateTime, formatPhone, genderLabel,
  textField, selectField, dateFields, genderFields, wireGender, readDate, readGender, onlyDigits, fitSuffixes,
  clearErrors, showErrors, showFormError, liveClear, setLoading, toast, STRENGTH_LABELS,
} from './common.js';
import * as v from './validation.js';

const { domain } = await getConfig();
let me = (await api('/auth/me')).user;
if (!me) location.replace('/login');

const $ = (sel, root = document) => root.querySelector(sel);
const content = $('#content');
const address = (u) => `${u.username}@${domain}`;

// ---------- estrutura ----------

const SECTIONS = {
  inicio: { label: 'Início', icon: icons.home, render: renderHome },
  info: { label: 'Informações pessoais', icon: icons.badge, render: renderInfo },
  seguranca: { label: 'Segurança', icon: icons.lock, render: renderSecurity },
  usuarios: { label: 'Usuários', icon: icons.group, render: renderUsers, admin: true },
};

function renderChrome() {
  $('#brand').innerHTML = logo('Conta');
  $('#brand').className = 'logo';
  $('#avatar-btn').innerHTML = avatar(me, 'md');
  $('#nav').innerHTML = Object.entries(SECTIONS)
    .filter(([, s]) => !s.admin || me.role === 'admin')
    .map(([key, s]) => `<a href="#${key}" data-key="${key}">${s.icon}<span>${esc(s.label)}</span></a>`)
    .join('');
  $('#menu').innerHTML = `
    ${avatar(me, 'lg')}
    <strong>Olá, ${esc(me.firstName)}!</strong>
    <small>${esc(address(me))}</small>
    <a class="btn btn-outline" href="#info">Gerenciar sua conta auth4</a>
    <button class="btn btn-text" id="logout">Sair</button>`;
}

function route() {
  let key = location.hash.slice(1) || 'inicio';
  if (!SECTIONS[key] || (SECTIONS[key].admin && me.role !== 'admin')) key = 'inicio';
  document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.key === key));
  document.title = `${SECTIONS[key].label} – auth4`;
  closeMenu();
  SECTIONS[key].render();
  window.scrollTo(0, 0);
}

function openMenu() {
  $('#menu').hidden = false;
  $('#avatar-btn').setAttribute('aria-expanded', 'true');
}
function closeMenu() {
  $('#menu').hidden = true;
  $('#avatar-btn').setAttribute('aria-expanded', 'false');
}

$('#avatar-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  $('#menu').hidden ? openMenu() : closeMenu();
});
document.addEventListener('click', (e) => {
  if (!$('#menu').hidden && !e.target.closest('#menu')) closeMenu();
  if (e.target.closest('#logout')) logout();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

async function logout() {
  await api('/auth/logout', { method: 'POST' }).catch(() => {});
  location.replace('/login');
}

function setMe(user) {
  me = user;
  renderChrome();
  route();
}

// ---------- diálogo ----------

function openDialog({ title, description = '', body, submitLabel = 'Salvar', danger = false, wide = false, onOpen, onSubmit }) {
  const dlg = document.createElement('dialog');
  dlg.className = `dialog${wide ? ' wide' : ''}`;
  dlg.innerHTML = `
    <form novalidate>
      <div class="progress"></div>
      <h2></h2>
      ${description ? '<p class="dialog-desc"></p>' : ''}
      <div class="dialog-body">${body}</div>
      <div class="dialog-actions">
        <button type="button" class="btn btn-text" data-cancel>Cancelar</button>
        <button type="submit" class="btn ${danger ? 'btn-danger' : 'btn-filled'}"></button>
      </div>
    </form>`;
  $('h2', dlg).textContent = title;
  if (description) $('.dialog-desc', dlg).textContent = description;
  $('[type=submit]', dlg).textContent = submitLabel;
  document.body.append(dlg);

  const form = $('form', dlg);
  liveClear(form);
  wireGender(form);
  form.querySelectorAll('[name="day"], [name="year"]').forEach(onlyDigits);
  $('[data-cancel]', dlg).addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', () => dlg.remove());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (dlg.classList.contains('loading')) return;
    clearErrors(form);
    setLoading(dlg, true);
    try {
      await onSubmit(form);
      dlg.close();
    } catch (err) {
      if (err.status === 401) return location.replace('/login');
      if (!showErrors(form, err.fields)) showFormError($('.dialog-body', dlg), err.message);
    } finally {
      setLoading(dlg, false);
    }
  });

  dlg.showModal();
  fitSuffixes(form);
  onOpen?.(form);
  form.querySelector('.dialog-body input:not([type=hidden]), .dialog-body select')?.focus();
  return dlg;
}

function localErrors(fields) {
  const errors = Object.fromEntries(Object.entries(fields).filter(([, m]) => m));
  if (Object.keys(errors).length) {
    throw Object.assign(new Error(Object.values(errors)[0]), { fields: errors });
  }
}

const passwordFields = (prefix = 'newPassword', label = 'Nova senha') => `
  ${textField({ name: prefix, label, type: 'password', autocomplete: 'new-password' })}
  <div class="strength" data-score="0"><div class="strength-bar"><span></span><span></span><span></span><span></span></div>
  <div class="strength-label">Use 8 caracteres ou mais com uma combinação de letras, números e símbolos</div></div>`;

function wireStrength(form, name) {
  const input = form.querySelector(`[name="${name}"]`);
  const box = form.querySelector('.strength');
  input.addEventListener('input', () => {
    const score = v.passwordStrength(input.value);
    box.dataset.score = String(score);
    box.querySelector('.strength-label').textContent = input.value
      ? `Força da senha: ${STRENGTH_LABELS[score] || 'Muito fraca'}`
      : 'Use 8 caracteres ou mais com uma combinação de letras, números e símbolos';
  });
}

// ---------- Início ----------

function renderHome() {
  content.innerHTML = `
    <div class="page-narrow">
      <div class="page-head">
        ${avatar(me, 'lg')}
        <h1>Boas-vindas, ${esc(fullName(me))}</h1>
        <p>Gerencie suas informações, privacidade e segurança para que o auth4 funcione melhor para você.</p>
      </div>
      <div class="cards">
        <a class="tile" href="#info">${icons.badge}<h3>Informações pessoais</h3>
          <p>Veja e atualize seu nome, data de nascimento, gênero e formas de contato.</p><span>Gerenciar informações</span></a>
        <a class="tile" href="#seguranca">${icons.lock}<h3>Segurança</h3>
          <p>Altere sua senha e veja os dispositivos conectados à sua conta.</p><span>Revisar segurança</span></a>
        ${me.role === 'admin' ? `<a class="tile" href="#usuarios">${icons.group}<h3>Usuários</h3>
          <p>Crie, edite e remova contas de usuários do auth4.</p><span>Gerenciar usuários</span></a>` : ''}
      </div>
    </div>`;
}

// ---------- Informações pessoais ----------

const row = (key, label, value) => `
  <button class="row" data-edit="${key}">
    <span class="row-label">${esc(label)}</span>
    <span class="row-value ${value ? '' : 'empty'}">${esc(value || 'Não informado')}</span>
    <span>${icons.chevronRight.replace('<svg', '<svg class="row-arrow"')}</span>
  </button>`;

function renderInfo() {
  content.innerHTML = `
    <div class="page-narrow">
      <div class="page-head"><h1>Informações pessoais</h1>
        <p>Informações sobre você e suas preferências nos serviços do auth4</p></div>
      <section class="panel">
        <div class="panel-head"><h2>Informações básicas</h2>
          <p>Algumas informações podem ficar visíveis para outras pessoas que usam o auth4.</p></div>
        ${row('name', 'Nome', fullName(me))}
        ${row('birthDate', 'Data de nascimento', formatDate(me.birthDate))}
        ${row('gender', 'Gênero', genderLabel(me))}
      </section>
      <section class="panel">
        <div class="panel-head"><h2>Informações de contato</h2></div>
        <div class="row static"><span class="row-label">Endereço auth4</span><span class="row-value">${esc(address(me))}</span><span></span></div>
        ${row('recoveryEmail', 'E-mail de recuperação', me.recoveryEmail)}
        ${row('phone', 'Telefone', formatPhone(me.phone))}
      </section>
    </div>`;
}

const EDITORS = {
  name: {
    title: 'Nome',
    description: 'As alterações no seu nome serão refletidas na sua conta auth4.',
    body: () => `${textField({ name: 'firstName', label: 'Nome', value: me.firstName, maxlength: 50, autocomplete: 'given-name' })}
      ${textField({ name: 'lastName', label: 'Sobrenome', value: me.lastName ?? '', maxlength: 50, autocomplete: 'family-name' })}`,
    read: (form) => ({ firstName: form.elements.firstName.value, lastName: form.elements.lastName.value }),
  },
  birthDate: {
    title: 'Data de nascimento',
    description: 'Sua data de nascimento pode ser usada para a segurança da conta.',
    body: () => dateFields(me.birthDate),
    read: (form) => {
      const d = readDate(form);
      if (d === 'invalid') localErrors({ birthDate: 'Insira uma data de nascimento válida' });
      return { birthDate: d };
    },
  },
  gender: {
    title: 'Gênero',
    body: () => genderFields(me),
    read: (form) => readGender(form),
  },
  phone: {
    title: 'Telefone',
    description: 'Seu número pode ser usado para recuperar o acesso à conta. Deixe em branco para remover.',
    body: () => textField({ name: 'phone', label: 'Número de telefone', type: 'tel', value: me.phone ?? '', inputmode: 'tel', maxlength: 20 }),
    read: (form) => ({ phone: form.elements.phone.value }),
  },
  recoveryEmail: {
    title: 'E-mail de recuperação',
    description: 'Usado para entrar em contato se houver atividade incomum na sua conta. Deixe em branco para remover.',
    body: () => textField({ name: 'recoveryEmail', label: 'E-mail de recuperação', type: 'email', value: me.recoveryEmail ?? '', maxlength: 254 }),
    read: (form) => ({ recoveryEmail: form.elements.recoveryEmail.value }),
  },
};

content.addEventListener('click', (e) => {
  const edit = e.target.closest('[data-edit]');
  if (!edit) return;
  const editor = EDITORS[edit.dataset.edit];
  openDialog({
    title: editor.title,
    description: editor.description,
    body: editor.body(),
    onSubmit: async (form) => {
      const { user } = await api('/me', { method: 'PATCH', body: editor.read(form) });
      setMe(user);
      toast('Alterações salvas');
    },
  });
});

// ---------- Segurança ----------

function describeAgent(ua = '') {
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox'
    : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Navegador';
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows'
    : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Dispositivo desconhecido';
  return { label: `${os} · ${browser}`, mobile: /Android|iPhone|iPad|Mobile/.test(ua) };
}

async function renderSecurity() {
  content.innerHTML = `
    <div class="page-narrow">
      <div class="page-head"><h1>Segurança</h1><p>Configurações e recomendações para ajudar a manter sua conta segura</p></div>
      <section class="panel">
        <div class="panel-head"><h2>Como você faz login no auth4</h2></div>
        <button class="row" id="change-password">
          <span class="row-label">Senha</span>
          <span class="row-value">Última alteração: ${esc(formatDate(me.passwordChangedAt || me.createdAt))}</span>
          <span>${icons.chevronRight.replace('<svg', '<svg class="row-arrow"')}</span>
        </button>
        <div class="row static"><span class="row-label">Último login</span>
          <span class="row-value">${esc(formatDateTime(me.lastLoginAt) || '—')}</span><span></span></div>
      </section>
      <section class="panel" id="devices">
        <div class="panel-head"><h2>Seus dispositivos</h2><p>Onde você está conectado no momento</p></div>
        <div class="empty-state">Carregando…</div>
      </section>
      <section class="panel danger-zone">
        <div class="panel-head"><h2>Excluir sua conta auth4</h2>
          <p>Todos os seus dados serão removidos permanentemente. Essa ação não pode ser desfeita.</p></div>
        <div class="panel-body"><button class="btn btn-outline" id="delete-account">Excluir conta</button></div>
      </section>
    </div>`;
  loadDevices();
}

async function loadDevices() {
  const box = $('#devices');
  if (!box) return;
  try {
    const { sessions } = await api('/me/sessions');
    const others = sessions.filter((s) => !s.current).length;
    box.innerHTML = `
      <div class="panel-head"><h2>Seus dispositivos</h2>
        <p>${sessions.length} ${sessions.length === 1 ? 'sessão ativa' : 'sessões ativas'}</p></div>
      ${sessions.map((s) => {
        const a = describeAgent(s.userAgent);
        return `<div class="device">${a.mobile ? icons.smartphone : icons.computer}
          <div><strong>${esc(a.label)}</strong>
            <small>${s.current ? '<span class="badge">Este dispositivo</span>' : `Ativo em ${esc(formatDateTime(s.lastSeenAt))}`}
              ${s.ip ? ` · IP ${esc(s.ip)}` : ''}</small></div>
          ${s.current ? '' : `<button class="btn btn-text" data-revoke="${esc(s.id)}">Sair</button>`}
        </div>`;
      }).join('')}
      ${others ? `<div class="panel-body"><button class="btn btn-outline" id="logout-others">Sair de todos os outros dispositivos</button></div>` : ''}`;
  } catch (err) {
    box.querySelector('.empty-state').textContent = err.message;
  }
}

content.addEventListener('click', async (e) => {
  if (e.target.closest('#change-password')) {
    openDialog({
      title: 'Alterar senha',
      description: 'Escolha uma senha forte e não a reutilize em outras contas. Os outros dispositivos serão desconectados.',
      body: `<input type="text" name="username" autocomplete="username" value="${esc(address(me))}" hidden>
        ${textField({ name: 'currentPassword', label: 'Senha atual', type: 'password', autocomplete: 'current-password' })}
        ${passwordFields()}
        ${textField({ name: 'confirm', label: 'Confirmar nova senha', type: 'password', autocomplete: 'new-password' })}`,
      submitLabel: 'Alterar senha',
      onOpen: (form) => wireStrength(form, 'newPassword'),
      onSubmit: async (form) => {
        const f = form.elements;
        const pw = v.password(f.newPassword.value);
        localErrors({
          currentPassword: f.currentPassword.value ? '' : 'Digite sua senha atual',
          newPassword: pw.error,
          confirm: !pw.error && f.confirm.value !== f.newPassword.value ? 'Essas senhas não coincidem. Tente novamente.' : '',
        });
        await api('/me/password', { method: 'PUT', body: { currentPassword: f.currentPassword.value, newPassword: f.newPassword.value } });
        me = (await api('/auth/me')).user;
        route();
        toast('Senha alterada');
      },
    });
  }

  const revoke = e.target.closest('[data-revoke]');
  if (revoke) {
    revoke.disabled = true;
    try {
      await api(`/me/sessions/${encodeURIComponent(revoke.dataset.revoke)}`, { method: 'DELETE' });
      toast('Dispositivo desconectado');
    } catch (err) {
      toast(err.message);
    }
    loadDevices();
  }

  if (e.target.closest('#logout-others')) {
    try {
      await api('/me/sessions/logout-others', { method: 'POST' });
      toast('Você saiu de todos os outros dispositivos');
    } catch (err) {
      toast(err.message);
    }
    loadDevices();
  }

  if (e.target.closest('#delete-account')) {
    openDialog({
      title: 'Excluir sua conta?',
      description: `A conta ${address(me)} e todos os dados associados serão excluídos permanentemente. Digite sua senha para confirmar.`,
      body: `<input type="text" name="username" autocomplete="username" value="${esc(address(me))}" hidden>
        ${textField({ name: 'password', label: 'Senha', type: 'password', autocomplete: 'current-password' })}`,
      submitLabel: 'Excluir conta',
      danger: true,
      onSubmit: async (form) => {
        localErrors({ password: form.elements.password.value ? '' : 'Digite sua senha' });
        await api('/me', { method: 'DELETE', body: { password: form.elements.password.value } });
        location.replace('/login');
      },
    });
  }
});

// ---------- Usuários (admin) ----------

let usersQuery = '';
let searchTimer;

async function renderUsers() {
  content.innerHTML = `
    <div class="page-head"><h1>Usuários</h1><p>Crie, edite e remova contas do auth4</p></div>
    <div class="toolbar">
      <label class="search">${icons.search}<span class="sr-only">Pesquisar</span>
        <input type="search" id="user-search" placeholder="Pesquisar por nome, usuário ou e-mail" value="${esc(usersQuery)}"></label>
      <button class="btn btn-filled" id="new-user">${icons.add.replace('<svg', '<svg width="18" height="18" fill="currentColor"')}Novo usuário</button>
    </div>
    <p class="count" id="user-count"></p>
    <div class="table-wrap" id="users-table"><div class="empty-state">Carregando…</div></div>`;
  $('#user-search').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { usersQuery = e.target.value; loadUsers(); }, 250);
  });
  loadUsers();
}

let usersCache = [];

async function loadUsers() {
  const wrap = $('#users-table');
  if (!wrap) return;
  try {
    const { users, total } = await api(`/admin/users?q=${encodeURIComponent(usersQuery)}`);
    usersCache = users;
    $('#user-count').textContent = usersQuery
      ? `${users.length} de ${total} ${total === 1 ? 'usuário' : 'usuários'}`
      : `${total} ${total === 1 ? 'usuário' : 'usuários'}`;
    if (!users.length) {
      wrap.innerHTML = '<div class="empty-state">Nenhum usuário encontrado.</div>';
      return;
    }
    wrap.innerHTML = `<table>
      <thead><tr><th>Usuário</th><th>Função</th><th>Telefone</th><th>Criado em</th><th>Último login</th><th><span class="sr-only">Ações</span></th></tr></thead>
      <tbody>${users.map((u) => `
        <tr>
          <td><div class="user-cell">${avatar(u)}<div><strong>${esc(fullName(u))}${u.id === me.id ? ' <span class="muted">(você)</span>' : ''}</strong>
            <small>${esc(address(u))}</small></div></div></td>
          <td><span class="badge ${u.role}">${u.role === 'admin' ? 'Administrador' : 'Usuário'}</span></td>
          <td>${u.phone ? esc(formatPhone(u.phone)) : '<span class="muted">—</span>'}</td>
          <td>${esc(formatDate(u.createdAt, { day: '2-digit', month: 'short', year: 'numeric' }))}</td>
          <td>${u.lastLoginAt ? esc(formatDateTime(u.lastLoginAt)) : '<span class="muted">Nunca</span>'}</td>
          <td class="actions-cell">
            <button class="icon-btn" data-user-edit="${u.id}" title="Editar" aria-label="Editar ${esc(fullName(u))}">${icons.edit}</button>
            ${u.id === me.id ? '' : `<button class="icon-btn" data-user-delete="${u.id}" title="Excluir" aria-label="Excluir ${esc(fullName(u))}">${icons.trash}</button>`}
          </td>
        </tr>`).join('')}</tbody></table>`;
  } catch (err) {
    if (err.status === 401) return location.replace('/login');
    wrap.innerHTML = `<div class="empty-state">${esc(err.message)}</div>`;
  }
}

function userFormBody(u = {}) {
  const isNew = !u.id;
  return `
    <div class="grid-2">
      ${textField({ name: 'firstName', label: 'Nome', value: u.firstName ?? '', maxlength: 50 })}
      ${textField({ name: 'lastName', label: 'Sobrenome (opcional)', value: u.lastName ?? '', maxlength: 50 })}
    </div>
    ${textField({ name: 'username', label: 'Nome de usuário', value: u.username ?? '', suffix: '@' + domain, maxlength: 30 })}
    ${dateFields(u.birthDate ?? '')}
    ${genderFields(u)}
    <div class="grid-2">
      ${textField({ name: 'phone', label: 'Telefone (opcional)', type: 'tel', value: u.phone ?? '', maxlength: 20 })}
      ${textField({ name: 'recoveryEmail', label: 'E-mail de recuperação (opcional)', type: 'email', value: u.recoveryEmail ?? '', maxlength: 254 })}
    </div>
    ${selectField({ name: 'role', label: 'Função', value: u.role ?? 'user', placeholder: null, options: [['user', 'Usuário'], ['admin', 'Administrador']] })}
    ${passwordFields('password', isNew ? 'Senha' : 'Nova senha (deixe em branco para manter)')}`;
}

function readUserForm(form, isNew) {
  const f = form.elements;
  const date = readDate(form);
  if (date === 'invalid') localErrors({ birthDate: 'Insira uma data de nascimento válida' });
  const body = {
    firstName: f.firstName.value,
    lastName: f.lastName.value,
    username: f.username.value,
    birthDate: date,
    ...readGender(form),
    phone: f.phone.value,
    recoveryEmail: f.recoveryEmail.value,
    role: f.role.value,
  };
  if (isNew || f.password.value) body.password = f.password.value;
  // Validação local rápida; o servidor valida tudo de novo.
  const { errors } = v.validateProfile(body);
  const un = v.username(body.username, domain);
  if (un.error) errors.username = un.error;
  if ('password' in body) {
    const pw = v.password(body.password);
    if (pw.error) errors.password = pw.error;
  }
  localErrors(errors);
  return body;
}

content.addEventListener('click', async (e) => {
  if (e.target.closest('#new-user')) {
    openDialog({
      title: 'Novo usuário',
      body: userFormBody(),
      submitLabel: 'Criar usuário',
      wide: true,
      onOpen: (form) => wireStrength(form, 'password'),
      onSubmit: async (form) => {
        const { user } = await api('/admin/users', { method: 'POST', body: readUserForm(form, true) });
        toast(`Conta ${address(user)} criada`);
        loadUsers();
      },
    });
  }

  const editBtn = e.target.closest('[data-user-edit]');
  if (editBtn) {
    const u = usersCache.find((x) => x.id === Number(editBtn.dataset.userEdit));
    if (!u) return;
    openDialog({
      title: `Editar ${fullName(u)}`,
      body: userFormBody(u),
      wide: true,
      onOpen: (form) => wireStrength(form, 'password'),
      onSubmit: async (form) => {
        const { user } = await api(`/admin/users/${u.id}`, { method: 'PATCH', body: readUserForm(form, false) });
        toast('Usuário atualizado');
        if (user.id === me.id) {
          me = user;
          renderChrome();
          if (user.role !== 'admin') return route();
          document.querySelector('#nav a[data-key="usuarios"]')?.classList.add('active');
        }
        loadUsers();
      },
    });
  }

  const delBtn = e.target.closest('[data-user-delete]');
  if (delBtn) {
    const u = usersCache.find((x) => x.id === Number(delBtn.dataset.userDelete));
    if (!u) return;
    openDialog({
      title: 'Excluir usuário?',
      description: `A conta ${address(u)} (${fullName(u)}) será excluída permanentemente, junto com todas as sessões ativas.`,
      body: '',
      submitLabel: 'Excluir',
      danger: true,
      onSubmit: async () => {
        await api(`/admin/users/${u.id}`, { method: 'DELETE' });
        toast('Usuário excluído');
        loadUsers();
      },
    });
  }
});

// ---------- início ----------

renderChrome();
route();
window.addEventListener('hashchange', route);

if (new URLSearchParams(location.search).has('bemvindo')) {
  history.replaceState(null, '', '/conta' + location.hash);
  toast(`Sua conta foi criada. Boas-vindas ao auth4, ${me.firstName}!`);
}
