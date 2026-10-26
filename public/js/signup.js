import {
  api, esc, getConfig, textField, dateFields, genderFields, wireGender, readDate, readGender,
  onlyDigits, avatar, fullName, formatDate, formatPhone, genderLabel, icons, STRENGTH_LABELS, fitSuffixes,
} from './common.js';
import { createFlow, fieldError } from './flow.js';
import * as v from './validation.js';

const { domain } = await getConfig();
const state = {};

// Em qual etapa cada campo vive (para voltar até ela se o servidor recusar algo).
const STEP_OF = {
  firstName: 'name', lastName: 'name', birthDate: 'basic', gender: 'basic', genderCustom: 'basic', pronoun: 'basic',
  username: 'username', password: 'password', phone: 'phone', recoveryEmail: 'recovery',
};

const check = (fields) => {
  const errors = Object.fromEntries(Object.entries(fields).filter(([, msg]) => msg));
  if (Object.keys(errors).length) throw fieldError(errors);
};

let suggestionsFor = null;

const flow = createFlow({
  name: {
    title: 'Criar uma conta auth4',
    subtitle: 'Digite seu nome',
    html: `
      ${textField({ name: 'firstName', label: 'Nome', autocomplete: 'given-name', maxlength: 50 })}
      ${textField({ name: 'lastName', label: 'Sobrenome (opcional)', autocomplete: 'family-name', maxlength: 50 })}`,
    actions: () => [
      { label: 'Fazer login', onClick: () => location.assign('/login')},
      {
        label: 'Próxima', primary: true,
        onClick: (el) => {
          const first = v.firstName(el.querySelector('[name="firstName"]').value);
          const last = v.lastName(el.querySelector('[name="lastName"]').value);
          check({ firstName: first.error, lastName: last.error });
          state.firstName = first.value;
          state.lastName = last.value;
          flow.show('basic');
        },
      },
    ],
  },

  basic: {
    title: 'Informações básicas',
    subtitle: 'Informe sua data de nascimento e seu gênero',
    html: `${dateFields()}${genderFields()}
      <p class="note">Por que pedimos essas informações? Elas ajudam a proteger sua conta e a garantir que você tem idade para usar o auth4.</p>`,
    actions: () => [{
      label: 'Próxima', primary: true,
      onClick: (el) => {
        const date = readDate(el);
        const bd = date === 'invalid' ? { error: 'Insira uma data de nascimento válida' } : v.birthDate(date);
        const g = readGender(el);
        const gr = v.gender(g.gender, g.genderCustom, g.pronoun);
        check({ birthDate: bd.error, [gr.field || 'gender']: gr.error });
        state.birthDate = bd.value;
        Object.assign(state, gr.value);
        flow.show('username');
      },
    }],
  },

  username: {
    title: 'Escolha seu endereço auth4',
    subtitle: 'Escolha um endereço auth4 ou crie o seu',
    html: `
      <div class="radio-list" id="suggestions"></div>
      <div id="custom-username" hidden>
        ${textField({ name: 'username', label: 'Criar um endereço auth4', suffix: '@' + domain, maxlength: 30, autocomplete: 'off',
          hint: 'Você pode usar letras, números e pontos' })}
      </div>`,
    noAutofocus: true,
    onShow: (el) => loadSuggestions(el),
    actions: () => [{
      label: 'Próxima', primary: true,
      onClick: async (el) => {
        const choice = el.querySelector('[name="choice"]:checked')?.value;
        const raw = choice === '__custom' || !choice ? el.querySelector('[name="username"]').value : choice;
        const local = v.username(raw, domain);
        check({ username: local.error });
        const res = await api('/signup/username', { method: 'POST', body: { username: local.value } });
        if (!res.available) {
          if (choice && choice !== '__custom') await loadSuggestions(el, true);
          selectCustom(el, raw);
          throw fieldError({ username: res.error });
        }
        state.username = res.username;
        flow.show('password');
      },
    }],
  },

  password: {
    title: 'Crie uma senha forte',
    subtitle: 'Crie uma senha forte com uma combinação de letras, números e símbolos',
    html: `
      <input type="text" name="usernameHint" autocomplete="username" hidden>
      ${textField({ name: 'password', label: 'Senha', type: 'password', autocomplete: 'new-password' })}
      <div class="strength" id="strength" data-score="0" aria-live="polite">
        <div class="strength-bar"><span></span><span></span><span></span><span></span></div>
        <div class="strength-label">Use 8 caracteres ou mais com uma combinação de letras, números e símbolos</div>
      </div>
      ${textField({ name: 'confirm', label: 'Confirmar', type: 'password', autocomplete: 'new-password' })}
      <label class="check"><input type="checkbox" id="show-password"> Mostrar senha</label>`,
    onShow: (el) => { el.querySelector('[name="usernameHint"]').value = `${state.username}@${domain}`; },
    actions: () => [{
      label: 'Próxima', primary: true,
      onClick: (el) => {
        const pw = el.querySelector('[name="password"]').value;
        const confirm = el.querySelector('[name="confirm"]').value;
        const r = v.password(pw);
        check({ password: r.error });
        if (!confirm) check({ confirm: 'Confirme sua senha' });
        if (confirm !== pw) check({ confirm: 'Essas senhas não coincidem. Tente novamente.' });
        state.password = pw;
        flow.show('phone');
      },
    }],
  },

  phone: {
    title: 'Adicionar número de telefone',
    subtitle: 'Seu número pode ajudar a recuperar o acesso à sua conta, se necessário',
    html: `${textField({ name: 'phone', label: 'Número de telefone', type: 'tel', autocomplete: 'tel', inputmode: 'tel', maxlength: 20,
      hint: 'Com DDD. Ex.: (11) 91234-5678 ou +55 11 91234-5678' })}`,
    actions: () => [
      { label: 'Pular', onClick: () => { state.phone = null; flow.stepEl('phone').querySelector('[name="phone"]').value = ''; flow.show('recovery'); } },
      {
        label: 'Próxima', primary: true,
        onClick: (el) => {
          const r = v.phone(el.querySelector('[name="phone"]').value);
          check({ phone: r.error });
          state.phone = r.value;
          flow.show('recovery');
        },
      },
    ],
  },

  recovery: {
    title: 'Adicionar e-mail de recuperação',
    subtitle: 'Esse é o endereço que usaremos para entrar em contato se houver atividade incomum na sua conta ou se você não conseguir acessá-la',
    html: `${textField({ name: 'recoveryEmail', label: 'E-mail de recuperação', type: 'email', autocomplete: 'email', maxlength: 254 })}`,
    actions: () => [
      { label: 'Pular', onClick: () => { state.recoveryEmail = null; flow.stepEl('recovery').querySelector('[name="recoveryEmail"]').value = ''; flow.show('review'); } },
      {
        label: 'Próxima', primary: true,
        onClick: (el) => {
          const r = v.email(el.querySelector('[name="recoveryEmail"]').value);
          if (r.value && r.value === `${state.username}@${domain}`) check({ recoveryEmail: 'Use um e-mail diferente do seu endereço auth4' });
          check({ recoveryEmail: r.error });
          state.recoveryEmail = r.value;
          flow.show('review');
        },
      },
    ],
  },

  review: {
    title: 'Revise as informações da sua conta',
    subtitle: 'Você pode usar este endereço para fazer login depois',
    html: '<div id="review"></div>',
    onShow: (el) => {
      const rows = [
        [icons.mail, 'Endereço auth4', `${state.username}@${domain}`],
        [icons.cake, 'Data de nascimento', formatDate(state.birthDate)],
        [icons.person, 'Gênero', genderLabel(state)],
        state.phone && [icons.phone, 'Telefone', formatPhone(state.phone)],
        state.recoveryEmail && [icons.mail, 'E-mail de recuperação', state.recoveryEmail],
      ].filter(Boolean);
      el.querySelector('#review').innerHTML = `
        <div class="review-card">
          <div class="review-head">${avatar(state, 'md')}<div><strong>${esc(fullName(state))}</strong><small>${esc(state.username)}@${esc(domain)}</small></div></div>
          ${rows.map(([icon, label, value]) => `<div class="review-row">${icon}<div><small>${esc(label)}</small><span>${esc(value)}</span></div></div>`).join('')}
        </div>`;
    },
    actions: () => [{ label: 'Próxima', primary: true, onClick: () => flow.show('terms') }],
  },

  terms: {
    title: 'Privacidade e Termos',
    subtitle: 'Para criar uma conta, você precisa concordar com os Termos de Serviço abaixo',
    html: `<div class="terms-box" tabindex="0">
      <h3>Dados que tratamos quando você usa o auth4</h3>
      <p>Ao criar uma conta, armazenamos as informações que você nos fornece, como nome, data de nascimento, gênero, endereço auth4, telefone e e-mail de recuperação.</p>
      <p>Também registramos informações sobre os dispositivos que acessam sua conta (navegador, sistema e endereço IP) para manter você conectado e proteger sua conta.</p>
      <h3>Por que tratamos esses dados</h3>
      <ul>
        <li>Para identificar você e permitir o login com segurança</li>
        <li>Para ajudar a recuperar sua conta caso você perca o acesso</li>
        <li>Para detectar e impedir atividades suspeitas</li>
      </ul>
      <h3>Sua senha</h3>
      <p>Nunca guardamos sua senha em texto. Ela é protegida com um algoritmo de hash e não pode ser vista por ninguém, nem pelos administradores.</p>
      <h3>Você está no controle</h3>
      <p>Você pode ver e editar suas informações, encerrar sessões em outros dispositivos e excluir sua conta a qualquer momento na página "Minha conta".</p>
      <p>Ao selecionar "Concordo", você aceita os Termos de Serviço e confirma que leu a Política de Privacidade do auth4.</p>
    </div>`,
    noAutofocus: true,
    actions: () => [{
      label: 'Concordo', primary: true,
      onClick: async () => {
        try {
          await api('/signup', { method: 'POST', body: { ...state, acceptTerms: true } });
        } catch (err) {
          const step = Object.keys(err.fields || {}).map((f) => STEP_OF[f]).find(Boolean);
          if (step) flow.show(step);
          throw err;
        }
        location.replace('/conta?bemvindo=1');
      },
    }],
  },
});

