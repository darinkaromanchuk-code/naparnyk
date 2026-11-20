import { createStore, todayISO } from './core/store.js';
import { phase } from './core/program.js';
import { h, mount } from './ui/dom.js';

const ROUTES = {
  onboarding: () => import('./ui/onboarding.js').then((m) => m.renderOnboarding),
  rrs: () => import('./ui/rrs-screen.js').then((m) => m.renderRRS),
  home: () => import('./ui/home.js').then((m) => m.renderHome),
  step: () => import('./ui/exercise.js').then((m) => m.renderStep),
  exercise: () => import('./ui/exercise.js').then((m) => m.renderExerciseScreen),
  sos: () => import('./ui/sos.js').then((m) => m.renderSOS),
  diary: () => import('./ui/diary.js').then((m) => m.renderDiary),
  progress: () => import('./ui/progress.js').then((m) => m.renderProgress),
  settings: () => import('./ui/settings.js').then((m) => m.renderSettings),
  help: () => import('./ui/settings.js').then((m) => m.renderHelp),
};

function debugToday() {
  const q = new URLSearchParams(location.search).get('today');
  return q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : null;
}

async function loadJSON(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(path);
  return r.json();
}

async function start() {
  let storage;
  try { storage = window.localStorage; } catch { storage = null; }
  const store = createStore(storage);
  const [content, rrs] = await Promise.all([loadJSON('content/content.json'), loadJSON('content/rrs.json')]);
  const fixedToday = debugToday();

  const ctx = {
    store, content, rrs,
    today: () => fixedToday || todayISO(),
    exercise: (id) => content.exercises.find((e) => e.id === id),
    async go(route, params = {}) {
      const render = await (ROUTES[route] || ROUTES.home)();
      render(ctx, params);
    },
    banner() {
      return store.persistent ? null
        : h('p', { class: 'banner', role: 'status' }, 'Сховище браузера недоступне — прогрес не збережеться після закриття.');
    },
  };

  ctx.restart = () => {
    const p = phase(store.get(), ctx.today());
    if (p === 'onboarding') ctx.go('onboarding');
    else if (p === 'rrs-pre') ctx.go('rrs', { which: 'pre' });
    else ctx.go('home');
  };
  ctx.helpButton = () => h('button', { class: 'help', onclick: () => ctx.go('help') }, 'Допомога');
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && document.querySelector('.home-screen')) ctx.go('home');
  });
  ctx.restart();
}

start().catch((e) => {
  mount(h('main', { class: 'screen' }, h('p', { class: 'banner' }, 'Не вдалося запустити додаток. Онови сторінку.'), h('pre', {}, String(e))));
});

if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
