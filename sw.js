const CACHE = 'naparnyk-flat-95a14d497b';
const PRECACHE = [
  "./",
  "app.css",
  "app.js",
  "art.css",
  "art.js",
  "content.json",
  "dates.js",
  "diary.js",
  "dom.js",
  "exercise.js",
  "game.js",
  "home.js",
  "icon-192.png",
  "icon-512.png",
  "icon.svg",
  "index.html",
  "manifest.webmanifest",
  "meditation.mp3",
  "music.mp3",
  "onboarding.js",
  "program.js",
  "progress.js",
  "rrs-screen.js",
  "rrs.js",
  "rrs.json",
  "session.js",
  "settings.js",
  "sos.js",
  "store.js"
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('naparnyk-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = url.pathname.endsWith('/') ? './' : url.pathname.slice(new URL(self.registration.scope).pathname.length);
    const hit = await cache.match(key, { ignoreSearch: true }) || await cache.match(e.request, { ignoreSearch: true });
    if (hit && e.request.headers.get('range')) {
      const buf = await hit.arrayBuffer();
      const [, s, en] = /bytes=(\d+)-(\d*)/.exec(e.request.headers.get('range')) || [];
      const start = Number(s || 0); const end = en ? Number(en) : buf.byteLength - 1;
      return new Response(buf.slice(start, end + 1), { status: 206, headers: {
        'Content-Type': hit.headers.get('Content-Type') || 'audio/mpeg',
        'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`, 'Accept-Ranges': 'bytes' } });
    }
    return hit || fetch(e.request);
  })());
});
