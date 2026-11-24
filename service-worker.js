/* Funcionamento offline – Escala Auxiliares da Porta
   A CADA ATUALIZAÇÃO PUBLICADA, aumente o número abaixo (v9 → v10 → v11 ...).
   É isso que faz celulares e PCs baixarem a versão nova. */
const CACHE = 'escala-porta-v9';
const ARQUIVOS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// instala buscando os arquivos direto do servidor (ignora o cache do navegador)
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ARQUIVOS.map(u => new Request(u, { cache: 'reload' }))))
  );
  self.skipWaiting();
});

// remove caches de versões anteriores (inclusive do app antigo)
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// rede primeiro, sem cache do navegador (sempre pega o último deploy);
// sem internet, usa a cópia guardada
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const mesmoSite = url.origin === location.origin;
  const busca = mesmoSite ? fetch(e.request.url, { cache: 'no-store' }) : fetch(e.request);
  e.respondWith(
    busca.then(r => {
      if (r.ok && mesmoSite) {
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
