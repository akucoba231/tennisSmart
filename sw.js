const CACHE_NAME = 'tst3d-v4';

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Langsung aktif tanpa menunggu tab ditutup
});

self.addEventListener('activate', (event) => {
    // Bersihkan SEMUA cache lama (agar file app.js dan data API lama terhapus total)
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[ServiceWorker] Menghapus cache lama:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Hanya proses permintaan GET
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    const pathname = url.pathname.toLowerCase();

    // DAFTAR EKSTENSI ASET 3D YANG BOLEH DI-CACHE
    const model3DExts = ['.glb', '.gltf', '.fbx', '.bin'];
    const is3DAsset = model3DExts.some(ext => pathname.endsWith(ext));

    // JIKA BUKAN MODEL 3D (misal: app.js, index.html, REST API /api/, css):
    // LEWATI TOTAL (Bypass). Browser akan selalu mengambil data segar/terbaru secara live.
    if (!is3DAsset) {
        return;
    }

    // HANYA UNTUK ASET 3D: Gunakan strategi Cache-First (Cepat, hemat kuota, cegah T-Pose)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200) {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache).catch(err => {
                        console.warn('[ServiceWorker] Gagal menyimpan model 3D ke cache:', err);
                    });
                });

                return networkResponse;
            }).catch((error) => {
                console.error('[ServiceWorker] Gagal memuat aset 3D:', error);
                throw error;
            });
        })
    );
});
