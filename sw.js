const CACHE_NAME = 'tst3d-v2';

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

    // Bypass file 3D berukuran besar agar ditangani oleh Native Disk Cache Browser
    // Menghindari error "Unexpected error" atau gagal kloning saat ukuran terlalu besar
    const url = new URL(event.request.url);
    const bypassExts = ['.glb', '.gltf', '.fbx', '.bin'];
    if (bypassExts.some(ext => url.pathname.toLowerCase().endsWith(ext))) {
        return; // Melewati event.respondWith(), browser akan memproses secara default
    }

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
                    // Masukkan ke dalam cache untuk masa depan
                    cache.put(event.request, responseToCache);
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
