// Fungsi untuk menginisialisasi database lokal (localStorage)
const initLokalDatabase = () => {
    
    // 1. Master Data: Akun Atlet Default
    if (!localStorage.getItem('akunAtlet')) {
        const akunDefault = {
            id: "ATL-001",
            username: "Atlet",
            password: "atlet",
            nama: "Iraqi Maharani",
            usia: 12,
            tinggi_cm: 150,
            lamaLatihan_bulan: 6,
            riwayatCedera: "Tidak Ada",
            level: "Beginner 1",
            kelemahanUtama: "Servis"
        };
        localStorage.setItem('akunAtlet', JSON.stringify(akunDefault));
    }

    // 2. Master Data: Materi Teknik & Referensi Animasi 3D (.glb)
    if (!localStorage.getItem('dataMateri')) {
        const materiDasar = [
            { id: "MAT-01", judul: "Grip & Ready Position", model3D: "boy_swinging_racket.glb", deskripsi: "Posisi siap dan cara memegang raket." },
            { id: "MAT-02", judul: "Forehand Swing Technique", model3D: "forehand_swing.glb", deskripsi: "Teknik ayunan forehand dari berbagai sudut." },
            { id: "MAT-03", judul: "General Practice", model3D: "general_practice.glb", deskripsi: "Simulasi gerakan kaki dan pukulan dasar." }
        ];
        localStorage.setItem('dataMateri', JSON.stringify(materiDasar));
    }

    // 3. Master Data: Indikator Assessment (Sesuai Desain UI)
    if (!localStorage.getItem('dataAssessment')) {
        const assessmentDasar = [
            { id: "ASS-01", nama: "Forehand Test", metrik: ["Akurasi", "Konsistensi"] },
            { id: "ASS-02", nama: "Servis Test", metrik: ["Akurasi", "Power"] },
            { id: "ASS-03", nama: "Footwork Test", metrik: ["Agility Time", "Koordinasi"] }
        ];
        localStorage.setItem('dataAssessment', JSON.stringify(assessmentDasar));
    }

    // 4. Master Data: Daftar Program Latihan
    if (!localStorage.getItem('dataLatihan')) {
        const latihanDasar = [
            { id: "LAT-01", kategori: "Pemanasan", nama: "Dynamic Stretching" },
            { id: "LAT-02", kategori: "Pemanasan", nama: "Shadow Swing" },
            { id: "LAT-03", kategori: "Drill Utama", nama: "Forehand Cross Court" },
            { id: "LAT-04", kategori: "Drill Fokus", nama: "Servis Target Cone (30 Repetisi)" },
            { id: "LAT-05", kategori: "Game Situational", nama: "Mini Match 10 Poin" }
        ];
        localStorage.setItem('dataLatihan', JSON.stringify(latihanDasar));
    }

    // 5. Data Transaksional: Riwayat Assessment (Dikosongkan di awal)
    if (!localStorage.getItem('riwayatAssessment')) {
        // Format isi nantinya: { id: "RASS-1", tanggal: "2026-03-15", id_assessment: "ASS-01", skor: { Akurasi: 7, Konsistensi: 8 } }
        localStorage.setItem('riwayatAssessment', JSON.stringify([])); 
    }

    // 6. Data Transaksional: Riwayat Latihan (Dikosongkan di awal)
    if (!localStorage.getItem('riwayatLatihan')) {
        // Format isi nantinya: { id: "RLAT-1", tanggal: "2026-03-15", id_latihan: "LAT-03", status_selesai: true }
        localStorage.setItem('riwayatLatihan', JSON.stringify([]));
    }

    console.log("Sistem Database Lokal (Tennis Smart Training 3D) Siap!");
};

// Jalankan fungsi saat file ini dimuat oleh browser
initLokalDatabase();
