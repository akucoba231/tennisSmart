# 3D Model Viewer (Three.js)

Aplikasi web 3D model viewer yang responsif dan modern, dibuat khusus dengan **HTML5, CSS3, JavaScript (ES Modules)**, dan pustaka **Three.js**. Didesain dengan pendekatan *mobile-first* menggunakan antarmuka *glassmorphism* yang elegan.

---

## 🚀 Fitur Utama

1. **Kompatibilitas Penuh GLB/GLTF**:
   - Mendukung model bawaan: `karakter_atlet.glb` dan `raket_tenis.glb`.
   - **Pemilih File Lokal & Drag & Drop**: Pengguna dapat memasukkan file `.glb` atau `.gltf` apa saja dari komputer/HP mereka.
   - Dekoder **DRACO** otomatis untuk model terkompresi.
2. **Desain Mobile-First & Responsif**:
   - Menyesuaikan ukuran layar penuh dengan `100dvh` (tidak terpotong oleh address bar ponsel).
   - *Touch controls* yang intuitif: sentuh 1 jari untuk memutar, cubit (pinch) untuk memperbesar/memperkecil, 2 jari untuk menggeser (pan).
   - Tombol dan panel kontrol yang ramah sentuhan (touch target minimal 44px).
3. **Pencahayaan Studio & Shadow Catcher**:
   - ACES Filmic Tone Mapping untuk warna yang realistis.
   - PBR Environment map otomatis (*RoomEnvironment*).
   - Bayangan lantai dinamis (*contact shadow*) dan grid helper.
4. **Sistem Pemutar Animasi (AnimationMixer)**:
   - Panel animasi otomatis muncul jika file GLB memiliki *keyframe animations*.
   - Tombol Putar / Jeda, pemilih klip animasi, dan pengatur kecepatan (0.5x, 1.0x, 1.5x, 2.0x).
5. **Peralatan Interaktif**:
   - **Reset Kamera**: Memposisikan model tepat di tengah layar dengan jarak pandang ideal.
   - **Rotasi Otomatis (Turntable)**: Memutar model secara halus untuk presentasi 360°.
   - **Mode Wireframe**: Melihat struktur topologi polygon 3D.
   - **Ganti Tema Background**: Dark Studio, Slate Gray, dan Clean White.
   - **Informasi Model**: Melihat jumlah mesh, poligon (segitiga), animasi, dan dimensi ukuran nyata model (dalam meter).

---

## 💻 Cara Menjalankan

### Cara 1: Menggunakan Local Web Server (Direkomendasikan)
Karena kebijakan keamanan browser (CORS), file 3D lokal bekerja paling optimal jika diakses melalui web server:
- **Windows**: Cukup klik 2x berkas `start_server.bat`.
- **VS Code**: Klik kanan pada `index.html` lalu pilih **Open with Live Server**.
- **Terminal (Python)**:
  ```bash
  py -m http.server 8000
  ```
  Lalu buka browser di `http://localhost:8000`.

### Cara 2: Langsung Buka di Browser (Tanpa Server)
Jika membuka `index.html` langsung (melalui `file:///`):
1. Buka `index.html` di browser (Chrome / Edge / Firefox / Safari).
2. Klik tombol **"📁 Buka File Lain..."** di bagian bawah.
3. Pilih file `karakter_atlet.glb` atau `raket_tenis.glb` dari folder ini.
4. Model akan langsung terbuka tanpa terpengaruh batasan CORS!
