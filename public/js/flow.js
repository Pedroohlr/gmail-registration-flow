// Motor das telas em etapas (login e cadastro), no estilo "uma pergunta por vez".
import { esc, logo, footerHTML, clearErrors, showErrors, showFormError, setLoading, liveClear, fitSuffixes } from './common.js';

export function createFlow(steps) {
  const card = document.getElementById('card');
  const form = document.getElementById('form');
  const head = document.getElementById('head');
  const title = document.getElementById('title');
  const subtitle = document.getElementById('subtitle');
  const actions = document.getElementById('actions');

  document.getElementById('logo').innerHTML = logo();
  document.getElementById('footer').outerHTML = footerHTML;

  form.innerHTML = Object.entries(steps)
    .map(([name, s]) => `<section class="step" data-step="${name}">${s.html ?? ''}</section>`)
    .join('');
  liveClear(form);

  const visited = new Set();
  let current = null;
  let busy = false;

  const stepEl = (name = current) => form.querySelector(`[data-step="${name}"]`);

  function renderActions(step) {
    actions.innerHTML = '';
    for (const a of step.actions?.() ?? []) {
      const btn = document.createElement('button');
      btn.className = `btn ${a.primary ? 'btn-filled' : 'btn-text'}`;
      btn.textContent = a.label;
      if (a.primary) {
        btn.type = 'submit';
        btn.setAttribute('form', 'form');
      } else {
        btn.type = 'button';
        btn.addEventListener('click', () => run(a.onClick));
      }
      actions.append(btn);
    }
  }

  function show(name, { push = true } = {}) {
    const step = steps[name];
    current = name;
    visited.add(name);
    clearErrors(form);

    title.textContent = typeof step.title === 'function' ? step.title() : step.title;
    subtitle.innerHTML = step.subtitleHTML ? step.subtitleHTML() : `<p>${esc(step.subtitle ?? '')}</p>`;
    head.classList.remove('anim');
    void head.offsetWidth; // reinicia a animação
    head.classList.add('anim');

    form.querySelectorAll('.step').forEach((s) => s.classList.toggle('active', s.dataset.step === name));
    renderActions(step);
    document.title = `${step.pageTitle ?? title.textContent} – auth4`;

    if (push) history.pushState({ step: name }, '');
    else if (!history.state) history.replaceState({ step: name }, '');

    step.onShow?.(stepEl(name));
    fitSuffixes(stepEl(name));
    if (!step.noAutofocus) stepEl(name).querySelector('input:not([type=radio]):not([type=checkbox]), select')?.focus();
  }

  async function run(fn) {
    if (busy || !fn) return;
    busy = true;
    clearErrors(form);
    setLoading(card, true);
    try {
      await fn(stepEl());
    } catch (err) {
      const el = stepEl();
      if (!showErrors(el, err.fields)) showFormError(el, err.message);
    } finally {
      busy = false;
      setLoading(card, false);
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const primary = steps[current].actions?.().find((a) => a.primary);
    run(primary?.onClick);
  });

  window.addEventListener('popstate', (e) => {
    const name = e.state?.step;
    if (name && visited.has(name) && steps[name]) show(name, { push: false });
  });

  return {
    show,
    start: (name) => show(name, { push: false }),
    stepEl,
    get current() { return current; },
  };
}

// Erro de validação local no mesmo formato do servidor.
export function fieldError(fields) {
  const err = new Error(Object.values(fields)[0]);
  err.fields = fields;
  return err;
}
