import { h, mount, trustedSVG } from './dom.js';
import { sceneSVG, faceFor } from './art.js';
import { nextStep, retestDue, phase, programDay } from './program.js';
import { gremlinLevel, companionMood, homeLevel } from './game.js';

function moodText(name, face, mood) {
  if (face === 'sad') return `Над вами хмари. ${name} поруч — розженімо їх разом.`;
  if (mood === 'waiting') return `${name} радий тебе бачити знову.`;
  if (face === 'joy') return `${name} радий, що ви сьогодні разом. Проясняється!`;
  return `${name} поруч і спокійно чекає.`;
}

export function nav(ctx, active) {
  const item = (route, label) => h('button', { class: 'nav-item' + (active === route ? ' active' : ''), onclick: () => ctx.go(route) }, label);
  return h('nav', { class: 'nav' }, item('home', 'Головна'), item('diary', 'Щоденник'), item('progress', 'Прогрес'), item('settings', 'Налаштування'));
}

export function renderHome(ctx, { shrink = false } = {}) {
  const s = ctx.store.get();
  const today = ctx.today();
  const mood = companionMood(s, today);
  const level = gremlinLevel(s, today);
  const face = faceFor(level, mood);
  const scene = h('section', { class: 'scene' + (shrink ? ' shrink' : '') },
    trustedSVG(sceneSVG({ kind: s.companion.kind, face, level, home: homeLevel(s) }), 'scene-bg'));

  mount(h('main', { class: 'screen home-screen' },
    h('header', { class: 'bar' },
      h('h1', {}, s.companion.name),
      h('button', { class: 'help', onclick: () => ctx.go('help') }, 'Допомога')),
    ctx.banner(),
    scene,
    h('p', { class: 'mood muted' }, moodText(s.companion.name, face, mood)),
    todayCard(ctx, s, today),
    h('button', { class: 'btn sos', onclick: () => ctx.go('sos') }, 'Мене накрило зараз'),
    h('h2', {}, 'Вправи'),
    h('div', { class: 'list' },
      ctx.content.free.map((id) => {
        const e = ctx.exercise(id);
        return h('button', { class: 'row', onclick: () => ctx.go('exercise', { id }) },
          h('span', {}, e.title), h('span', { class: 'muted small' }, `${e.minutes} хв`));
      })),
    nav(ctx, 'home')));
}

function todayCard(ctx, s, today) {
  if (retestDue(s, today)) {
    return h('section', { class: 'card accent' },
      h('h2', {}, 'Час повторної самооцінки'),
      h('p', {}, 'Минуло два тижні. Подивимося, що змінилося.'),
      h('button', { class: 'btn primary', onclick: () => ctx.go('rrs', { which: 'post' }) }, 'Пройти самооцінку'));
  }
  if (phase(s, today) === 'free') {
    return h('section', { class: 'card' }, h('h2', {}, 'Програму пройдено'),
      h('p', {}, 'Вправи завжди під рукою. Повертайся до тих, що допомагають.'));
  }
  const step = nextStep(s, today);
  if (!step) {
    return h('section', { class: 'card' }, h('h2', {}, 'Усі 6 кроків пройдено'),
      h('p', {}, `Повторна самооцінка відкриється на 14-й день (зараз — ${programDay(s, today)}-й). А поки — вільні вправи.`));
  }
  const info = ctx.content.steps.find((x) => x.n === step.n);
  if (!step.available) {
    return h('section', { class: 'card' }, h('h2', {}, `Крок ${step.n - 1} виконано`),
      h('p', {}, `Наступний — «${info.title}» — відкриється завтра. Сьогодні можна зробити будь-яку вправу нижче.`));
  }
  const mins = info.exercises.reduce((m, id) => m + ctx.exercise(id).minutes, 0);
  return h('section', { class: 'card accent' },
    h('p', { class: 'muted small' }, `Сьогодні · Крок ${step.n} з 6 · ~${mins} хв`),
    h('h2', {}, `Крок ${step.n}. ${info.title}`),
    h('p', {}, info.intro),
    h('button', { class: 'btn primary', onclick: () => ctx.go('step', { n: step.n }) }, 'Почати'));
}
