const KEY = 'naparnyk.v1';

export function defaultState() {
  return {
    v: 1,
    createdAt: null,
    companion: null,
    rrs: { pre: { answers: {}, doneAt: null }, post: { answers: {}, doneAt: null } },
    steps: {},
    log: [],
    diary: [],
  };
}

export function todayISO(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function read(storage) {
  try {
    const raw = storage && storage.getItem(KEY);
    if (!raw) return defaultState();
    const s = JSON.parse(raw);
    if (!s || s.v !== 1) return defaultState();
    return { ...defaultState(), ...s };
  } catch {
    return defaultState();
  }
}

export function createStore(storage = globalThis.localStorage) {
  let state = read(storage);
  let ok = !!storage;
  try { storage.setItem(KEY + '.probe', '1'); storage.removeItem(KEY + '.probe'); } catch { ok = false; }
  const store = {
    persistent: ok,
    get: () => state,
    update(fn) {
      fn(state);
      store._write();
      return state;
    },
    exportJSON: () => JSON.stringify(state, null, 2),
    reset() {
      state = defaultState();
      try { storage && storage.removeItem(KEY); } catch { store.persistent = false; }
    },
    _write() {
      if (!storage) { store.persistent = false; return; }
      try { storage.setItem(KEY, JSON.stringify(state)); } catch { store.persistent = false; }
    },
  };
  return store;
}
