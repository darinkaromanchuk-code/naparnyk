import { h, mount, screen } from './dom.js';
import { firstUnanswered, scoreRRS } from '../core/rrs.js';

export function renderRRS(ctx, { which = 'pre' } = {}) {
  const answers = ctx.store.get().rrs[which].answers;
  if (Object.keys(answers).length === 0) intro(ctx, which);
  else item(ctx, which, firstUnanswered(answers, ctx.rrs) ?? ctx.rrs.items.length);
}

function intro(ctx, which) {
  const back = which === 'post' ? () => ctx.go('home') : null;
  mount(screen(which === 'pre' ? 'Самооцінка' : 'Повторна самооцінка', back,
    ctx.banner(),
    h('p', { class: 'lead' }, which === 'pre'
      ? 'Спершу — 22 короткі твердження. Це твоя відправна точка: через два тижні пройдеш їх ще раз і побачиш зміни.'
      : 'Минуло два тижні. Пройди ті самі 22 твердження — і подивимося, що змінилося.'),
    h('p', {}, ctx.rrs.guide),
    h('p', { class: 'muted small' }, 'Можна зупинитися будь-коли — відповіді збережуться.'),
    ctx.helpButton(),
    h('button', { class: 'btn primary', onclick: () => item(ctx, which, 1) }, 'Почати самооцінку')));
}

function item(ctx, which, n) {
  const it = ctx.rrs.items.find((x) => x.n === n);
  const current = ctx.store.get().rrs[which].answers[n];
  const answer = (value) => {
    ctx.store.update((s) => { s.rrs[which].answers[n] = value; });
    const next = firstUnanswered(ctx.store.get().rrs[which].answers, ctx.rrs);
    if (next === null) finish(ctx, which);
    else item(ctx, which, next > n ? next : Math.min(n + 1, ctx.rrs.items.length));
  };
  mount(screen('Самооцінка', n > 1 ? () => item(ctx, which, n - 1) : () => intro(ctx, which),
    h('p', { class: 'muted' }, `${n} / ${ctx.rrs.items.length}`),
    h('div', { class: 'progressbar' }, h('span', { style: `width:${Math.round(((n - 1) / ctx.rrs.items.length) * 100)}%` })),
    h('p', { class: 'muted small' }, 'Коли мені сумно чи пригнічено…'),
    h('p', { class: 'statement' }, it.text),
    h('div', { class: 'options' },
      ctx.rrs.options.map((o) => h('button', { class: 'btn option' + (current === o.value ? ' selected' : ''), onclick: () => answer(o.value) }, o.text))),
    h('div', { class: 'top-right' }, ctx.helpButton())));
}

function finish(ctx, which) {
  ctx.store.update((s) => { s.rrs[which].doneAt = ctx.today(); });
  const score = scoreRRS(ctx.store.get().rrs[which].answers, ctx.rrs);
  const pre = which === 'post' ? scoreRRS(ctx.store.get().rrs.pre.answers, ctx.rrs) : null;
  const diff = pre && pre.total !== null ? score.total - pre.total : null;
  mount(screen('Готово', null,
    h('p', { class: 'lead' }, which === 'pre' ? 'Дякую. Відправну точку записано.' : 'Дякую. Ось що змінилося.'),
    h('p', { class: 'big' }, `${score.total} з 88`),
    diff !== null
      ? h('p', {}, diff < 0 ? `Це на ${-diff} нижче, ніж було (${pre.total}). Гремлін помітно тихішає.`
        : diff > 0 ? `Це на ${diff} вище, ніж було (${pre.total}). Так буває — варто обговорити з психологом.`
          : `Так само, як було (${pre.total}).`)
      : h('p', { class: 'muted small' }, 'Чим менше число, тим менше думки ходять по колу. Це не діагноз, а орієнтир для тебе.'),
    h('button', { class: 'btn primary', onclick: () => ctx.go('home') }, 'На головну')));
}
