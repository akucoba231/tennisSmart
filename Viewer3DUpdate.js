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
        const gridHelper = new THREE.GridHelper(10, 10, 0xffffff, 0x555555);
        this.scene.add(gridHelper);

        this.mixer = null;
        this.clock = new THREE.Clock();
        this.animationAction = null;
        this.isPlaying = true;
        this.animationId = null;

        // Properti baru untuk manajemen antrean animasi
        this.animations = [];
        this.currentAnimationIndex = 0;
        this.currentSpeed = 1.0; 

        this.animate = this.animate.bind(this);
    }

    /*loadModel(modelUrl) {
        console.log(`[DEBUG-3D] Memulai proses muat file: ${modelUrl}`);
        
        const dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');

        const loader = new THREE.GLTFLoader();
        loader.setDRACOLoader(dracoLoader);
        
        loader.load(
            modelUrl, 
            (gltf) => {
                console.log(`[DEBUG-3D] ✅ File berhasil dimuat!`, gltf);
                
                if(this.model) this.scene.remove(this.model);
                this.model = gltf.scene;

                this.model.updateMatrixWorld(true);

                // 1. AUTO-SCALE
                var box = new THREE.Box3().setFromObject(this.model);
                var size = box.getSize(new THREE.Vector3());
                
                var maxDim = Math.max(size.x, size.y, size.z);
                var targetSize = 3.0; 
                if (maxDim > 0) {
                    var scaleFactor = targetSize / maxDim;
                    this.model.scale.set(scaleFactor, scaleFactor, scaleFactor);
                }

                this.model.updateMatrixWorld(true);

                // 2. AUTO-CENTER & MENAPAK LANTAI
                box = new THREE.Box3().setFromObject(this.model);
                var center = box.getCenter(new THREE.Vector3());

                this.model.position.x -= center.x;
                this.model.position.z -= center.z;

                var heightOffset = -box.min.y;
                this.model.position.y += heightOffset;
                
                this.model.position.y -= 1.5;

                this.scene.add(this.model);

                // ==========================================
                // 3. PLAY ANIMATION (DIMODIFIKASI)
                // ==========================================
                if (gltf.animations && gltf.animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(this.model);
                    this.animations = gltf.animations;
                    this.currentAnimationIndex = 0;

                    // Daftarkan listener jika animasi lebih dari 1
                    if (this.animations.length > 1) {
                        this.mixer.addEventListener('finished', () => {
                            this.playNextAnimation();
                        });
                    }

                    // Putar animasi pertama
                    this.playAnimation(this.currentAnimationIndex);
                } else {
                    console.warn("Model ini tidak memiliki animasi.");
                }

                this.start();
            }, 
            undefined, 
            (error) => {
                console.error('[DEBUG-3D] ❌ TERJADI KESALAHAN SAAT MEMUAT MODEL:', error);
            }
        );
    }*/
    loadModel(modelUrl) {
        console.log(`[DEBUG-3D] Memulai proses muat file: ${modelUrl}`);
        
        const dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');

        const loader = new THREE.GLTFLoader();
        loader.setDRACOLoader(dracoLoader);
        
        loader.load(
            modelUrl, 
            (gltf) => {
                console.log(`[DEBUG-3D] ✅ File berhasil dimuat!`, gltf);
                
                if(this.model) this.scene.remove(this.model);
                
                // ==========================================
                // SOLUSI: Menggunakan "Wrapper Group"
                // ==========================================
                // Jadikan this.model sebagai bungkus kosong
                this.model = new THREE.Group(); 
                
                // Simpan scene asli dari GLTF
                const gltfScene = gltf.scene; 
                
                // Masukkan scene GLTF ke dalam bungkus
                this.model.add(gltfScene);

                this.model.updateMatrixWorld(true);

                // 1. AUTO-SCALE (Skala diterapkan ke Wrapper / Bungkus)
                var box = new THREE.Box3().setFromObject(this.model);
                var size = box.getSize(new THREE.Vector3());
                
                var maxDim = Math.max(size.x, size.y, size.z);
                var targetSize = 3.0; 
                if (maxDim > 0) {
                    var scaleFactor = targetSize / maxDim;
                    this.model.scale.set(scaleFactor, scaleFactor, scaleFactor);
                }

                this.model.updateMatrixWorld(true);

                // 2. AUTO-CENTER & MENAPAK LANTAI (Posisi diterapkan ke Wrapper / Bungkus)
                box = new THREE.Box3().setFromObject(this.model);
                var center = box.getCenter(new THREE.Vector3());

                this.model.position.x -= center.x;
                this.model.position.z -= center.z;

                var heightOffset = -box.min.y;
                this.model.position.y += heightOffset;
                
                //this.model.position.y -= 1.5;

                // Tambahkan Wrapper ke dalam scene utama
                this.scene.add(this.model);

                // ==========================================
                // 3. PLAY ANIMATION
                // ==========================================
                if (gltf.animations && gltf.animations.length > 0) {
                    
                    // PENTING: Mixer dipasang ke 'gltfScene' (isi dalam bungkus), 
                    // BUKAN ke 'this.model' (bungkusnya)
                    if (gltf.animations && gltf.animations.length > 0) {
    gltf.animations.forEach((clip) => {
        
        if (clip.name !== "mixamo.com") {
            console.log(`[DEBUG-3D] Memperbaiki rotasi dan jalur tulang untuk animasi: ${clip.name}`);
            
            let filteredTracks = [];

            clip.tracks.forEach((track) => {
                let parts = track.name.split('.');
                let boneName = parts[0];
                let property = parts[1];

                // 1. Lewati jika ada track "Armature" murni
                if (boneName === "Armature") return; 

                // 2. Bersihkan nama dari gltf-transform
                boneName = boneName.replace(/^Armature[|_]?/, "");

                // 3. Samakan format dengan underscore
                if (boneName.startsWith("mixamorig") && !boneName.startsWith("mixamorig_")) {
                    boneName = boneName.replace("mixamorig", "mixamorig_");
                }

                track.name = `${boneName}.${property}`;

                // ==========================================
                // SOLUSI: KOREKSI ROTASI PADA TULANG HIPS
                // ==========================================
                if (boneName === "mixamorig_Hips" && property === "quaternion") {
                    console.log("[DEBUG-3D] Mengoreksi rotasi X pada track Hips...");
                    
                    // Kita buat Quaternion bantuan untuk memutar balik +90 derajat pada sumbu X
                    const fixRotation = new THREE.Quaternion().setFromAxisAngle(
                        new THREE.Vector3(1, 0, 0), 
                        Math.PI / 2 // +90 derajat dalam radian
                    );

                    // Array track.values berisi data rotasi (x, y, z, w) untuk setiap keyframe
                    for (let i = 0; i < track.values.length; i += 4) {
                        // Ambil quaternion dari keyframe saat ini
                        let q = new THREE.Quaternion(
                            track.values[i],
                            track.values[i+1],
                            track.values[i+2],
                            track.values[i+3]
                        );

                        // Kalikan dengan quaternion pemutar balik
                        q.premultiply(fixRotation);

                        // Masukkan kembali nilainya ke dalam track animasi
                        track.values[i] = q.x;
                        track.values[i+1] = q.y;
                        track.values[i+2] = q.z;
                        track.values[i+3] = q.w;
                    }
                }
                
                // ==========================================
                // SOLUSI SEBELUMNYA: KOREKSI ROTASI (QUATERNION)
                // ==========================================
                if (boneName === "mixamorig_Hips" && property === "quaternion") {
                    // ... (kode rotasi quaternion yang sudah ada) ...
                }

                // ==========================================
                // SOLUSI BARU: KOREKSI TRANSLASI (POSISI) HIPS
                // ==========================================
                if (boneName === "mixamorig_Hips" && property === "position") {
                    console.log("[DEBUG-3D] Mengoreksi translasi Y/Z pada track Hips...");
                    
                    for (let i = 0; i < track.values.length; i += 3) {
                        let origY = track.values[i+1];
                        let origZ = track.values[i+2];

                        // Karena rotasi diputar +90 derajat pada sumbu X, 
                        // kita juga harus memutar vektor posisinya sebesar +90 derajat.
                        // Berdasarkan matriks rotasi 3D: Sumbu Y baru menjadi -Z lama, dan Z baru menjadi Y lama.
                        track.values[i+1] = -origZ; 
                        track.values[i+2] = origY;  
                    }
                }

                filteredTracks.push(track);
            });

            clip.tracks = filteredTracks;
        }
    });
}
                    
                    this.mixer = new THREE.AnimationMixer(gltfScene);
                    
                    this.animations = gltf.animations;
                    this.currentAnimationIndex = 0;

                    if (this.animations.length > 1) {
                        this.mixer.addEventListener('finished', () => {
                            this.playNextAnimation();
                        });
                    }

                    this.playAnimation(this.currentAnimationIndex);
                    
                    // ==========================================
// 1. CEK TULANG PADA MODEL FISIK
// ==========================================
console.log("=== DAFTAR TULANG PADA MODEL ===");
let boneCount = 0;
this.model.traverse((node) => {
    // Cari semua node yang bertipe Bone
    if (node.isBone) {
        console.log(`${boneCount}. Nama Tulang: ${node.name}`);
        boneCount++;
    }
});
console.log(`Total Tulang di Model: ${boneCount}`);

// ==========================================
// 2. CEK TARGET TULANG PADA KLIP ANIMASI
// ==========================================
console.log("=== TARGET TULANG DARI ANIMASI ===");
if (gltf.animations && gltf.animations.length > 0) {
    gltf.animations.forEach((clip, index) => {
        console.log(`\nAnimasi Ke-${index + 1}: ${clip.name}`);
        console.log(`Durasi: ${clip.duration} detik, Total Track: ${clip.tracks.length}`);
        
        // Ambil 5 track pertama saja sebagai sampel agar console tidak penuh
        // (Satu klip animasi biasanya memiliki 50-150 track)
        for (let i = 0; i < Math.min(5, clip.tracks.length); i++) {
            // Track name biasanya berformat "NamaTulang.quaternion" atau "NamaTulang.position"
            console.log(` - Track mencari: ${clip.tracks[i].name}`);
        }
    });
} else {
    console.log("Tidak ada animasi yang ditemukan di file ini.");
}
                    
                    
                } else {
                    console.warn("Model ini tidak memiliki animasi.");
                }

                this.start();
            }, 
            undefined, 
            (error) => {
                console.error('[DEBUG-3D] ❌ TERJADI KESALAHAN SAAT MEMUAT MODEL:', error);
            }
        );
    }

    // Fungsi baru untuk mengeksekusi animasi spesifik
    playAnimation(index) {
        if (!this.mixer || !this.animations[index]) return;

        if (this.animationAction) {
            this.animationAction.stop();
        }

        const clip = this.animations[index];
        this.animationAction = this.mixer.clipAction(clip);

        if (this.animations.length > 1) {
            this.animationAction.setLoop(THREE.LoopOnce, 1);
            this.animationAction.clampWhenFinished = true;
        } else {
            this.animationAction.setLoop(THREE.LoopRepeat, Infinity);
        }

        // ==========================================
        // SOLUSI AMBLAS: KOMPENSASI PANJANG KAKI
        // ==========================================
        // Naikkan titik Y dari wrapper utama agar pinggang tidak berada di lantai.
        // Angka 1.0 ini adalah perkiraan jarak dari pinggang ke telapak kaki.
        // Silakan ubah angka ini (misal 0.9, 1.2, atau 1.5) sampai sepatunya pas menyentuh lapangan tenis.
        this.model.position.y = 1.0; 

        this.animationAction.timeScale = this.currentSpeed;
        this.animationAction.reset().play();
        console.log(`[DEBUG-3D] Memutar animasi: ${clip.name} (${index + 1}/${this.animations.length})`);
    }

    playNextAnimation() {
        let hipsBone = null;
        
        this.model.traverse((node) => {
            if (node.isBone && node.name === "mixamorig_Hips") {
                hipsBone = node;
            }
        });

        if (hipsBone) {
            hipsBone.updateMatrixWorld(true);
            let currentHipsPosition = new THREE.Vector3();
            hipsBone.getWorldPosition(currentHipsPosition);

            // Tahan posisi X dan Z agar tidak teleport mundur saat lari selesai
            this.model.position.x = currentHipsPosition.x;
            this.model.position.z = currentHipsPosition.z;
        }

        this.currentAnimationIndex++;
        
        // Jika animasi habis, loop kembali ke awal
        if (this.currentAnimationIndex >= this.animations.length) {
            this.currentAnimationIndex = 0;
            
            // ==========================================
            // KEMBALI KE START AWAL (RESTART LARI)
            // ==========================================
            // Kembalikan hanya koordinat X dan Z ke titik pusat (0, 0).
            // Posisi Y tidak perlu diubah ke angka negatif lagi, 
            // karena akan otomatis diurus oleh fungsi playAnimation() di bawah.
            this.model.position.x = 0;
            this.model.position.z = 0;
        }

        this.playAnimation(this.currentAnimationIndex);
    }

    // Fungsi baru untuk memindahkan ke animasi selanjutnya
    

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
        // Simpan state speed saat ini agar animasi selanjutnya ikut slow-mo
        this.currentSpeed = isSlow ? 0.3 : 1.0; 
        if (this.animationAction) {
            this.animationAction.timeScale = this.currentSpeed;
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

    setY(nilaiY) {
        if (this.model) {
            this.model.position.y = nilaiY;
            console.log(`[DEBUG] Posisi Y model sekarang diset ke: ${this.model.position.y}`);
        } else {
            console.warn("[DEBUG] Model belum dimuat!");
        }
    }

    geserY(nilaiOffset) {
        if (this.model) {
            this.model.position.y += nilaiOffset;
            console.log(`[DEBUG] Posisi Y digeser. Nilai Y sekarang: ${this.model.position.y}`);
        } else {
            console.warn("[DEBUG] Model belum dimuat!");
        }
    }
    
    cekPosisi() {
        if (this.model) {
            console.log(`[DEBUG] Koordinat Model -> X: ${this.model.position.x}, Y: ${this.model.position.y}, Z: ${this.model.position.z}`);
        }
    }
}