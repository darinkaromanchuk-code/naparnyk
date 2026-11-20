import { h, mount, trustedSVG } from './dom.js';
import { companionSVG } from './art.js';

const KINDS = [
  { kind: 'dog', label: 'Пес', note: 'службовий напарник' },
  { kind: 'cat', label: 'Кіт', note: 'спокійний і впертий' },
  { kind: 'fox', label: 'Лисиця', note: 'уважна й кмітлива' },
];

export function renderOnboarding(ctx) {
  intro(ctx);
}

function intro(ctx) {
  mount(h('main', { class: 'screen center' },
    h('div', { class: 'top-right' }, ctx.helpButton()),
    ctx.banner(),
    trustedSVG(companionSVG('dog', 'calm'), 'hero'),
    h('h1', { class: 'title' }, 'Напарник'),
    h('p', { class: 'lead' }, 'Коли думки ходять по колу, їх легше приборкати вдвох. Короткі вправи щодня — і гремлін зациклених думок стає меншим.'),
    h('p', { class: 'muted small' }, ctx.content.disclaimer),
    h('p', { class: 'muted small' }, 'Без реєстрації. Усе, що ти запишеш, зберігається тільки на цьому пристрої.'),
    h('button', { class: 'btn primary', onclick: () => choose(ctx) }, 'Почати')));
}

function choose(ctx) {
  mount(h('main', { class: 'screen' },
    h('h1', { class: 'title' }, 'Обери напарника'),
    h('div', { class: 'choices' },
      KINDS.map((k) => h('button', { class: 'choice', 'data-kind': k.kind, onclick: () => name(ctx, k.kind) },
        trustedSVG(companionSVG(k.kind, 'calm'), 'choice-art'),
        h('strong', {}, k.label),
        h('span', { class: 'muted small' }, k.note)))),
    h('button', { class: 'btn ghost', onclick: () => intro(ctx) }, 'Назад')));
}

function name(ctx, kind) {
  const input = h('input', { id: 'pet-name', maxlength: '24', autocomplete: 'off', placeholder: ctx.content.nameSuggestions[kind][0] });
  const error = h('p', { class: 'error', role: 'alert' });
  input.addEventListener('input', () => { error.textContent = ''; });
  const done = () => {
    const value = input.value.trim();
    if (!value) { error.textContent = "Дай напарнику ім'я або обери підказку"; input.focus(); return; }
    ctx.store.update((s) => {
      s.companion = { kind, name: value };
      s.createdAt = s.createdAt || ctx.today();
    });
    ctx.go('rrs', { which: 'pre' });
  };
  mount(h('main', { class: 'screen' },
    trustedSVG(companionSVG(kind, 'joy'), 'hero'),
    h('label', { for: 'pet-name', class: 'title' }, "Ім'я напарника"),
    input,
    error,
    h('div', { class: 'chips' },
      ctx.content.nameSuggestions[kind].map((n) => h('button', { class: 'chip', onclick: () => { input.value = n; error.textContent = ''; } }, n))),
    h('button', { class: 'btn primary', onclick: done }, 'Далі'),
    h('button', { class: 'btn ghost', onclick: () => choose(ctx) }, 'Назад')));
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(); });
}
