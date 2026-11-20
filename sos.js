import { h, mount, screen } from './dom.js';
import { ratingBlock, renderExercise } from './exercise.js';
import { recordExercise } from '../core/session.js';

export function renderSOS(ctx) {
  let before;
  mount(screen('Мене накрило зараз', () => ctx.go('home'),
    ratingBlock('Наскільки сильно зараз крутять думки?', undefined, (v) => { before = v; }),
    h('button', { class: 'btn primary', onclick: () => choose(ctx, before) }, 'Далі'),
    h('button', { class: 'btn ghost', onclick: () => ctx.go('help') }, 'Мені дуже погано — контакти допомоги')));
}

function choose(ctx, before) {
  mount(screen('Обери одну вправу', () => renderSOS(ctx),
    h('p', { class: 'muted' }, 'Коротко, 2–3 хвилини. Твій напарник поруч.'),
    h('div', { class: 'list' }, ctx.content.sos.exercises.map((id) => {
      const e = ctx.exercise(id);
      return h('button', { class: 'row', onclick: () => renderExercise(ctx, id, {
        record: false,
        onDone: () => after(ctx, id, before),
        onExit: () => choose(ctx, before),
      }) }, h('span', {}, e.title), h('span', { class: 'muted small' }, `${e.minutes} хв`));
    }))));
}

function after(ctx, id, before) {
  let value; let saved = false;
  const save = () => {
    if (saved) return; saved = true;
    ctx.store.update((s) => recordExercise(s, ctx.content, ctx.today(), { kind: 'sos', id, before, after: value }));
    ctx.go('home', { shrink: true });
  };
  mount(screen('Як тепер?', null,
    ratingBlock('Наскільки сильно крутять думки зараз?', undefined, (v) => { value = v; }),
    h('p', { class: 'muted small' }, 'Якщо не полегшало — можна зробити ще одну вправу або зателефонувати по допомогу.'),
    h('button', { class: 'btn primary', onclick: save }, 'Зберегти'),
    h('button', { class: 'btn', onclick: () => choose(ctx, before) }, 'Ще одна вправа'),
    h('button', { class: 'btn ghost', onclick: () => ctx.go('help') }, 'Контакти допомоги')));
}
