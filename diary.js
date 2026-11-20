import { h, mount, screen } from './dom.js';
import { ratingBlock } from './exercise.js';
import { nav } from './home.js';

const field = (id, label, multiline = true) => {
  const el = multiline ? h('textarea', { id, maxlength: '4000' }) : h('input', { id, maxlength: '500' });
  return [h('label', { for: id, class: 'lead' }, label), el];
};

export function renderDiary(ctx) {
  const [l1, situation] = field('d-situation', 'Ситуація');
  const [l2, thought] = field('d-thought', 'Думка');
  const [l3, answer] = field('d-answer', 'Що я кажу гремліну');
  let intensity;
  const error = h('p', { class: 'error', role: 'alert' });
  [situation, thought].forEach((f) => f.addEventListener('input', () => { error.textContent = ''; }));
  const save = () => {
    if (!situation.value.trim() && !thought.value.trim()) { error.textContent = 'Запиши хоча б ситуацію або думку'; situation.focus(); return; }
    const today = ctx.today();
    ctx.store.update((s) => {
      s.diary.push({ at: new Date().toISOString(), date: today, situation: situation.value, thought: thought.value, intensity, answer: answer.value });
      const entry = { date: today, at: new Date().toISOString(), kind: 'diary', id: 'diary' };
      if (typeof intensity === 'number') entry.intensity = intensity;
      s.log.push(entry);
    });
    renderDiary(ctx);
  };
  const entries = [...ctx.store.get().diary].reverse();
  mount(screen('Щоденник думок', () => ctx.go('home'),
    h('p', { class: 'muted small' }, 'Коли гремлін розшумівся — запиши. Це бачиш тільки ти.'),
    h('section', { class: 'card' },
      l1, situation, l2, thought,
      ratingBlock('Наскільки сильно крутить?', undefined, (v) => { intensity = v; }),
      l3, answer, error,
      h('button', { class: 'btn primary', onclick: save }, 'Зберегти запис')),
    entries.length ? h('h2', {}, 'Записи') : null,
    h('div', { class: 'list' }, entries.map((e) => h('article', { class: 'card entry' },
      h('p', { class: 'muted small' }, new Date(e.at).toLocaleString('uk-UA', { dateStyle: 'medium', timeStyle: 'short' }) + (typeof e.intensity === 'number' ? ` · сила ${e.intensity}/10` : '')),
      e.situation ? h('p', {}, e.situation) : null,
      e.thought ? h('p', { class: 'quote' }, e.thought) : null,
      e.answer ? h('p', { class: 'answer' }, '→ ' + e.answer) : null))),
    nav(ctx, 'diary')));
}
