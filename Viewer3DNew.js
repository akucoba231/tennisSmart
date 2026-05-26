// Viewer3D.js
class Viewer3D {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x2C3E50);

        this.camera = new THREE.PerspectiveCamera(45, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 100);
        this.camera.position.set(0, 2, 5);

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
        this.controls.target.set(0, 1, 0);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7);
        this.scene.add(directionalLight);

        // ==========================================
        // DEBUGGING HELPER: GARIS BANTU
        // ==========================================
        // GridHelper (Lantai kotak-kotak) - DIKOMENTARI AGAR HILANG
        // const gridHelper = new THREE.GridHelper(10, 10, 0xffffff, 0x555555);
        // this.scene.add(gridHelper);
        
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
        // Kita gunakan CDN dari jsdelivr agar Anda tidak perlu repot mendownload file decoder-nya.
        dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');

        const loader = new THREE.GLTFLoader();
        // Pasang Draco ke dalam GLTF Loader
        loader.setDRACOLoader(dracoLoader);
        // ==========================================
        
        loader.load(
            modelUrl, 
            (gltf) => {
                console.log(`[DEBUG-3D] ✅ File berhasil dimuat!`, gltf);
                
                if(this.model) this.scene.remove(this.model);
                this.model = gltf.scene;

                // ==========================================
                // REVISI: HILANGKAN EFEK CERMIN PADA MATERIAL
                // ==========================================
                this.model.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.metalness = 0.0; // Hilangkan efek gelap memantul
                        child.material.roughness = 0.8; // Permukaan sedikit doff
                        child.material.needsUpdate = true;
                    }
                });
                // ==========================================

                // Pastikan matriks diperbarui sebelum kalkulasi
                this.model.updateMatrixWorld(true);

                // ==========================================
                // 1. AUTO-SCALE (Sesuaikan Ukuran)
                // ==========================================
                var box = new THREE.Box3().setFromObject(this.model);
                var size = box.getSize(new THREE.Vector3());
                
                var maxDim = Math.max(size.x, size.y, size.z);
                var targetSize = 10.0;  // <--- REVISI: Diubah dari 3.0 menjadi 10.0
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
                
                // ---> TAMBAHKAN KOREKSI MANUAL ANDA DI SINI <---
                this.model.position.y -= 1.5; // Geser turun 1.5 poin

                // Tambahkan model ke dalam scene
                this.scene.add(this.model);

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
        this.camera.position.set(0, 2, 5);
        this.controls.target.set(0, 1, 0);
        this.controls.update();
    }

    resize() {
        const wrapper = this.canvas.parentElement;
        this.camera.aspect = wrapper.clientWidth / wrapper.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(wrapper.clientWidth, wrapper.clientHeight);
    }

    // ==========================================
    // HELPER UNTUK DEBUGGING VIA CONSOLE
    // ==========================================
    
    // Mengatur posisi Y ke angka spesifik (misal: 0, -1.5, 2)
    setY(nilaiY) {
        if (this.model) {
            this.model.position.y = nilaiY;
            console.log(`[DEBUG] Posisi Y model sekarang diset ke: ${this.model.position.y}`);
        } else {
            console.warn("[DEBUG] Model belum dimuat!");
        }
    }

    // Menggeser posisi Y sedikit demi sedikit dari posisi saat ini (misal: naik 0.1 atau turun -0.1)
    geserY(nilaiOffset) {
        if (this.model) {
            this.model.position.y += nilaiOffset;
            console.log(`[DEBUG] Posisi Y digeser. Nilai Y sekarang: ${this.model.position.y}`);
        } else {
            console.warn("[DEBUG] Model belum dimuat!");
        }
    }
    
    // Melihat posisi Y saat ini
    cekPosisi() {
        if (this.model) {
            console.log(`[DEBUG] Koordinat Model -> X: ${this.model.position.x}, Y: ${this.model.position.y}, Z: ${this.model.position.z}`);
        }
    }
}