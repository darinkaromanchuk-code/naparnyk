export function stepProgress(state, content, n, today) {
  const step = content.steps.find((s) => s.n === n);
  const doneIds = new Set(state.log.filter((e) => e.step === n).map((e) => e.id));
  const done = step.exercises.filter((id) => doneIds.has(id));
  return { done, complete: done.length === step.exercises.length };
}

export function recordExercise(state, content, today, { id, kind = 'exercise', step, before, after, answers }) {
  const entry = { date: today, at: new Date().toISOString(), kind, id };
  if (step) entry.step = step;
  if (typeof before === 'number') entry.before = before;
  if (typeof after === 'number') entry.after = after;
  if (answers && Object.keys(answers).length) entry.answers = answers;
  state.log.push(entry);
  if (step && !state.steps[step] && stepProgress(state, content, step, today).complete) state.steps[step] = today;
  return entry;
}
