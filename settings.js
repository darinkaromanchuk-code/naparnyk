import { h, mount, screen } from './dom.js';
import { nav } from './home.js';

function helpItem(item, primary) {
  return h('section', { class: 'card' },
    h('h2', {}, item.name),
    item.hours ? h('p', { class: 'muted small' }, item.hours) : null,
    (item.phones || []).map((p, i) => h('a', { class: 'btn call' + (primary && i === 0 ? ' primary' : ''), href: `tel:${p.tel}` }, `Подзвонити ${p.display}`)),
    item.links && item.links.length ? h('p', { class: 'links' }, item.links.map((l) => h('a', { href: l.url, target: '_blank', rel: 'noopener' }, l.label))) : null,
    item.note ? h('p', { class: 'small' }, item.note) : null);
}

export function renderHelp(ctx) {
  const [first, ...rest] = ctx.content.help.groups;
  mount(screen('Допомога', () => ctx.restart(),
    h('p', { class: 'lead' }, 'Ти не мусиш справлятися сам. Поговори з тим, кому довіряєш, або подзвони — номер можна набрати й вручну.'),
    h('h2', {}, first.title),
    h('div', { class: 'list' }, first.items.map((i) => helpItem(i, true))),
    rest.map((g) => h('details', { class: 'help-group' },
      h('summary', {}, g.title),
      h('div', { class: 'list' }, g.items.map((i) => helpItem(i, false))))),
    h('p', { class: 'muted small' }, `Джерело: ${ctx.content.help.source}.`),
    h('p', { class: 'muted small' }, ctx.content.disclaimer)));
}

export function renderSettings(ctx) {
  const s = ctx.store.get();
  const nameInput = h('input', { id: 's-name', maxlength: '24', value: s.companion?.name || '' });
  const msg = h('p', { class: 'muted small', role: 'status' });
  const saveName = () => {
    const v = nameInput.value.trim();
    if (!v) { msg.textContent = "Ім'я не може бути порожнім"; return; }
    ctx.store.update((x) => { x.companion.name = v; });
    msg.textContent = 'Збережено';
  };
  const exportData = () => {
    const blob = new Blob([ctx.store.exportJSON()], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: `naparnyk-дані-${ctx.today()}.json` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const copyMsg = h('p', { class: 'muted small', role: 'status' });
  const copyData = async () => {
    try { await navigator.clipboard.writeText(ctx.store.exportJSON()); copyMsg.textContent = 'Скопійовано. Встав у нотатки чи повідомлення собі.'; }
    catch { copyMsg.textContent = 'Не вдалося скопіювати на цьому пристрої.'; }
  };
  const confirmBox = h('div', { class: 'confirm', hidden: true },
    h('p', {}, 'Видалити всі дані: напарника, відповіді, щоденник і прогрес? Це не можна скасувати.'),
    h('button', { class: 'btn danger', onclick: () => { ctx.store.reset(); ctx.go('onboarding'); } }, 'Так, видалити все'),
    h('button', { class: 'btn ghost', onclick: () => { confirmBox.hidden = true; } }, 'Скасувати'));
  const wipe = () => { confirmBox.hidden = false; };
  mount(screen('Налаштування', () => ctx.go('home'),
    ctx.banner(),
    h('section', { class: 'card' },
      h('label', { for: 's-name', class: 'lead' }, "Ім'я напарника"), nameInput,
      h('button', { class: 'btn', onclick: saveName }, "Зберегти ім'я"), msg),
    h('section', { class: 'card' },
      h('h2', {}, 'Мої дані'),
      h('p', { class: 'muted small' }, 'Усе зберігається тільки на цьому пристрої. Якщо видалити дані браузера або сам додаток — записи зникнуть. Експорт дає файл, який можна зберегти собі.'),
      h('button', { class: 'btn', onclick: exportData }, 'Експортувати мої дані'),
      h('button', { class: 'btn', onclick: copyData }, 'Копіювати дані'), copyMsg,
      h('button', { class: 'btn danger', onclick: wipe }, 'Видалити все'), confirmBox),
    h('section', { class: 'card' },
      h('h2', {}, 'Про методику'),
      h('p', {}, ctx.content.about.text),
      h('p', { class: 'muted small' }, ctx.content.about.credit),
      h('p', { class: 'muted small' }, ctx.content.disclaimer)),
    h('button', { class: 'btn', onclick: () => ctx.go('help') }, 'Контакти допомоги'),
    nav(ctx, 'settings')));
}
