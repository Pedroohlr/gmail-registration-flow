import { api, esc, getConfig, textField, avatar, icons } from './common.js';
import { createFlow, fieldError } from './flow.js';

const { domain } = await getConfig();
const state = { identifier: '', account: null };

const nextUrl = () => {
  const next = new URLSearchParams(location.search).get('continuar');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/conta';
};

const flow = createFlow({
  identifier: {
    title: 'Fazer login',
    subtitle: 'Use sua conta auth4',
    html: `
      ${textField({ name: 'identifier', label: 'E-mail ou nome de usuário', autocomplete: 'username', type: 'text' })}
      <p class="note">Não está no seu computador? Use uma janela anônima para fazer login com privacidade.</p>`,
    actions: () => [
      { label: 'Criar conta', onClick: () => location.assign('/cadastro') },
      {
        label: 'Próxima',
        primary: true,
        onClick: async (el) => {
          const identifier = el.querySelector('[name="identifier"]').value.trim();
          if (!identifier) throw fieldError({ identifier: 'Digite um e-mail ou nome de usuário' });
          const { user } = await api('/auth/lookup', { method: 'POST', body: { identifier } });
          state.identifier = identifier;
          state.account = user;
          flow.show('password');
        },
      },
    ],
  },

  password: {
    title: () => `Olá, ${state.account?.firstName ?? ''}`,
    pageTitle: 'Fazer login',
    subtitleHTML: () => `
      <button type="button" class="account-chip" id="switch-account" title="Trocar de conta">
        ${avatar(state.account)}
        <span>${esc(state.account?.username)}@${esc(domain)}</span>
        ${icons.chevronDown}
      </button>`,
    html: `
      <p class="note">Para continuar, primeiro confirme sua identidade</p>
      <input type="text" name="username" autocomplete="username" hidden>
      ${textField({ name: 'password', label: 'Digite sua senha', type: 'password', autocomplete: 'current-password' })}
      <label class="check"><input type="checkbox" id="show-password"> Mostrar senha</label>`,
    onShow: (el) => {
      el.querySelector('[name="username"]').value = `${state.account.username}@${domain}`;
      const pw = el.querySelector('[name="password"]');
      pw.value = '';
      pw.type = 'password';
      el.querySelector('#show-password').checked = false;
      document.getElementById('switch-account').addEventListener('click', () => history.back());
    },
    actions: () => [
      {
        label: 'Próxima',
        primary: true,
        onClick: async (el) => {
          const password = el.querySelector('[name="password"]').value;
          if (!password) throw fieldError({ password: 'Digite uma senha' });
          await api('/auth/login', { method: 'POST', body: { identifier: state.account.username, password } });
          location.replace(nextUrl());
        },
      },
    ],
  },
});

flow.stepEl('password').querySelector('#show-password').addEventListener('change', (e) => {
  flow.stepEl('password').querySelector('[name="password"]').type = e.target.checked ? 'text' : 'password';
});

flow.start('identifier');