// ---------- etapa de usuário ----------

function selectCustom(el, value) {
  const custom = el.querySelector('[value="__custom"]');
  if (custom) custom.checked = true;
  el.querySelector('#custom-username').hidden = false;
  const input = el.querySelector('[name="username"]');
  input.value = v.normalizeUsername(value, domain);
  fitSuffixes(el);
}

async function loadSuggestions(el, force = false) {
  const key = `${state.firstName}|${state.lastName}`;
  if (!force && suggestionsFor === key) return;
  suggestionsFor = key;
  let suggestions = [];
  try {
    ({ suggestions } = await api('/signup/suggestions', { method: 'POST', body: { firstName: state.firstName, lastName: state.lastName } }));
  } catch { /* sem sugestões, segue só com o campo livre */ }

  const list = el.querySelector('#suggestions');
  const custom = el.querySelector('#custom-username');
  if (!suggestions.length) {
    list.innerHTML = '';
    custom.hidden = false;
    fitSuffixes(el);
    el.querySelector('[name="username"]').focus();
    return;
  }
  list.innerHTML = suggestions.map((s, i) => `
      <label class="radio-item"><input type="radio" name="choice" value="${esc(s)}" ${i === 0 ? 'checked' : ''}>
        <span class="radio-main">${esc(s)}<span class="radio-domain">@${esc(domain)}</span></span></label>`).join('') +
    `<label class="radio-item"><input type="radio" name="choice" value="__custom">
        <span class="radio-main">Criar seu próprio endereço auth4</span></label>`;
  custom.hidden = true;
  list.querySelector('input').focus();
}

