const CACHE_NAME = 'renga-race-v1';
const ASSETS_TO_CACHE = [
    '/race-app.html',
    'https://cdn.jsdelivr.net/npm/sweetalert2@11',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@400;900&display=swap'
];

// Instala il Service Worker e cachea le basi
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            // Usiamo un approccio individuale invece di addAll() per evitare blocchi totali in caso di 404 su un singolo file (es. /race in dev)
            return Promise.allSettled(
                ASSETS_TO_CACHE.map(url =>
                    cache.add(url).catch(err => console.warn(`[SW] Skip cache for: ${url}`, err))
                )
            );
        })
    );
    self.skipWaiting();
});

// Attivazione e pulizia vecchie cache
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
});

// Strategia: Network First, Fallback to Cache
self.addEventListener('fetch', event => {
    // Ignora le richieste verso Supabase (devono passare dal Sync Engine)
    if (event.request.url.includes('supabase.co')) return;

    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
