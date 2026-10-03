const CACHE_NAME = 'baller-grid-v6';
const APP_SHELL = ['./', './manifest.webmanifest', './assets/icons/football.svg', './index.html'];

async function getCachedFallback(request) {
  const fallbackCandidates = [request, './index.html', '/index.html'];
  for (const candidate of fallbackCandidates) {
    const cached = await caches.match(candidate);
    if (cached) return cached;
  }
  return null;
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  const appShellRequest = event.request.mode === 'navigate'
    || ['document', 'script', 'style'].includes(event.request.destination);

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (!appShellRequest && cached) return cached;

    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const copy = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }
      if (cached) return cached;
      if (event.request.mode === 'navigate') {
        return (await getCachedFallback(event.request)) ?? Response.error();
      }
      return Response.error();
    } catch (error) {
      if (cached) return cached;
      if (event.request.mode === 'navigate') {
        return (await getCachedFallback(event.request)) ?? Response.error();
      }
      throw error;
    }
  })());
});
