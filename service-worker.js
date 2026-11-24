/* Funcionamento offline – Escala Auxiliares da Porta
   Troque o número da versão a cada atualização publicada. */
const CACHE = 'escala-porta-v8';
const ARQUIVOS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// instala e guarda os arquivos do app
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)));
  self.skipWaiting();
});

// remove caches antigos (inclusive do app anterior)
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// rede primeiro (pega atualizações); sem internet, usa o cache
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok && new URL(e.request.url).origin === location.origin) {
        const cp = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, cp));
      }
      return r;
    }).catch(() =>
      caches.match(e.request, { ignoreSearch: true })
        .then(r => r || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined))
    )
  );
});
