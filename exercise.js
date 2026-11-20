import { h, mount, screen } from './dom.js';
import { recordExercise, stepProgress } from './session.js';

let cleanups = [];
function cleanup() { cleanups.forEach((f) => f()); cleanups = []; }

export function ratingBlock(label, value, onPick) {
  const grid = h('div', { class: 'rating', role: 'group', 'aria-label': label });
  for (let i = 0; i <= 10; i++) {
    const b = h('button', { class: 'rate' + (value === i ? ' selected' : ''), 'aria-pressed': String(value === i), onclick: () => {
      grid.querySelectorAll('.rate').forEach((x) => { x.classList.remove('selected'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('selected'); b.setAttribute('aria-pressed', 'true'); onPick(i);
    } }, String(i));
    grid.append(b);
  }
  return h('div', { class: 'block' }, h('p', { class: 'lead' }, label), grid,
    h('p', { class: 'muted small' }, '0 — спокійно, 10 — дуже сильно'));
}

const fmt = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

function timerBlock(b) {
  let left = b.seconds; let paused = false;
  const clock = h('p', { class: 'clock', 'aria-live': 'off' }, fmt(left));
  const toggle = h('button', { class: 'btn', onclick: () => { paused = !paused; toggle.textContent = paused ? 'Продовжити' : 'Пауза'; } }, 'Пауза');
  const t = setInterval(() => {
    if (paused || left <= 0) return;
    left -= 1; clock.textContent = fmt(left);
    if (left === 0) { clock.textContent = 'Час вийшов'; toggle.remove(); }
  }, 1000);
  cleanups.push(() => clearInterval(t));
  return h('div', { class: 'block' }, h('p', { class: 'lead' }, b.text || ''), clock, toggle);
}

function breathBlock(b) {
  const circle = h('div', { class: 'breath-circle' });
  const label = h('p', { class: 'breath-label', 'aria-live': 'polite' }, 'Готуйся…');
  const phrase = h('p', { class: 'breath-phrase' });
  const count = h('p', { class: 'muted small' }, `0 / ${b.cycles}`);
  const phases = [['Вдих', b.inhale, 'in'], ['Затримка', b.hold, 'hold'], ['Видих', b.exhale, 'out']].filter((p) => p[1] > 0);
  let cycle = 0; let i = 0; let timer;
  const run = () => {
    if (cycle >= b.cycles) { label.textContent = 'Готово. Можна йти далі.'; phrase.textContent = ''; circle.style.transform = 'scale(.6)'; return; }
    const [name, sec, key] = phases[i];
    label.textContent = name;
    circle.style.transitionDuration = `${sec}s`;
    circle.style.transform = key === 'in' ? 'scale(1)' : key === 'out' ? 'scale(.6)' : circle.style.transform;
    if (b.phrases) {
      const p = b.phrases[Math.floor(cycle / 4) % b.phrases.length];
      phrase.textContent = key === 'in' ? p.in : key === 'out' ? p.out : phrase.textContent;
    }
    timer = setTimeout(() => {
      i = (i + 1) % phases.length;
      if (i === 0) { cycle += 1; count.textContent = `${cycle} / ${b.cycles}`; }
      run();
    }, sec * 1000);
  };
  timer = setTimeout(run, 800);
  cleanups.push(() => clearTimeout(timer));
  return h('div', { class: 'block center' }, h('div', { class: 'breath-wrap' }, circle), label, phrase, count);
}

function audioBlock(b) {
  const audio = h('audio', { preload: 'auto' });
  const err = h('p', { class: 'error', role: 'status' });
  let blobUrl = null; let disposed = false; let wantPlay = false;
  const btn = h('button', { class: 'btn primary' }, 'Слухати');
  const fetchAudio = () => fetch(b.src)
    .then((r) => { if (!r.ok) throw new Error('audio'); return r.blob(); })
    .then((blob) => {
      if (disposed) return;
      blobUrl = URL.createObjectURL(blob);
      audio.src = blobUrl;
      btn.disabled = false; btn.textContent = 'Слухати';
      if (wantPlay) { wantPlay = false; tryPlay(true); }
    })
    .catch(() => {
      if (disposed) return;
      btn.disabled = false; btn.textContent = 'Спробувати ще раз';
      err.textContent = 'Аудіофайл недоступний. Відкрий додаток з інтернетом, щоб він завантажився.';
    });
  const tryPlay = (afterWait) => {
    if (disposed) return;
    audio.play().then(() => { if (!disposed) btn.textContent = 'Пауза'; })
      .catch(() => { if (!disposed) { btn.textContent = 'Слухати'; err.textContent = afterWait ? 'Звук готовий — натисни «Слухати» ще раз.' : 'Не вдалося відтворити звук. Спробуй ще раз.'; } });
  };
  fetchAudio();
  btn.addEventListener('click', () => {
    err.textContent = '';
    if (!blobUrl) {
      const retry = btn.textContent === 'Спробувати ще раз';
      wantPlay = true; btn.disabled = true; btn.textContent = 'Завантаження…';
      if (retry) fetchAudio();
      return;
    }
    if (audio.paused) tryPlay(false); else { audio.pause(); btn.textContent = 'Слухати'; }
  });
  audio.addEventListener('ended', () => { btn.textContent = 'Слухати ще раз'; });
  cleanups.push(() => { disposed = true; audio.pause(); audio.removeAttribute('src'); if (blobUrl) URL.revokeObjectURL(blobUrl); });
  return h('div', { class: 'block' }, audio, btn, err);
}

function promptBlock(b, answers) {
  const field = b.multiline
    ? h('textarea', { id: `p-${b.key}`, maxlength: '4000' })
    : h('input', { id: `p-${b.key}`, maxlength: '500' });
  field.value = answers[b.key] || '';
  field.addEventListener('input', () => { answers[b.key] = field.value; });
  return h('div', { class: 'block' }, h('label', { for: `p-${b.key}`, class: 'lead' }, b.label), field,
    h('p', { class: 'muted small' }, 'Можна писати коротко або залишити порожнім. Записи бачиш тільки ти.'));
}

/**
 * opts: { step?: number, record?: boolean (default true), onDone(result), onExit() }
 */
export function renderExercise(ctx, id, opts = {}) {
  const ex = ctx.exercise(id);
  const values = {}; const answers = {};
  let idx = 0; let finished = false;
  const finish = () => {
    if (finished) return; finished = true;
    cleanup();
    const result = { id, step: opts.step, before: values.before, after: values.after, answers };
    if (opts.record !== false) ctx.store.update((s) => recordExercise(s, ctx.content, ctx.today(), result));
    opts.onDone ? opts.onDone(result) : ctx.go('home', { shrink: true });
  };
  const show = () => {
    cleanup();
    const b = ex.blocks[idx];
    let body;
    if (b.type === 'text') body = h('div', { class: 'block' }, h('p', { class: 'lead' }, b.text));
    else if (b.type === 'rating') body = ratingBlock(b.label, values[b.key], (v) => { values[b.key] = v; });
    else if (b.type === 'prompt') body = promptBlock(b, answers);
    else if (b.type === 'timer') body = timerBlock(b);
    else if (b.type === 'breath') body = breathBlock(b);
    else if (b.type === 'audio') body = audioBlock(b);
    const last = idx === ex.blocks.length - 1;
    mount(screen(ex.title, () => { cleanup(); (opts.onExit || (() => ctx.go('home')))(); },
      h('p', { class: 'muted small' }, `${idx + 1} / ${ex.blocks.length} · ~${ex.minutes} хв`),
      h('div', { class: 'progressbar' }, h('span', { style: `width:${Math.round(((idx + 1) / ex.blocks.length) * 100)}%` })),
      body,
      h('div', { class: 'actions' },
        idx > 0 ? h('button', { class: 'btn ghost', onclick: () => { idx -= 1; show(); } }, 'Назад') : null,
        h('button', { class: 'btn primary', onclick: () => { if (last) finish(); else { idx += 1; show(); } } }, last ? 'Готово' : 'Далі'))));
  };
  show();
}

export function renderExerciseScreen(ctx, { id }) {
  renderExercise(ctx, id, { onDone: () => ctx.go('home', { shrink: true }) });
}

export function renderStep(ctx, { n }) {
  const info = ctx.content.steps.find((s) => s.n === n);
  const progress = stepProgress(ctx.store.get(), ctx.content, n, ctx.today());
  mount(screen(`Крок ${n}. ${info.title}`, () => ctx.go('home'),
    h('p', { class: 'lead' }, info.intro),
    h('p', { class: 'muted small' }, 'Можна робити по одній вправі з перервами. Крок зарахується, коли всі вправи зроблено сьогодні.'),
    h('div', { class: 'list' }, info.exercises.map((id) => {
      const e = ctx.exercise(id); const done = progress.done.includes(id);
      return h('button', { class: 'row' + (done ? ' done' : ''), onclick: () => renderExercise(ctx, id, {
        step: n,
        onDone: () => (ctx.store.get().steps[n] ? ctx.go('home', { shrink: true }) : renderStep(ctx, { n })),
        onExit: () => renderStep(ctx, { n }),
      }) }, h('span', {}, (done ? '✓ ' : '') + e.title), h('span', { class: 'muted small' }, `${e.minutes} хв`));
    }))));
}
