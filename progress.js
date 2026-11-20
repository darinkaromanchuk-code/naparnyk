import { h, mount, screen } from './dom.js';
import { nav } from './home.js';
import { scoreRRS } from '../core/rrs.js';
import { programDay } from '../core/program.js';

function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

export function renderProgress(ctx) {
  const s = ctx.store.get();
  const today = ctx.today();
  const practiced = new Set(s.log.map((e) => e.date));
  const days = s.createdAt ? Array.from({ length: 14 }, (_, i) => addDays(s.createdAt, i)) : [];
  const ratings = s.log.filter((e) => typeof e.after === 'number').slice(-12);
  const pre = scoreRRS(s.rrs.pre.answers, ctx.rrs);
  const post = scoreRRS(s.rrs.post.answers, ctx.rrs);
  const stepsDone = Object.keys(s.steps).length;

  const compare = (a, b) => (b < a ? 'нижче, ніж було' : b > a ? 'вище, ніж було' : 'як було');
  mount(screen('Прогрес', () => ctx.go('home'),
    h('section', { class: 'card' },
      h('h2', {}, 'Дні практики'),
      h('p', { class: 'muted small' }, `День ${Math.max(1, programDay(s, today))} · кроків пройдено: ${stepsDone} з 6. Пропущені дні — не проблема, продовжуй з того місця, де зупинився.`),
      h('div', { class: 'days' }, days.map((d, i) => h('span', {
        class: 'day' + (practiced.has(d) ? ' filled' : '') + (d === today ? ' today' : ''),
        title: d,
      }, String(i + 1))))),
    h('section', { class: 'card' },
      h('h2', {}, 'Як ти почувався після вправ'),
      ratings.length
        ? h('div', { class: 'bars', 'aria-label': 'Оцінки напруження після вправ, від старих до нових' },
          ratings.map((e) => h('span', { class: 'bar', style: `height:${8 + e.after * 9}px`, title: `${e.date}: ${e.after}/10` })))
        : h('p', { class: 'muted' }, 'Тут з\'являться твої оцінки після вправ.'),
      h('p', { class: 'muted small' }, 'Нижчий стовпчик — менше напруження.')),
    h('section', { class: 'card' },
      h('h2', {}, 'Самооцінка'),
      !pre.complete ? h('p', { class: 'muted' }, 'Ще не пройдена.')
        : !post.complete
          ? h('p', {}, `Відправна точка: ${pre.total} з 88. Повторна самооцінка — на 14-й день програми.`)
          : [
            h('p', { class: 'big' }, `${pre.total} → ${post.total}`),
            h('p', {}, `Загальний показник ${compare(pre.total, post.total)}.`),
            h('div', { class: 'list' }, ctx.rrs.scales.filter((sc) => sc.short !== 'RRS').map((sc) => h('p', { class: 'small' },
              `${sc.name}: ${pre.scales[sc.short]} → ${post.scales[sc.short]} (${compare(pre.scales[sc.short], post.scales[sc.short])})`))),
            h('p', { class: 'muted small' }, 'Це не діагноз, а орієнтир для тебе. Результатом можна поділитися з психологом.'),
          ]),
    nav(ctx, 'progress')));
}

