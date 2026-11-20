export function firstUnanswered(answers, rrs) {
  const gap = rrs.items.find((it) => !answers[it.n]);
  return gap ? gap.n : null;
}

export function scoreRRS(answers, rrs) {
  const complete = firstUnanswered(answers, rrs) === null;
  const scales = {};
  for (const sc of rrs.scales) {
    scales[sc.short] = complete
      ? rrs.items.filter((it) => it.scales.includes(sc.short)).reduce((sum, it) => sum + Number(answers[it.n]), 0)
      : null;
  }
  return { complete, total: scales.RRS ?? null, scales };
}
