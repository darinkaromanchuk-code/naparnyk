export function daysBetween(fromISO, toISO) {
  const p = (s) => { const [y, m, d] = s.slice(0, 10).split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((p(toISO) - p(fromISO)) / 86400000);
}
