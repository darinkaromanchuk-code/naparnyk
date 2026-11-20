import { daysBetween } from './dates.js';

export const GREMLIN_IDS = ['stop-thought', 'evidence', 'gremlin', 'useful-thoughts', 'distancing', 'postpone'];

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const round2 = (x) => Math.round(x * 100) / 100;

function startLevel(state) {
  const a = state.rrs.pre.answers;
  const vals = Object.values(a).map(Number);
  if (!state.rrs.pre.doneAt || vals.length < 22) return 0.8;
  const total = vals.reduce((s, v) => s + v, 0);
  return clamp((total - 22) / 66, 0.3, 1);
}

export function gremlinLevel(state, today) {
  let level = startLevel(state);
  const ratings = state.log
    .map((e) => (typeof e.after === 'number' ? e.after : typeof e.intensity === 'number' ? e.intensity : null))
    .filter((r) => r !== null)
    .slice(-5);
  if (ratings.length) level = (level + ratings.reduce((s, r) => s + r, 0) / ratings.length / 10) / 2;
  const recentWork = state.log.filter(
    (e) => e.kind === 'exercise' && GREMLIN_IDS.includes(e.id) && daysBetween(e.date, today) >= 0 && daysBetween(e.date, today) <= 2,
  ).length;
  return round2(clamp(level - 0.08 * recentWork, 0.15, 1));
}

export function companionMood(state, today) {
  if (!state.log.length) return 'calm';
  const last = state.log.map((e) => e.date).sort().at(-1);
  const gap = daysBetween(last, today);
  if (gap <= 0) return 'joy';
  if (gap >= 3) return 'waiting';
  return 'calm';
}

export function homeLevel(state) {
  const days = new Set(state.log.map((e) => e.date)).size;
  return Math.min(6, Math.floor(days / 2));
}
