/* PDF Studio offline support.
   Network first, cache as the fallback: the app's files are not fingerprinted, so a fresh copy always wins when online.
   The build replaces __ASSETS__ and __VERSION__ so every file is cached on the first visit.
   This worker never sees a user's PDF: documents are read locally and never fetched or stored here. */
const VERSION = '__VERSION__';
const ASSETS = /* build */ [];
const CACHE = `pdfstudio-${VERSION}`;
const SCOPE = new URL(self.registration.scope).pathname.replace(/\/$/, '');

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(path => `${SCOPE}/${path}`))).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        for (const key of await caches.keys()) if (key.startsWith('pdfstudio-') && key !== CACHE) await caches.delete(key);
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== self.location.origin) return;
    if (!(url.pathname === SCOPE || url.pathname.startsWith(`${SCOPE}/`)) || url.pathname.startsWith('/api/')) return;
    event.respondWith((async () => {
        const cache = await caches.open(CACHE);
        try {
            const response = await fetch(request);
            if (response.ok) cache.put(request, response.clone());
            return response;
        } catch {
            return (await cache.match(request, { ignoreSearch: true }))
                || (request.mode === 'navigate' ? (await cache.match(`${SCOPE}/index.html`)) || (await cache.match(SCOPE || '/')) : undefined)
                || Response.error();
        }
    })());
});
