export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k === 'value') el.value = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

/** Only for SVG produced by js/ui/art.js — never for user text. */
export function trustedSVG(markup, cls = '') {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  const wrap = document.createElement('div');
  wrap.className = cls;
  wrap.append(t.content);
  return wrap;
}

let unlockAt = 0;
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    if (performance.now() < unlockAt && e.target.closest && e.target.closest('#app')) { e.stopPropagation(); e.preventDefault(); }
  }, true);
}

export function mount(...nodes) {
  unlockAt = performance.now() + (window.__TAP_GUARD_MS ?? 350);
  const app = document.getElementById('app');
  app.replaceChildren(...nodes.flat());
  window.scrollTo(0, 0);
}

export function screen(title, onBack, ...body) {
  return h('main', { class: 'screen' },
    h('header', { class: 'bar' },
      onBack ? h('button', { class: 'back', 'aria-label': 'Назад', onclick: onBack }, '‹') : h('span', { class: 'back-space' }),
      h('h1', {}, title)),
    ...body);
}
