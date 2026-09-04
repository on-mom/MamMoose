// 맘무스 서비스 워커 — 오프라인 대비 (현지 인터넷 불안정 대응)
// HTML(내비게이션) = network-first: 배포 즉시 최신 반영. 해시된 정적 자산 = cache-first(불변).
// 그 외 same-origin = stale-while-revalidate. 외부 도메인은 건드리지 않음.
const CACHE = 'mammoose-v3';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/manifest.webmanifest', '/moose-face.png', '/moose-full.png'])).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isNav = req.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html');
  const isHashedAsset = /\/assets\/.+\.[0-9a-f]{8,}\.(js|css|woff2?|png|jpg|svg)$/i.test(url.pathname);

  if (isNav) {
    // network-first — 새 배포를 바로 받음
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) caches.open(CACHE).then((c) => c.put('/', res.clone()));
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('/'))),
    );
    return;
  }

  if (isHashedAsset) {
    // cache-first — 해시가 바뀌면 자동으로 새 파일
    e.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        if (res && res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
        return res;
      })),
    );
    return;
  }

  // 기타 — stale-while-revalidate
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(() => cached || caches.match('/'));
      return cached || network;
    }),
  );
});

// ---------- "지금 저장" — 앱 셸을 캐시에 강제로 채움 ----------
self.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.type !== 'precache' || !Array.isArray(d.urls)) return;
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.all(
      d.urls.map((u) => fetch(u, { cache: 'reload' })
        .then((r) => (r && r.ok ? c.put(u, r.clone()) : null))
        .catch(() => {})),
    )).then(() => {
      if (e.source) e.source.postMessage({ type: 'precache-done' });
    }),
  );
});

// ---------- 웹 푸시 (배포 후 발송 인프라 연동 시 동작) ----------
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(
    self.registration.showNotification(d.title || '맘무스', {
      body: d.body || '',
      icon: '/moose-face.png',
      badge: '/moose-face.png',
      data: { url: d.url || '/' },
      tag: d.tag,
    }),
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
      for (const c of cs) if ('focus' in c) return c.focus();
      return self.clients.openWindow(target);
    }),
  );
});