flow.stepEl('username').addEventListener('change', (e) => {
  if (e.target.name !== 'choice') return;
  const el = flow.stepEl('username');
  const isCustom = e.target.value === '__custom';
  el.querySelector('#custom-username').hidden = !isCustom;
  if (isCustom) {
    fitSuffixes(el);
    el.querySelector('[name="username"]').focus();
  }
});

// ---------- etapa de senha ----------

const pwStep = flow.stepEl('password');
pwStep.querySelector('[name="password"]').addEventListener('input', (e) => {
  const score = v.passwordStrength(e.target.value);
  const box = pwStep.querySelector('#strength');
  box.dataset.score = String(score);
  box.querySelector('.strength-label').textContent = e.target.value
    ? `Força da senha: ${STRENGTH_LABELS[score] || 'Muito fraca'}`
    : 'Use 8 caracteres ou mais com uma combinação de letras, números e símbolos';
});
pwStep.querySelector('#show-password').addEventListener('change', (e) => {
  pwStep.querySelectorAll('[name="password"], [name="confirm"]').forEach((i) => { i.type = e.target.checked ? 'text' : 'password'; });
});

wireGender(flow.stepEl('basic'));
onlyDigits(flow.stepEl('basic').querySelector('[name="day"]'));
onlyDigits(flow.stepEl('basic').querySelector('[name="year"]'));

flow.start('name');
