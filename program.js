import { daysBetween } from './dates.js';

export const STEP_COUNT = 6;

export function programDay(state, today) {
  if (!state.createdAt) return 0;
  return daysBetween(state.createdAt, today) + 1;
}

export function nextStep(state, today) {
  let n = 1;
  while (n <= STEP_COUNT && state.steps[n]) n++;
  if (n > STEP_COUNT) return null;
  if (!state.rrs.pre.doneAt) return { n, available: false, reason: 'rrs-pre' };
  const doneDates = Object.values(state.steps).filter((d) => /^\d{4}-\d{2}-\d{2}/.test(d));
  // Done today, or "tomorrow" because the clock went back a day: wait. Further in the future = wrong clock, ignore.
  if (doneDates.some((d) => { const ahead = daysBetween(today, d); return ahead >= 0 && ahead <= 1; })) {
    return { n, available: false, reason: 'done-today' };
  }
  return { n, available: true };
}

export function retestDue(state, today) {
  return !!state.rrs.pre.doneAt && !state.rrs.post.doneAt && programDay(state, today) >= 14;
}

export function phase(state, today) {
  if (!state.companion) return 'onboarding';
  if (!state.rrs.pre.doneAt) return 'rrs-pre';
  if (state.rrs.post.doneAt) return 'free';
  return 'program';
}
