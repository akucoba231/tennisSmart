// database_seeder.js

const initLokalDatabase = () => {
    
    // 1. Data Sesi (Manajemen Login)
    // Menyimpan status user yang sedang aktif. Null jika belum ada yang login.
    if (!localStorage.getItem('app_session')) {
        localStorage.setItem('app_session', JSON.stringify(null));
    }

    // 2. Master Data: Pengguna (Atlet & Pelatih)
    if (!localStorage.getItem('tb_users')) {
        const dataUsers = [
            {
                id_user: "ATL-001",
                role: "atlet",
                username: "atlet",
                email: "iraqi@tennis.com",
                password: "atlet",
                nama: "Iraqi Maharani",
                usia: 12,
                tinggi_cm: 150,
                lamaLatihan_bulan: 6,
                level: "Beginner 1",
                kelemahanUtama: "Servis",
                waktu_pendaftaran: "2026-05-10T08:00:00"
            },
            {
                id_user: "PLT-001",
                role: "pelatih",
                username: "coach_budi",
                email: "budi@tennis.com",
                password: "admin",
                nama: "Budi Santoso",
                spesialisasi: "Teknik Dasar",
                waktu_pendaftaran: "2026-05-01T09:30:00"
            }
        ];
        localStorage.setItem('tb_users', JSON.stringify(dataUsers));
    }

    // 3. Master Data: Daftar Program Latihan
    if (!localStorage.getItem('tb_master_latihan')) {
        const latihanDasar = [
            { id_latihan: "LAT-01", kategori: "Pemanasan", nama: "Dynamic Stretching" },
            { id_latihan: "LAT-02", kategori: "Pemanasan", nama: "Shadow Swing" },
            { id_latihan: "LAT-03", kategori: "Drill Utama", nama: "Forehand Cross Court" },
            { id_latihan: "LAT-04", kategori: "Drill Fokus", nama: "Servis Target Cone (30 Repetisi)" },
            { id_latihan: "LAT-05", kategori: "Game Situational", nama: "Mini Match 10 Poin" }
        ];
        localStorage.setItem('tb_master_latihan', JSON.stringify(latihanDasar));
    }

    // 4. Master Data: Indikator Assessment (Mendukung Skor, Durasi, Repetisi)
    // Master Data: Kategori Asesmen Tenis Lapangan Baru (Production Ready)
    if (!localStorage.getItem('tb_master_assessment')) {
        const assessmentDasar = [
            { id_assessment: "ASS-01", nama: "Forehand Assessment" },
            { id_assessment: "ASS-02", nama: "Volley Forehand Assessment" },
            { id_assessment: "ASS-03", nama: "Backhand Assessment" },
            { id_assessment: "ASS-04", nama: "Volley Backhand Assessment" },
            { id_assessment: "ASS-05", nama: "Service Assessment" }
        ];
        localStorage.setItem('tb_master_assessment', JSON.stringify(assessmentDasar));
    }

    // 5. Data Transaksional: Riwayat Latihan
    if (!localStorage.getItem('tb_riwayat_latihan')) {
        // Data dummy awal untuk kemudahan testing UI
        const dummyRiwayatLatihan = [
            {
                id_riwayat_lat: "RLAT-1001",
                user_id: "ATL-001",
                tanggal: "2026-06-06T08:15:00",
                id_latihan: "LAT-01",
                status_selesai: true,
                catatan_pelatih: "Pemanasan dilakukan dengan baik, tapi rentang gerak bahu masih kurang maksimal."
            }
        ];
        localStorage.setItem('tb_riwayat_latihan', JSON.stringify(dummyRiwayatLatihan)); 
    }

    // 6. Data Transaksional: Riwayat Assessment
    // if (!localStorage.getItem('tb_riwayat_assessment')) {
    //     const dummyRiwayatAssessment = [
    //         {
    //             id_riwayat_ass: "RASS-1001",
    //             user_id: "ATL-001",
    //             tanggal: "2026-06-06T14:30:00",
    //             id_assessment: "ASS-03",
    //             hasil_metrik: {
    //                 "Agility Time": { nilai_aktual: 2.5, skor_1_10: 8 },
    //                 "Total Gerakan": { nilai_aktual: 45, skor_1_10: 7 }
    //             },
    //             catatan_pelatih: ""
    //         }
    //     ];
    //     localStorage.setItem('tb_riwayat_assessment', JSON.stringify(dummyRiwayatAssessment)); 
    // }

    // 5. Data Transaksional: Riwayat Assessment Multiuser (Data Debugging 15 Baris)
    if (!localStorage.getItem('tb_riwayat_assessment')) {
        const riwayatAssDefault = [
            // --- TES HARI KE-1 (01 Mei 2026) ---
            { id_riwayat_ass: "RASS-001", user_id: "ATL-001", tanggal: "2026-05-01T08:00:00Z", id_assessment: "ASS-01", hasil_metrik: { "Akurasi": { skor_1_10: 5 }, "Konsistensi": { skor_1_10: 6 } }, catatan_pelatih: "Awal latihan, masih kaku." },
            { id_riwayat_ass: "RASS-002", user_id: "ATL-001", tanggal: "2026-05-01T08:15:00Z", id_assessment: "ASS-02", hasil_metrik: { "Akurasi": { skor_1_10: 4 }, "Konsistensi": { skor_1_10: 5 } }, catatan_pelatih: "" },
            { id_riwayat_ass: "RASS-003", user_id: "ATL-001", tanggal: "2026-05-01T08:30:00Z", id_assessment: "ASS-03", hasil_metrik: { "Akurasi": { skor_1_10: 4 }, "Konsistensi": { skor_1_10: 4 } }, catatan_pelatih: "Backhand sangat lemah." },
            { id_riwayat_ass: "RASS-004", user_id: "ATL-001", tanggal: "2026-05-01T08:45:00Z", id_assessment: "ASS-04", hasil_metrik: { "Akurasi": { skor_1_10: 3 }, "Konsistensi": { skor_1_10: 4 } }, catatan_pelatih: "" },
            { id_riwayat_ass: "RASS-005", user_id: "ATL-001", tanggal: "2026-05-01T09:00:00Z", id_assessment: "ASS-05", hasil_metrik: { "Akurasi": { skor_1_10: 6 }, "Konsistensi": { skor_1_10: 6 } }, catatan_pelatih: "Servis dasar cukup baik." },

            // --- TES HARI KE-2 (15 Mei 2026) ---
            { id_riwayat_ass: "RASS-006", user_id: "ATL-001", tanggal: "2026-05-15T08:00:00Z", id_assessment: "ASS-01", hasil_metrik: { "Akurasi": { skor_1_10: 6 }, "Konsistensi": { skor_1_10: 7 } }, catatan_pelatih: "Ada peningkatan di Forehand." },
            { id_riwayat_ass: "RASS-007", user_id: "ATL-001", tanggal: "2026-05-15T08:15:00Z", id_assessment: "ASS-02", hasil_metrik: { "Akurasi": { skor_1_10: 5 }, "Konsistensi": { skor_1_10: 6 } }, catatan_pelatih: "" },
            { id_riwayat_ass: "RASS-008", user_id: "ATL-001", tanggal: "2026-05-15T08:30:00Z", id_assessment: "ASS-03", hasil_metrik: { "Akurasi": { skor_1_10: 5 }, "Konsistensi": { skor_1_10: 4 } }, catatan_pelatih: "" },
            { id_riwayat_ass: "RASS-009", user_id: "ATL-001", tanggal: "2026-05-15T08:45:00Z", id_assessment: "ASS-04", hasil_metrik: { "Akurasi": { skor_1_10: 4 }, "Konsistensi": { skor_1_10: 4 } }, catatan_pelatih: "" },
            { id_riwayat_ass: "RASS-010", user_id: "ATL-001", tanggal: "2026-05-15T09:00:00Z", id_assessment: "ASS-05", hasil_metrik: { "Akurasi": { skor_1_10: 7 }, "Konsistensi": { skor_1_10: 6 } }, catatan_pelatih: "" },

            // --- TES HARI KE-3 (30 Mei 2026) ---
            { id_riwayat_ass: "RASS-011", user_id: "ATL-001", tanggal: "2026-05-30T08:00:00Z", id_assessment: "ASS-01", hasil_metrik: { "Akurasi": { skor_1_10: 8 }, "Konsistensi": { skor_1_10: 8 } }, catatan_pelatih: "Forehand sudah sangat stabil dan mematikan." },
            { id_riwayat_ass: "RASS-012", user_id: "ATL-001", tanggal: "2026-05-30T08:15:00Z", id_assessment: "ASS-02", hasil_metrik: { "Akurasi": { skor_1_10: 7 }, "Konsistensi": { skor_1_10: 6 } }, catatan_pelatih: "" },
            { id_riwayat_ass: "RASS-013", user_id: "ATL-001", tanggal: "2026-05-30T08:30:00Z", id_assessment: "ASS-03", hasil_metrik: { "Akurasi": { skor_1_10: 6 }, "Konsistensi": { skor_1_10: 5 } }, catatan_pelatih: "Backhand mulai ada progres, perbanyak drill bulan depan." },
            { id_riwayat_ass: "RASS-014", user_id: "ATL-001", tanggal: "2026-05-30T08:45:00Z", id_assessment: "ASS-04", hasil_metrik: { "Akurasi": { skor_1_10: 5 }, "Konsistensi": { skor_1_10: 5 } }, catatan_pelatih: "" },
            { id_riwayat_ass: "RASS-015", user_id: "ATL-001", tanggal: "2026-05-30T09:00:00Z", id_assessment: "ASS-05", hasil_metrik: { "Akurasi": { skor_1_10: 8 }, "Konsistensi": { skor_1_10: 7 } }, catatan_pelatih: "Akurasi servis meningkat drastis." }
        ];
        localStorage.setItem('tb_riwayat_assessment', JSON.stringify(riwayatAssDefault)); 
    }

    // 7. Data Transaksional: Evaluasi Mingguan (Mendukung input berulang di hari yang sama)
    if (!localStorage.getItem('tb_evaluasi_mingguan')) {
        const dummyEvaluasi = [
            {
                id_evaluasi: "EVAL-1001",
                user_id: "ATL-001",
                tanggal: "2026-06-05T08:30:00",
                latihan_mudah: "ya",
                teknik_stabil: "tidak",
                keluhan_nyeri: "tidak",
                catatan_pelatih: "Intensitas latihan akan dinaikkan minggu depan."
            },
            {
                id_evaluasi: "EVAL-1002",
                user_id: "ATL-001",
                tanggal: "2026-06-06T14:15:00",
                latihan_mudah: "tidak",
                teknik_stabil: "ya",
                keluhan_nyeri: "ya",
                catatan_pelatih: "Cek ulang postur saat melakukan servis untuk meminimalisir nyeri bahu."
            }
        ];
        localStorage.setItem('tb_evaluasi_mingguan', JSON.stringify(dummyEvaluasi));
    }

    console.log("Sistem Database Lokal (Tennis Smart Training 3D) Multiuser Siap!");
};

