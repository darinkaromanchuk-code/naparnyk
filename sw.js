const CACHE = 'naparnyk-b8c72a7756';
const PRECACHE = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "js/app.js",
  "js/ui/art.js",
  "js/ui/diary.js",
  "js/ui/dom.js",
  "js/ui/exercise.js",
  "js/ui/home.js",
  "js/ui/onboarding.js",
  "js/ui/progress.js",
  "js/ui/rrs-screen.js",
  "js/ui/settings.js",
  "js/ui/sos.js",
  "js/core/dates.js",
  "js/core/game.js",
  "js/core/program.js",
  "js/core/rrs.js",
  "js/core/session.js",
  "js/core/store.js",
  "css/app.css",
  "css/art.css",
  "content/content.json",
  "content/rrs.json",
  "audio/meditation.mp3",
  "audio/music.mp3",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon.svg"
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
