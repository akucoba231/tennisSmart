// Viewer3D.js
class Viewer3D {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x2C3E50);

        this.camera = new THREE.PerspectiveCamera(45, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 100);
        this.camera.position.set(0, 1.5, 3.5);

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // ==========================================
        // REVISI: PERBAIKAN WARNA AGAR TIDAK GELAP
        // ==========================================
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        // ==========================================

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.target.set(0, 1.5, 0);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7);
        this.scene.add(directionalLight);

        // ==========================================
        // DEBUGGING HELPER: GARIS BANTU
        // ==========================================
        // GridHelper (Lantai kotak-kotak) - DIAKTIFKAN KEMBALI SEBAGAI REFERENSI
        const gridHelper = new THREE.GridHelper(10, 10, 0xffffff, 0x555555);
        this.scene.add(gridHelper);
        
        // AxesHelper (Garis X=Merah, Y=Hijau, Z=Biru) untuk melihat titik pusat (0,0,0)
        // const axesHelper = new THREE.AxesHelper(3);
        // this.scene.add(axesHelper);
        // ==========================================

        this.mixer = null;
        this.clock = new THREE.Clock();
        this.animationAction = null;
        this.isPlaying = true;
        this.animationId = null;

        this.animate = this.animate.bind(this);
    }

    loadModel(modelUrl) {
        console.log(`[DEBUG-3D] Memulai proses muat file: ${modelUrl}`);
        
        // ==========================================
        // KONFIGURASI DRACO LOADER
        // ==========================================
        const dracoLoader = new THREE.DRACOLoader();
        // Draco butuh file 'decoder' (WebAssembly) untuk membaca kompresi. 
        // File decoder telah diunduh ke folder lokal agar bisa berjalan secara offline.
        dracoLoader.setDecoderPath('assets/draco/');

        const loader = new THREE.GLTFLoader();
        // Pasang Draco ke dalam GLTF Loader
        loader.setDRACOLoader(dracoLoader);
        // ==========================================
        
        loader.load(
            modelUrl, 
            (gltf) => {
                console.log(`[DEBUG-3D] ✅ File berhasil dimuat!`, gltf);
                
                // === HAPUS MODEL LAMA ===
                if (this.model) {
                    this.scene.remove(this.model);
                }

                // === HENTIKAN MIXER LAMA (PERBAIKAN GLITCH / MEMORY LEAK) ===
                if (this.mixer) {
                    this.mixer.stopAllAction();
                    this.mixer.uncacheRoot(this.mixer.getRoot());
                    this.mixer = null;
                    this.animationAction = null;
                }

                this.model = gltf.scene;

                // Pastikan matriks diperbarui sebelum kalkulasi
                this.model.updateMatrixWorld(true);

                // ==========================================
                // 1. AUTO-SCALE (Sesuaikan Ukuran)
                // ==========================================
                var box = new THREE.Box3().setFromObject(this.model);
                var size = box.getSize(new THREE.Vector3());
                
                var maxDim = Math.max(size.x, size.y, size.z);
                var targetSize = 15.0;  // <--- DIBESARKAN KE 15.0 AGAR LAPANGAN & AKTOR LEBIH BESAR
                if (maxDim > 0) {
                    var scaleFactor = targetSize / maxDim;
                    this.model.scale.set(scaleFactor, scaleFactor, scaleFactor);
                }

                // PENTING: Update matriks lagi setelah ukuran (scale) diubah
                this.model.updateMatrixWorld(true);

                // ==========================================
                // 2. AUTO-CENTER & MENAPAK LANTAI
                // ==========================================
                // Hitung ulang kotak pembungkus dengan ukuran yang baru
                box = new THREE.Box3().setFromObject(this.model);
                var center = box.getCenter(new THREE.Vector3());

                // Tengahkan posisi (X=Kiri/Kanan, Z=Depan/Belakang)
                this.model.position.x -= center.x;
                this.model.position.z -= center.z;

                // Terapkan penyesuaian Tinggi (Y) agar tidak melayang
                var heightOffset = -box.min.y;
                this.model.position.y += heightOffset;
                
                // ---> KOREKSI MANUAL DIHAPUS KARENA MEMBUAT AMBLAS <---
                // this.model.position.y -= 1.5; 

                // Tambahkan model ke dalam scene
                this.scene.add(this.model);
                this.model.updateMatrixWorld(true);

                // ==========================================
                // FITUR BARU: FOKUS OTOMATIS KE AKTOR
                // ==========================================
                let actorHips = null;
                this.model.traverse((node) => {
                    if (node.isBone && (node.name === "mixamorig_Hips" || node.name === "mixamorig9_Hips" || node.name.includes("Hips"))) {
                        actorHips = node;
                    }
                });

                if (actorHips) {
                    let hipsPos = new THREE.Vector3();
                    actorHips.getWorldPosition(hipsPos);
                    
                    // Fokuskan target tepat ke pinggul/badan aktor
                    this.controls.target.copy(hipsPos);
                    console.log("[DEBUG-3D] Kamera berhasil dikunci ke posisi aktor:", hipsPos);
                } else {
                    // Fallback jika tidak ada aktor (fokus ke tengah lapangan)
                    this.controls.target.set(0, 1.5, 0);
                }

                // === TERAPKAN SETTINGAN KAMERA TERBAIK ===
                // Tinggi: 1.6, Sudut: 0 (Lurus Depan), Zoom Jarak: 5
                this.aturKamera(1.6, 0, 5);

                // ==========================================
                // 3. PLAY ANIMATION
                // ==========================================
                if (gltf.animations && gltf.animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(this.model);
                    
                    var action = this.mixer.clipAction(gltf.animations[0]);
                    action.play();
                    
                    // Simpan ke variabel global class agar tombol slow/play bisa mengaksesnya
                    this.animationAction = action; 

                    console.log("Animation playing:", gltf.animations[0].name);
                } else {
                    console.warn("Model ini tidak memiliki animasi.");
                }

                // Mulai render loop
                this.start();
            }, 
            undefined, // Callback progress (bisa diabaikan)
            (error) => {
                console.error('[DEBUG-3D] ❌ TERJADI KESALAHAN SAAT MEMUAT MODEL:', error);
            }
        );
    }

    animate() {
        this.animationId = requestAnimationFrame(this.animate);
        const delta = this.clock.getDelta();

        if (this.mixer && this.isPlaying) {
            this.mixer.update(delta);
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    start() {
        if (!this.animationId) this.animate();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        return this.isPlaying;
    }

    setSlowMotion(isSlow) {
        if (this.animationAction) {
            this.animationAction.timeScale = isSlow ? 0.3 : 1.0;
        }
    }

    resetCamera() {
        if (this.defaultCameraPos && this.defaultTargetPos) {
            this.camera.position.copy(this.defaultCameraPos);
            this.controls.target.copy(this.defaultTargetPos);
        } else {
            this.camera.position.set(0, 1.5, 3.5);
            this.controls.target.set(0, 1.5, 0);
        }
        this.controls.update();
    }

    resize() {
        const wrapper = this.canvas.parentElement;
        this.camera.aspect = wrapper.clientWidth / wrapper.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(wrapper.clientWidth, wrapper.clientHeight);
    }

    // ==========================================
    // HELPER UNTUK DEBUGGING KAMERA & POSISI VIA CONSOLE
    // ==========================================
    
    // 1. Mengatur Ketinggian Kamera (Y)
    setKetinggianKamera(nilaiY) {
        this.camera.position.y = nilaiY;
        this.controls.update();
        console.log(`[DEBUG] Ketinggian kamera diset ke: ${nilaiY}`);
    }

    // 2. Mengatur Sudut Kamera (Menggeser rotasi memutari aktor)
    // sudutDerajat: 0 = depan lurus, 90 = kanan, -90 = kiri, 180 = belakang
    setSudutKamera(sudutDerajat) {
        // Hitung jarak datar (X dan Z) saat ini
        const dx = this.camera.position.x - this.controls.target.x;
        const dz = this.camera.position.z - this.controls.target.z;
        const jarakDatar = Math.sqrt(dx * dx + dz * dz);
        
        // Konversi derajat ke radian
        const radian = sudutDerajat * (Math.PI / 180);
        
        this.camera.position.x = this.controls.target.x + (jarakDatar * Math.sin(radian));
        this.camera.position.z = this.controls.target.z + (jarakDatar * Math.cos(radian));
        
        this.controls.update();
        console.log(`[DEBUG] Sudut kamera diset ke: ${sudutDerajat} derajat (Kanan/Kiri)`);
    }

    // 3. Mengatur Zoom (Jarak dari target)
    setZoomKamera(jarakZoom) {
        // Geser posisi Z agar mendekat/menjauh
        this.camera.position.z = this.controls.target.z + jarakZoom;
        this.controls.update();
        console.log(`[DEBUG] Zoom kamera diset ke jarak: ${jarakZoom}`);
    }

    // 4. Fungsi gabungan untuk mengatur ketiganya sekaligus dan menyimpannya sebagai Reset
    aturKamera(tinggiY, sudutDerajat, jarakZoom) {
        this.setZoomKamera(jarakZoom);
        this.setKetinggianKamera(tinggiY);
        this.setSudutKamera(sudutDerajat);
        
        // Simpan sebagai default baru agar tombol Reset menggunakan eksperimen ini
        this.defaultCameraPos = this.camera.position.clone();
        this.defaultTargetPos = this.controls.target.clone();
        
        console.log(`[DEBUG] ✅ Pengaturan kamera berhasil diterapkan dan disimpan sebagai Default (Reset)!`);
    }

    // (Fungsi lawas untuk mengatur posisi Model)
    setY(nilaiY) {
        if (this.model) {
            this.model.position.y = nilaiY;
            console.log(`[DEBUG] Posisi Y model sekarang diset ke: ${this.model.position.y}`);
        }
    }
    
    geserY(nilaiOffset) {
        if (this.model) {
            this.model.position.y += nilaiOffset;
            console.log(`[DEBUG] Posisi Y digeser. Nilai Y sekarang: ${this.model.position.y}`);
        }
    }
    
    cekPosisi() {
        if (this.model) {
            console.log(`[DEBUG] Koordinat Model -> X: ${this.model.position.x}, Y: ${this.model.position.y}, Z: ${this.model.position.z}`);
            console.log(`[DEBUG] Koordinat Kamera -> X: ${this.camera.position.x.toFixed(2)}, Y: ${this.camera.position.y.toFixed(2)}, Z: ${this.camera.position.z.toFixed(2)}`);
        }
    }
}
