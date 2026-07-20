// database_seeder.js

const initLokalDatabase = () => {
    // 1. Data Sesi (Manajemen Login)
    // Menyimpan status user yang sedang aktif. Null jika belum ada yang login.
    if (!sessionStorage.getItem('app_session')) {
        sessionStorage.setItem('app_session', JSON.stringify(null));
    }
    
    // RESTful API backend (db_smart_tenis) sekarang menjadi single source of truth.
    // Seluruh operasi sinkron localStorage sebelumnya telah diubah menjadi API asinkron.
    console.log("Session Storage siap! Aplikasi kini terhubung dengan REST API Backend.");
};

// Menjalankan fungsi inisialisasi
initLokalDatabase();

// Fungsi untuk membersihkan database lokal aplikasi (deprecated, backend handled)
function clearAppDatabase() {
    console.log("Fungsi reset lokal dinonaktifkan karena menggunakan backend database MySQL.");
}
