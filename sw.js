const CACHE_NAME = 'tst3d-v3';

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Langsung aktif tanpa menunggu tab ditutup
});

self.addEventListener('activate', (event) => {
    // Bersihkan cache lama jika versi berubah
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Hanya proses permintaan GET (jangan cache POST API)
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // 1. Jika ada di cache (memori lokal), langsung berikan! (Instan)
            if (cachedResponse) {
                return cachedResponse;
            }

            // 2. Jika tidak ada di cache, minta dari internet (atau lokal folder)
            return fetch(event.request).then((networkResponse) => {
                // Pastikan responsnya valid
                if (!networkResponse || networkResponse.status !== 200) {
                    return networkResponse;
                }

                // Clone respons untuk disimpan ke cache (karena stream hanya bisa dibaca 1x)
                const responseToCache = networkResponse.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    // Masukkan ke dalam cache untuk masa depan (tangkap error jika file terlalu besar/kuota habis)
                    cache.put(event.request, responseToCache).catch(err => {
                        console.warn('[ServiceWorker] Gagal menyimpan ke cache (mungkin ukuran file terlalu besar):', err);
                    });
                });

                return networkResponse;
            }).catch((error) => {
                // Gagal fetch (misal: offline dan tidak ada di cache)
                console.error('[ServiceWorker] Fetch failed:', error);
                throw error;
            });
        })
    );
});