// Menjalankan fungsi inisialisasi
//initLokalDatabase();

// Fungsi untuk membersihkan database lokal aplikasi
function clearAppDatabase() {
    // Daftar semua key yang pernah digunakan oleh aplikasi
    const appKeys = [
        // --- Key Arsitektur Baru (Multiuser) ---
        'app_session',
        'tb_users',
        'tb_master_latihan',
        'tb_master_assessment',
        'tb_riwayat_latihan',
        'tb_riwayat_assessment',
        'tb_evaluasi_mingguan',
        
        // --- Key Arsitektur Lama (Prototipe) ---
        'akunAtlet',
        'dataMateri',
        'dataAssessment',
        'dataLatihan',
        'riwayatAssessment',
        'riwayatLatihan'
    ];

    let keysRemoved = 0;

    appKeys.forEach(key => {
        // Cek apakah key tersebut ada di localStorage sebelum dihapus
        if (localStorage.getItem(key) !== null) {
            localStorage.removeItem(key);
            console.log(`🗑️ Menghapus key: ${key}`);
            keysRemoved++;
        }
    });

    if (keysRemoved > 0) {
        console.log(`✅ Pembersihan selesai! ${keysRemoved} tabel aplikasi telah dihapus.`);
        alert(`Database aplikasi berhasil dibersihkan (${keysRemoved} item dihapus).`);
    } else {
        console.log(`ℹ️ Tidak ada data aplikasi yang ditemukan untuk dihapus.`);
        alert("Database sudah dalam keadaan bersih.");
    }
}

// Cara Penggunaan:
// 1. Comment pemanggilan fungsi initLokalDatabase() agar tidak otomatis jalan
 initLokalDatabase(); 

// 2. Uncomment baris di bawah ini HANYA SAAT INGIN MEMBERSIHKAN DATA, 
//    lalu comment kembali setelah halaman di-refresh.
// clearAppDatabase();

