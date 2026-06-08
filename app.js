/* ==========================================================================
   TENNIS SMART TRAINING 3D - APP LOGIC
   ========================================================================== */

// --- STATE APLIKASI ---
let currentRole = null; // 'atlet' atau 'pelatih'
let chartMingguan = null; // Menyimpan instance Chart.js
let chartRadar = null;

let scene3D, camera3D, renderer3D; // Instance Three.js

// Buat instance global agar bisa diakses oleh tombol kontrol
let materi3DViewer = null;

// --- INISIALISASI SAAT HALAMAN DIMUAT ---
document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initAuth();
    //initThreeJSBoilerplate();
});

/* ==========================================================================
   1. SISTEM NAVIGASI SPA & DROPDOWN MENU
   ========================================================================== */
   function initNavigation() {
    const menuBtn = document.getElementById('menu-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Toggle Dropdown Menu
    menuBtn.addEventListener('click', () => {
        dropdownMenu.classList.toggle('show');
    });

    // Pindah Halaman SPA
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = e.target.getAttribute('data-target');
            navigateTo(targetView);
            dropdownMenu.classList.remove('show'); // Tutup menu setelah klik
        });
    });

    // Tutup dropdown jika klik di luar area
    window.addEventListener('click', (e) => {
        if (!menuBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('show');
        }
    });
}

function navigateTo(viewId) {
    // Sembunyikan semua view
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Tampilkan view target
    document.getElementById(viewId).classList.add('active');


            // Atur visibilitas Header/Navbar
        const header = document.getElementById('main-header');
        if (viewId === 'view-login') {
            header.style.display = 'none';
        } else {
            header.style.display = 'flex';

        // Render data spesifik saat halaman dibuka
        if (viewId === 'view-athlete-home') renderAthleteHome();
        if (viewId === 'view-coach-home') renderCoachHome();
        if (viewId === 'view-training') renderTrainingList();
        if (viewId === 'view-assessment') renderAssessmentForm();
        //if (viewId === 'view-progress') renderAthleteProgress(); // <--- TAMBAHKAN BARIS INI
        // Di dalam navigateTo(viewId)
        if (viewId === 'view-progress') {
            const session = JSON.parse(localStorage.getItem('app_session'));
            keatas();
            if (session && session.role === 'atlet') {
                renderProgressDetail(session.id_user, false); // Atlet langsung ke rinciannya sendiri
            } else if (session && session.role === 'pelatih') {
                renderCoachProgressList(); // Pelatih masuk ke daftar list dulu
            }
        }
        if (viewId === 'view-account') renderAccountForm();
        if (viewId === 'view-evaluation') renderEvaluation();
        
        // TAMBAHKAN BARIS INI:
        if (viewId === 'view-material-3d') renderMaterial3D();


    }
}

function renderEvaluation() {
    const btnSubmit = document.getElementById('btn-submit-eval');
    const cancelEval = document.getElementById('cancelEval');
    renderEval();

    cancelEval.onclick = () => {
        tutupEvalForm();
    }
    
    btnSubmit.onclick = () => {
        const session = JSON.parse(localStorage.getItem('app_session'));
        if (!session) {
            alert('⚠️ Anda harus login untuk mengisi evaluasi.');
            return;
        }

        // Ambil nilai dari form
        const evalData = {
            id_eval: 'EVAL-' + Date.now(),
            user_id: session.id_user,
            tanggal: new Date().toISOString(),
            latihan_mudah: document.getElementById('eval-mudah').value,
            teknik_stabil: document.getElementById('eval-stabil').value,
            keluhan_nyeri: document.getElementById('eval-nyeri').value
        };

        // Ambil data lama, push data baru, simpan kembali
        const evaluasiDB = JSON.parse(localStorage.getItem('tb_evaluasi_mingguan')) || [];
        evaluasiDB.push(evalData);
        localStorage.setItem('tb_evaluasi_mingguan', JSON.stringify(evaluasiDB));

        // Berikan notifikasi sukses
        alert('✅ Evaluasi mingguan berhasil dikirim! Terima kasih atas feedback Anda.');
        
        // Tutup form
        //document.getElementById('eval-form').reset();
        tutupEvalForm();

        renderEval();

        
        // Opsional: Alihkan ke beranda setelah submit
        //navigateTo('view-athlete-home');
    };
}

function tutupEvalForm(){
    let evalForm = document.getElementById('eval-form');
    evalForm.style.display = "none";
    evalForm.reset()
}

function bukaEvalForm(){
    let evalForm = document.getElementById('eval-form');
    evalForm.style.display = "block";
}

function renderEval(){
    let evalRender = document.getElementById('evalRender');

    const session = JSON.parse(localStorage.getItem('app_session'));
    let dataEvaluasi = JSON.parse(localStorage.getItem('tb_evaluasi_mingguan')) || [];
    dataEvaluasi = dataEvaluasi.filter((item) => item.user_id === session.id_user);

    let body = ``;

    let n = 1;
    for(let i = dataEvaluasi.length-1; i >= 0; i--){
    //dataEvaluasi.forEach((item,index)=>{
        let item = dataEvaluasi[i];
        body += `
        <tr>
            <td>${n++}</td>
            <td>${dayjs(item.tanggal).format('DD/MM/YYYY')}</td>
            <td>${item.latihan_mudah}</td>
            <td>${item.teknik_stabil}</td>
            <td>${item.keluhan_nyeri}</td>
        </tr>
        `
    };
    evalRender.innerHTML = body;
}

// ==========================================================================
// MODUL PROGRESS MINGGUAN (PELATIH & ATLET)
// ==========================================================================

// --- FUNGSI 1: TAMPILKAN TABEL DAFTAR ATLET UNTUK PELATIH ---
function renderCoachProgressList() {
    document.getElementById('progress-list-container').style.display = 'block';
    document.getElementById('progress-detail-container').style.display = 'none';

    const usersDB = JSON.parse(localStorage.getItem('tb_users')) || [];
    const daftarAtlet = usersDB.filter(u => u.role === 'atlet');
    const tbody = document.getElementById('tbody-progress-list');
    tbody.innerHTML = '';

    if (daftarAtlet.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada atlet.</td></tr>';
        return;
    }

    daftarAtlet.forEach((atlet, index) => {
        tbody.innerHTML += `
        <tr>
        <td style="text-align:center;">${index + 1}</td>
        <td><strong>${atlet.nama}</strong></td>
        <td><span class="badge">${atlet.level || 'Beginner 1'}</span></td>
        <td style="text-align:center;">
        <button class="btn-secondary btn-lihat-rincian" data-id="${atlet.id_user}" style="font-size:0.8rem; border-radius:4px;">
        <i class="fas fa-chart-line"></i> Rincian
        </button>
        </td>
        </tr>
        `;
    });

    // Di dalam renderCoachProgressList(), tepat setelah proses forEach pengisian tbody:
    
    if ($.fn.DataTable.isDataTable('#table-progress-list')) { // Asumsi ID tabelnya diberi id="table-progress-list" di HTML
        $('#table-progress-list').DataTable().destroy();
    }
    
    $('#table-progress-list').DataTable({
        scrollX: true,
        bLengthChange: false,
        language: { search: "Cari Nama:" }
    });

    // Pasang Event Listener Tombol Rincian
    document.querySelectorAll('.btn-lihat-rincian').forEach(btn => {
        btn.onclick = () => {
            const atletId = btn.getAttribute('data-id');
            renderProgressDetail(atletId, true); // Panggil fungsi detail dengan mode Pelatih
        };
    });
}

// --- FUNGSI 2: TAMPILKAN RINCIAN PROGRESS (Dipakai Atlet & Pelatih) ---
// Variabel global sementara untuk chart di halaman progress
let chartProgressLine = null;
let chartProgressRadar = null;

function renderProgressDetail(targetUserId, isCoachView) {
    const session = JSON.parse(localStorage.getItem('app_session'));
    const usersDB = JSON.parse(localStorage.getItem('tb_users')) || [];
    const atletData = usersDB.find(u => u.id_user === targetUserId);

    if(!atletData) return;

    // 1. Atur Visibilitas Kontainer
    document.getElementById('progress-list-container').style.display = 'none';
    const detailContainer = document.getElementById('progress-detail-container');
    detailContainer.style.display = 'block';

    const btnBack = document.getElementById('btn-back-progress-list');
    const bioCard = document.getElementById('progress-biodata-card');
    const radarCard = document.getElementById('progress-radar-card');

    // 2. Sesuaikan UI Berdasarkan Peran
    if (isCoachView) {
        document.getElementById('progress-detail-title').textContent = `Progress: ${atletData.nama}`;
        btnBack.style.display = 'inline-block';
        bioCard.style.display = 'block';
        radarCard.style.display = 'block'; 
        
        bioCard.innerHTML = `
            <p style="margin-bottom:5px;"><strong>Usia / Tinggi:</strong> ${atletData.usia} Thn / ${atletData.tinggi_cm} cm</p>
            <p style="margin-bottom:5px;"><strong>Level Terkini:</strong> <span style="color:var(--secondary-green); font-weight:bold;">${atletData.level}</span></p>
            <p style="margin-bottom:0;"><strong>Kekurangan:</strong> <span style="color:var(--danger);">${atletData.kelemahanUtama}</span></p>
        `;
        btnBack.onclick = () => renderCoachProgressList();
    } else {
        document.getElementById('progress-detail-title').textContent = `Progress Anda`;
        btnBack.style.display = 'none';
        bioCard.style.display = 'none';
        radarCard.style.display = 'none'; 
    }

    // 3. Tarik & Susun Data Riwayat Tabel
    const riwayatLatihan = JSON.parse(localStorage.getItem('tb_riwayat_latihan')) || [];
    const riwayatAssessment = JSON.parse(localStorage.getItem('tb_riwayat_assessment')) || [];
    const dataLatihan = JSON.parse(localStorage.getItem('tb_master_latihan')) || [];
    const dataAssessment = JSON.parse(localStorage.getItem('tb_master_assessment')) || [];
    
    let semuaRiwayat = [];

    // Format Latihan
    riwayatLatihan.filter(r => r.user_id === targetUserId).forEach(r => {
        const latInfo = dataLatihan.find(l => l.id_latihan === r.id_latihan);
        semuaRiwayat.push({
            tanggal: r.tanggal,
            jenis: 'Latihan',
            nama: latInfo ? latInfo.nama : 'Tidak Dikenal',
            status: 'Selesai ✅',
            status_clean: 'Selesai',
            nama_pelatih: '-', // Latihan dilakukan sendiri tanpa pelatih
            timestamp: new Date(r.tanggal).getTime()
        });
    });

    // Format Asesmen
    riwayatAssessment.filter(r => r.user_id === targetUserId).forEach(r => {
        const assInfo = dataAssessment.find(a => a.id_assessment === r.id_assessment);
        let skorStrArr = [];
        if(r.hasil_metrik) {
            for(const [namaMetrik, hasil] of Object.entries(r.hasil_metrik)) {
                skorStrArr.push(`${namaMetrik}: ${hasil.skor_1_10}`);
            }
        }
        
        semuaRiwayat.push({
            tanggal: r.tanggal,
            jenis: 'Assesment',
            nama: assInfo ? assInfo.nama : 'Tidak Dikenal',
            status: skorStrArr.join('<br>'), 
            status_clean: skorStrArr.join(', '), 
            nama_pelatih: r.nama_pelatih || '-', // Tarik nama pelatih, default strip
            timestamp: new Date(r.tanggal).getTime()
        });
    });

    semuaRiwayat.sort((a, b) => b.timestamp - a.timestamp);

    // 4. Render ke Tabel HTML
    // 4. Render ke Tabel HTML (DENGAN DATATABLES)
    const tableId = '#table-athlete-history';
    
    // Hancurkan instansi DataTables lama jika ada (Wajib untuk arsitektur SPA)
    if ($.fn.DataTable.isDataTable(tableId)) {
        $(tableId).DataTable().destroy();
    }

    const tbody = document.getElementById('tbody-athlete-history');
    tbody.innerHTML = '';
    
    if (semuaRiwayat.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada riwayat aktivitas.</td></tr>';
    } else {
        semuaRiwayat.forEach((item,index) => {
            const badgeColor = item.jenis === 'Assesment' ? '#1E56A0' : '#4CAF50';
            tbody.innerHTML += `
                <tr>
                    <td>${(index+1)}</td>
                    <td data-sort="${item.timestamp}" style="white-space:nowrap; font-size: 0.85rem;">
                        ${dayjs(item.tanggal).format('DD MMM YYYY<br>HH:mm')}
                    </td>
                    <td>
                        <span style="background:${badgeColor}; color:white; padding:2px 6px; border-radius:4px; font-size:0.7rem;">${item.jenis}</span>
                        <br><strong>${item.nama}</strong>
                    </td>
                    <td style="font-size: 0.85rem;">${item.status}</td>
                    <td style="font-size: 0.85rem; text-align: center;">${item.nama_pelatih}</td>
                </tr>
            `;
        });
    }

    // Inisialisasi Ulang DataTables dengan konfigurasi khusus Mobile
    $(tableId).DataTable({
        pageLength: 10,             // Batasi 10 baris per halaman
        scrollX: true,              // Izinkan scroll horizontal agar tabel tidak melebar keluar layar HP
        order: [[0, "desc"]],       // Urutkan kolom pertama (Tanggal) dari yang terbaru secara default
        bLengthChange: false,       // Sembunyikan opsi "Show [10] entries" untuk menghemat ruang di layar kecil
        language: {
            search: "Cari Data:",
            info: "Menampilkan _START_ - _END_ dari _TOTAL_ riwayat",
            infoEmpty: "Tidak ada data riwayat",
            zeroRecords: "Pencarian tidak menemukan hasil",
            paginate: {
                previous: "«",
                next: "»"
            }
        }
    });

    // 5. Render Grafik (Memanggil fungsi yang sudah dilengkapi di bawah)
    renderProgressCharts(targetUserId, isCoachView);

    // 6. CUSTOM EXPORT EXCEL
    document.getElementById('btn-export-athlete').onclick = () => {
        const ws_data = [];
        
        ws_data.push([`Capaian Latihan dan Asesmen Atlet - ${atletData.nama}`]);
        const pengekspor = isCoachView ? `Diekspor oleh Pelatih: ${session.nama}` : `Diekspor mandiri oleh: ${atletData.nama}`;
        ws_data.push([pengekspor]);
        ws_data.push([]);
        
        // Header dengan Kolom Pelatih
        ws_data.push(["Nomor","Tanggal Waktu", "Kategori Aktivitas", "Detail Kegiatan", "Pencapaian / Nilai", "Pelatih Penilai"]);
        
        semuaRiwayat.forEach((item,index) => {
            const tglBersih = dayjs(item.tanggal).format('DD MMM YYYY HH:mm');
            ws_data.push([(index+1),tglBersih, item.jenis, item.nama, item.status_clean, item.nama_pelatih]);
        });

        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Merge A1:E1 (Karena nambah 1 kolom)
            { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }  // Merge A2:E2
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Riwayat Progress");
        XLSX.writeFile(wb, `Capaian_Atlet_${atletData.nama.replace(/\s+/g, '_')}.xlsx`);
    };
}

// Fungsi asisten untuk merender ulang chart Line (dan Radar jika pelatih) di halaman detail ini
// Fungsi asisten untuk merender ulang chart Line & Radar di halaman rincian progress
function renderProgressCharts(targetUserId, isCoachView) {
    const ctxLine = document.getElementById('chart-athlete-progress');
    const ctxRadar = document.getElementById('chart-progress-radar');
    
    if(chartProgressLine) chartProgressLine.destroy();
    if(chartProgressRadar) chartProgressRadar.destroy();

    const riwayat = JSON.parse(localStorage.getItem('tb_riwayat_assessment')) || [];
    const masterAss = JSON.parse(localStorage.getItem('tb_master_assessment')) || [];
    const riwayatTarget = targetUserId ? riwayat.filter(r => r.user_id === targetUserId) : [];

    // Jika kosong, render chart melompong
    if (riwayatTarget.length === 0) {
        if(ctxLine) {
            chartProgressLine = new Chart(ctxLine.getContext('2d'), { type: 'line', data: { labels: ['Belum Ada Data'], datasets: [] }});
        }
        if(ctxRadar && isCoachView) {
            chartProgressRadar = new Chart(ctxRadar.getContext('2d'), { type: 'radar', data: { labels: ['Kosong'], datasets: [] }});
        }
        return;
    }

    // ===============================================
    // RENDER RADAR CHART (Hanya Muncul jika CoachView)
    // ===============================================
    if (isCoachView && ctxRadar) {
        const radarLabels = [];
        const radarData = [];

        masterAss.forEach(ass => {
            radarLabels.push(ass.nama.replace(' Assessment', ''));
            const tesKategoriIni = riwayatTarget.filter(r => r.id_assessment === ass.id_assessment);
            
            if (tesKategoriIni.length > 0) {
                tesKategoriIni.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
                const m = tesKategoriIni[0].hasil_metrik || {};
                const sAkurasi = m["Akurasi"] ? m["Akurasi"].skor_1_10 : 0;
                const sKonsistensi = m["Konsistensi"] ? m["Konsistensi"].skor_1_10 : 0;
                radarData.push((sAkurasi + sKonsistensi) / 2);
            } else {
                radarData.push(0); 
            }
        });

        chartProgressRadar = new Chart(ctxRadar.getContext('2d'), {
            type: 'radar',
            data: {
                labels: radarLabels,
                datasets: [{
                    label: 'Skor Penguasaan Terkini',
                    data: radarData,
                    backgroundColor: 'rgba(76, 175, 80, 0.3)',
                    borderColor: '#4CAF50',
                    pointBackgroundColor: '#1E56A0',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                scales: { r: { suggestedMin: 0, suggestedMax: 10, ticks: { stepSize: 2 } } },
                plugins: { legend: { display: false } } 
            }
        });
    }

    // ===============================================
    // RENDER LINE CHART (Historis)
    // ===============================================
    if (ctxLine) {
        const rawDates = riwayatTarget.map(r => dayjs(r.tanggal).format('DD MMM'));
        const uniqueDates = [...new Set(rawDates)].sort((a, b) => dayjs(a, 'DD MMM').valueOf() - dayjs(b, 'DD MMM').valueOf());
        const lineColors = ['#1E56A0', '#4CAF50', '#F44336', '#FF9800', '#9C27B0'];

        const datasetsConfig = masterAss.map((ass, index) => {
            const dataPoints = uniqueDates.map(tglLabel => {
                const rekamJejak = riwayatTarget.filter(r => 
                    dayjs(r.tanggal).format('DD MMM') === tglLabel && r.id_assessment === ass.id_assessment
                );

                if (rekamJejak.length > 0) {
                    let totalGabungan = 0;
                    rekamJejak.forEach(rec => {
                        const m = rec.hasil_metrik || {};
                        const sAkurasi = m["Akurasi"] ? m["Akurasi"].skor_1_10 : 0;
                        const sKonsistensi = m["Konsistensi"] ? m["Konsistensi"].skor_1_10 : 0;
                        totalGabungan += (sAkurasi + sKonsistensi) / 2;
                    });
                    return (totalGabungan / rekamJejak.length).toFixed(1);
                } else {
                    return null;
                }
            });

            return {
                label: ass.nama.replace(' Assessment', ''),
                data: dataPoints,
                borderColor: lineColors[index % lineColors.length],
                backgroundColor: lineColors[index % lineColors.length] + '33',
                borderWidth: 2, tension: 0.4, spanGaps: true, pointRadius: 3
            };
        });

        chartProgressLine = new Chart(ctxLine.getContext('2d'), {
            type: 'line',
            data: { labels: uniqueDates, datasets: datasetsConfig },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { position: 'top', labels: { boxWidth: 8, font: { size: 10 } } } },
                scales: { y: { beginAtZero: true, max: 10 } }
            }
        });
    }
}

/* ==========================================================================
   2. SISTEM AUTENTIKASI (LOGIN, LOGOUT, RESET)
   ========================================================================== */
   function initAuth() {
    const formLogin = document.getElementById('login-form');
    const btnRegisterOpen = document.getElementById('btn-register'); // Tombol "Daftar Atlet Baru >"
    const btnCoachLoginBypass = document.getElementById('btn-login-pelatih'); // Tombol bypass lama
    const btnLogout = document.getElementById('btn-logout');
    const btnForgot = document.getElementById('btn-forgot-password');

    // Elemen DOM komponen Modal Registrasi Baru
    const modalReg = document.getElementById('modal-register');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const formRegAtlet = document.getElementById('form-reg-atlet');
    const formRegPelatih = document.getElementById('form-reg-pelatih');

    // ==========================================================================
    // ALUR LOGIKA OTENTIKASI LOGIN (SINKRON DATA TB_USERS)
    // ==========================================================================
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const userIn = document.getElementById('login-username').value.trim();
        const passIn = document.getElementById('login-password').value;
        
        // Ambil data database lokal pengguna keseluruhan
        const usersDB = JSON.parse(localStorage.getItem('tb_users')) || [];
        
        // Cari akun berdasarkan Username ATAU Email yang cocok dengan Password
        const userDitemukan = usersDB.find(u => 
            (u.username === userIn || u.email === userIn) && u.password === passIn
            );
        
        if (userDitemukan) {
            currentRole = userDitemukan.role;
            
            // Simpan informasi user aktif ke session memori
            
            localStorage.setItem('app_session', JSON.stringify({
            
                id_user: userDitemukan.id_user,
                role: userDitemukan.role,
                nama: userDitemukan.nama
            
            }));

            if (userDitemukan.role === 'atlet') {
                // Konfigurasi visual dashboard atlet, gunakan ID sesi dinamis
                //localStorage.setItem('akunAtlet', JSON.stringify(userDitemukan)); 
                navigateTo('view-athlete-home');
                setupAthleteMenu();
            } else if (userDitemukan.role === 'pelatih') {
                navigateTo('view-coach-home');
                setupCoachMenu();
            }
        } else {
            alert('⚠️ Login Gagal! Username/Email atau Password Anda salah.');
        }
    });

    // Ubah fungsi tombol bypass pelatih lama agar memberikan edukasi login terpadu
    if(btnCoachLoginBypass) {
        btnCoachLoginBypass.onclick = () => {
            alert("ℹ️ Akses langsung pelatih dinonaktifkan. Silakan login menggunakan akun pelatih resmi:\n\nUsername: coach_budi\nPassword: admin\n\nAtau buat akun pelatih baru melalui menu daftar.");
        };
    }

    // ==========================================================================
    // ALUR LOGIKA MANAJEMEN MODAL DAN TAB REGISTRASI
    // ==========================================================================
    
    // Buka Modal
    btnRegisterOpen.addEventListener('click', () => {
        modalReg.style.display = 'block';
    });

    // Tutup Modal via Tombol Silang
    btnCloseModal.addEventListener('click', () => {
        modalReg.style.display = 'none';
    });

    // Pindah Tab di Dalam Modal Registrasi
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const targetRole = btn.getAttribute('data-role');
            if(targetRole === 'atlet') {
                formRegAtlet.classList.add('active');
                formRegPelatih.classList.remove('active');
            } else {
                formRegPelatih.classList.add('active');
                formRegAtlet.classList.remove('active');
            }
        });
    });

    // PROSES SUBMIT REGISTRASI ATLET
    formRegAtlet.addEventListener('submit', (e) => {
        e.preventDefault();
        const usersDB = JSON.parse(localStorage.getItem('tb_users')) || [];
        
        const username = document.getElementById('reg-atl-username').value.trim();
        const email = document.getElementById('reg-atl-email').value.trim();

        // Validasi Duplikasi Akun
        if (usersDB.some(u => u.username === username || u.email === email)) {
            alert("⚠️ Gagal! Username atau Email sudah terdaftar di sistem.");
            return;
        }

        const newUser = {
            id_user: "ATL-" + Date.now(),
            role: "atlet",
            username: username,
            email: email,
            password: document.getElementById('reg-atl-password').value,
            nama: document.getElementById('reg-atl-nama').value,
            usia: parseInt(document.getElementById('reg-atl-usia').value),
            tinggi_cm: parseInt(document.getElementById('reg-atl-tinggi').value),
            lamaLatihan_bulan: 0,
            level: "Beginner 1", // Level default awal
            kelemahanUtama: "Belum Diidentifikasi",
            waktu_pendaftaran: new Date().toISOString() // Universal Timestamp
        };

        usersDB.push(newUser);
        localStorage.setItem('tb_users', JSON.stringify(usersDB));
        alert("🎉 Registrasi Atlet Berhasil! Silakan masuk menggunakan akun baru Anda.");
        formRegAtlet.reset();
        modalReg.style.display = 'none';
        keatas();
    });

    // PROSES SUBMIT REGISTRASI PELATIH
    formRegPelatih.addEventListener('submit', (e) => {
        e.preventDefault();
        const usersDB = JSON.parse(localStorage.getItem('tb_users')) || [];
        
        const username = document.getElementById('reg-plt-username').value.trim();
        const email = document.getElementById('reg-plt-email').value.trim();

        if (usersDB.some(u => u.username === username || u.email === email)) {
            alert("⚠️ Gagal! Username atau Email pelatih sudah terdaftar.");
            return;
        }

        const newUser = {
            id_user: "PLT-" + Date.now(),
            role: "pelatih",
            username: username,
            email: email,
            password: document.getElementById('reg-plt-password').value,
            nama: document.getElementById('reg-plt-nama').value,
            spesialisasi: document.getElementById('reg-plt-spesialisasi').value,
            waktu_pendaftaran: new Date().toISOString()
        };

        usersDB.push(newUser);
        localStorage.setItem('tb_users', JSON.stringify(usersDB));
        alert("🎉 Registrasi Pelatih Berhasil! Silakan gunakan akun Anda untuk masuk.");

        formRegPelatih.reset();
        modalReg.style.display = 'none';
        keatas();
    });

    // ==========================================================================
    // LOGOUT & FORGOT PASSWORD LOGIC
    // ==========================================================================
    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        currentRole = null;
        localStorage.setItem('app_session', JSON.stringify(null));
        
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        navigateTo('view-login');
        document.getElementById('dropdown-menu').classList.remove('show');
    });

    btnForgot.addEventListener('click', () => {
        const rootPass = prompt('Masukkan password master reset sistem:');
        if (rootPass === 'root') {
            localStorage.clear();
            alert('Sistem berhasil dibersihkan total ke kondisi default awal.');
            window.location.reload();
        } else if (rootPass !== null) {
            alert('Sandi salah!');
        }
    });
}

function setupAthleteMenu() {
    // Tampilkan semua menu atlet
    document.querySelectorAll('.menu-atlet').forEach(link => {
        link.style.display = 'block';
    });
    // Sembunyikan semua menu pelatih
    document.querySelectorAll('.menu-pelatih').forEach(link => {
        link.style.display = 'none';
    });
}

function setupCoachMenu() {
    // Tampilkan semua menu pelatih
    document.querySelectorAll('.menu-pelatih').forEach(link => {
        link.style.display = 'block';
    });
    // Sembunyikan semua menu atlet
    document.querySelectorAll('.menu-atlet').forEach(link => {
        link.style.display = 'none';
    });
}


/* ==========================================================================
   3. FITUR ATLET (HOME, LATIHAN, ASSESMENT)
   ========================================================================== */
  // --- FUNGSI BERANDA ATLET ---
  function renderAthleteHome() {
    const session = JSON.parse(localStorage.getItem('app_session'));
    if (!session) return;

    // Ambil data user spesifik dari tb_users
    const usersDB = JSON.parse(localStorage.getItem('tb_users')) || [];
    const akun = usersDB.find(u => u.id_user === session.id_user);

    document.getElementById('welcome-name').textContent = `Selamat datang, ${akun.nama}!`;
    document.getElementById('welcome-level').textContent = akun.level;
    
    const riwayatLatihan = JSON.parse(localStorage.getItem('tb_riwayat_latihan')) || [];
    const dataLatihan = JSON.parse(localStorage.getItem('tb_master_latihan')) || [];
    const hariIni = dayjs().format('YYYY-MM-DD');

    // Filter latihan hari ini HANYA untuk atlet yang sedang login
    const latihanHariIni = riwayatLatihan.filter(r => 
        r.user_id === session.id_user && r.tanggal.startsWith(hariIni)
        );
    
    const containerSummary = document.getElementById('today-drill-summary');

// ... kode bagian atas renderAthleteHome tetap sama ...

    if (latihanHariIni.length === 0) {
        containerSummary.innerHTML = '<p class="text-danger">Belum ada latihan yang diselesaikan hari ini.</p>';
    } else {
        containerSummary.innerHTML = `
        <p>✅ Hebat! Anda telah menyelesaikan <strong>${latihanHariIni.length}</strong> sesi latihan hari ini dari total ${dataLatihan.length} program yang tersedia.</p>
        `;
    }

    // GANTI BARIS INI:
    // renderChart('chart-athlete-home', 'Progress Teknik Mingguan');
    renderAthleteHomeChart(); // Memanggil fungsi grafik baru yang spesifik

}

// --- FUNGSI GRAFIK BERANDA ATLET (5 GARIS) ---
function renderAthleteHomeChart() {
    const ctxElem = document.getElementById('chart-athlete-home');
    if(!ctxElem) return;

    if(chartMingguan) chartMingguan.destroy();

    const session = JSON.parse(localStorage.getItem('app_session'));
    const riwayat = JSON.parse(localStorage.getItem('tb_riwayat_assessment')) || [];
    const masterAss = JSON.parse(localStorage.getItem('tb_master_assessment')) || [];
    
    // Tarik hanya data asesmen milik atlet ini
    const riwayatTarget = riwayat.filter(r => r.user_id === session.id_user);

    if (riwayatTarget.length === 0) {
        chartMingguan = new Chart(ctxElem.getContext('2d'), {
            type: 'line', data: { labels: ['Belum Ada Data'], datasets: [] },
            options: { responsive: true, scales: { y: { beginAtZero: true, max: 10 } } }
        });
        return;
    }

    // 1. Ambil tanggal unik (Gunakan YYYY-MM-DD agar sorting tidak bug/error)
    const rawDates = riwayatTarget.map(r => dayjs(r.tanggal).format('YYYY-MM-DD'));
    const uniqueDates = [...new Set(rawDates)].sort((a, b) => dayjs(a).valueOf() - dayjs(b).valueOf());
    
    // Format label sumbu X agar rapi di layar HP (DD MMM)
    const displayLabels = uniqueDates.map(d => dayjs(d).format('DD MMM'));

    const lineColors = ['#1E56A0', '#4CAF50', '#F44336', '#FF9800', '#9C27B0'];

    // 2. Susun data untuk 5 kategori
    const datasetsConfig = masterAss.map((ass, index) => {
        const dataPoints = uniqueDates.map(tglLabel => {
            const rekamJejak = riwayatTarget.filter(r => 
                dayjs(r.tanggal).format('YYYY-MM-DD') === tglLabel && r.id_assessment === ass.id_assessment
            );

            // Jika hari itu ada tes (termasuk tes berulang untuk debugging), ambil rata-ratanya
            if (rekamJejak.length > 0) {
                let totalGabungan = 0;
                rekamJejak.forEach(rec => {
                    const m = rec.hasil_metrik || {};
                    const sAkurasi = m["Akurasi"] ? m["Akurasi"].skor_1_10 : 0;
                    const sKonsistensi = m["Konsistensi"] ? m["Konsistensi"].skor_1_10 : 0;
                    totalGabungan += (sAkurasi + sKonsistensi) / 2;
                });
                return (totalGabungan / rekamJejak.length).toFixed(1);
            } else {
                return null; // Putus garis jika kosong di hari tersebut
            }
        });

        return {
            label: ass.nama.replace(' Assessment', ''),
            data: dataPoints,
            borderColor: lineColors[index % lineColors.length],
            backgroundColor: lineColors[index % lineColors.length] + '33',
            borderWidth: 2, tension: 0.4, spanGaps: true, pointRadius: 3
        };
    });

    // 3. Eksekusi Render
    chartMingguan = new Chart(ctxElem.getContext('2d'), {
        type: 'line',
        data: { labels: displayLabels, datasets: datasetsConfig },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'top', labels: { boxWidth: 8, font: { size: 10 } } } },
            scales: { y: { beginAtZero: true, max: 10 } }
        }
    });
}

// --- FUNGSI RIWAYAT & PROGRESS ATLET ---
function renderAthleteProgress() {
    const session = JSON.parse(localStorage.getItem('app_session'));
    if (!session) return;

    const riwayatLatihan = JSON.parse(localStorage.getItem('tb_riwayat_latihan')) || [];
    const riwayatAssessment = JSON.parse(localStorage.getItem('tb_riwayat_assessment')) || [];
    const dataLatihan = JSON.parse(localStorage.getItem('tb_master_latihan')) || [];
    const dataAssessment = JSON.parse(localStorage.getItem('tb_master_assessment')) || [];

    const tbody = document.getElementById('tbody-athlete-history');
    tbody.innerHTML = '';

    let semuaRiwayat = [];

    // 1. Ambil & Format Data Latihan (Filter by user_id)
    riwayatLatihan.filter(r => r.user_id === session.id_user).forEach(r => {
        const latInfo = dataLatihan.find(l => l.id_latihan === r.id_latihan);
        semuaRiwayat.push({
            tanggal: r.tanggal,
            jenis: 'Latihan',
            nama: latInfo ? latInfo.nama : 'Tidak Dikenal',
            status: 'Selesai ✅',
            timestamp: new Date(r.tanggal).getTime()
        });
    });

    // 2. Ambil & Format Data Assesment (Filter by user_id)
    riwayatAssessment.filter(r => r.user_id === session.id_user).forEach(r => {
        const assInfo = dataAssessment.find(a => a.id_assessment === r.id_assessment);
        
        // Ekstrak struktur hasil_metrik baru (Nilai Aktual & Skor 1-10)
        let skorStrArr = [];
        for(const [namaMetrik, hasil] of Object.entries(r.hasil_metrik)) {
            skorStrArr.push(`${namaMetrik}: ${hasil.nilai_aktual} (Skor: ${hasil.skor_1_10})`);
        }
        const skorStr = skorStrArr.join('<br>');
        
        semuaRiwayat.push({
            tanggal: r.tanggal,
            jenis: 'Assesment',
            nama: assInfo ? assInfo.nama : 'Tidak Dikenal',
            status: skorStr,
            timestamp: new Date(r.tanggal).getTime()
        });
    });

    // Urutkan dari yang terbaru ke terlama
    semuaRiwayat.sort((a, b) => b.timestamp - a.timestamp);

    if (semuaRiwayat.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Belum ada riwayat aktivitas.</td></tr>';
    } else {
        semuaRiwayat.forEach(item => {
            const badgeColor = item.jenis === 'Assesment' ? '#1E56A0' : '#4CAF50';
            tbody.innerHTML += `
            <tr>
            <td style="white-space:nowrap; font-size: 0.85rem;">${dayjs(item.tanggal).format('DD MMM YYYY HH:mm')}</td>
            <td>
            <span style="background:${badgeColor}; color:white; padding:2px 6px; border-radius:4px; font-size:0.7rem;">${item.jenis}</span>
            <br><strong>${item.nama}</strong>
            </td>
            <td style="font-size: 0.85rem;">${item.status}</td>
            </tr>
            `;
        });
    }

    renderChart('chart-athlete-progress', 'Grafik Perkembangan Keseluruhan');
}
// --- FUNGSI DAFTAR LATIHAN ---
function renderTrainingList() {
    const dataLatihan = JSON.parse(localStorage.getItem('tb_master_latihan')) || [];
    const container = document.getElementById('training-checklist-container');
    container.innerHTML = ''; 
    
    dataLatihan.forEach(lat => {
        container.innerHTML += `
        <div class="form-group" style="display:flex; align-items:center; gap:10px; background:#FAFAFA; padding:10px; border-radius:8px; margin-bottom:10px;">
        <input type="checkbox" id="lat-${lat.id_latihan}" value="${lat.id_latihan}" class="check-latihan" style="width:20px; height:20px; cursor:pointer;">
        <label for="lat-${lat.id_latihan}" style="margin:0; cursor:pointer;"><strong>${lat.kategori}:</strong> ${lat.nama}</label>
        </div>
        `;
    });

    const btnFinish = document.getElementById('btn-finish-training');
    btnFinish.onclick = () => {
        const session = JSON.parse(localStorage.getItem('app_session'));
        const riwayat = JSON.parse(localStorage.getItem('tb_riwayat_latihan')) || [];
        const waktuSekarang = new Date().toISOString(); 
        
        let checkedCount = 0;
        document.querySelectorAll('.check-latihan:checked').forEach(cb => {
            riwayat.push({ 
                id_riwayat_lat: 'RLAT-' + Date.now() + Math.floor(Math.random()*100), 
                user_id: session.id_user,
                tanggal: waktuSekarang, 
                id_latihan: cb.value, 
                status_selesai: true,
                catatan_pelatih: ""
            });
            checkedCount++;
        });

        if(checkedCount > 0) {
            localStorage.setItem('tb_riwayat_latihan', JSON.stringify(riwayat));
            alert('Latihan hari ini berhasil disimpan! ✅');
            navigateTo('view-progress'); 
        } else {
            alert('⚠️ Centang minimal 1 latihan yang diselesaikan.');
        }
    };
}

// --- FUNGSI FORM ASSESMENT (Untuk Pelatih) ---
// --- VARIABEL STATE CONTROL UTK MODAL ASESMEN PELATIH ---
let selectedAthleteId = null;
let selectedAssessmentId = null;
let selectedAssessmentName = "";

function renderAssessmentForm() {
    // 1. Ambil data master pengguna global
    const usersDB = JSON.parse(localStorage.getItem('tb_users')) || [];
    const riwayatDB = JSON.parse(localStorage.getItem('tb_riwayat_assessment')) || [];
    
    // Filter khusus user yang berperan sebagai atlet
    const daftarAtlet = usersDB.filter(u => u.role === 'atlet');
    const tbody = document.getElementById('tbody-assessment-atlet-list');
    
    if(!tbody) return;
    tbody.innerHTML = '';

    if (daftarAtlet.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--danger); padding:20px;">Belum ada atlet yang terdaftar di dalam sistem.</td></tr>';
        return;
    }

    // Pemetaan nama ID asesmen agar tampilan rapi singkatan
    const mapNamaSingkat = {
        "ASS-01": "Forehand",
        "ASS-02": "Volley Forehand",
        "ASS-03": "Backhand",
        "ASS-04": "Volley Backhand",
        "ASS-05": "Service"
    };

    // 2. LOOPING CETAK TABEL ATLET
    daftarAtlet.forEach((atlet, index) => {
        // Ambil riwayat milik atlet ini untuk mencari data tes terbarunya
        const riwayatAtlet = riwayatDB.filter(r => r.user_id === atlet.id_user);
        let teksAsesmenTerbaru = '<span style="color:#aaa; font-style:italic;">Belum Tes</span>';

        if(riwayatAtlet.length > 0) {
            // Urutkan dari tanggal terbaru (Descending)
            riwayatAtlet.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
            const tesTerakhir = riwayatAtlet[0];
            const namaClean = mapNamaSingkat[tesTerakhir.id_assessment] || "Tes";
            const tglClean = dayjs(tesTerakhir.tanggal).format('DD/MM/YY');
            teksAsesmenTerbaru = `<strong>${namaClean}</strong> <span style="font-size:0.75rem; color:#666;">(${tglClean})</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td style="text-align:center; font-weight:600; color:#666;">${index + 1}</td>
        <td><strong>${atlet.nama}</strong><br><span style="font-size:0.75rem; color:var(--primary-blue); background:#E8EEF2; padding:1px 5px; border-radius:10px;">${atlet.level || 'Beginner 1'}</span></td>
        <td style="text-align:center; font-weight:600;">${atlet.lamaLatihan_bulan || 0} Bln</td>
        <td style="color:var(--danger); font-size:0.85rem; font-weight:500;">${atlet.kelemahanUtama || 'Belum Diidentifikasi'}</td>
        <td>${teksAsesmenTerbaru}</td>
        <td style="text-align:center;">
        <button class="btn-secondary btn-mulai-ass" data-id="${atlet.id_user}" style="padding:6px 10px; font-size:0.8rem; font-weight:bold; width:100%; border-radius:6px;">
        <i class="fas fa-clipboard-check"></i> Mulai Asesmen
        </button>
        </td>
        `;
        tbody.appendChild(tr);
    });

    // 3. PASANG EVENT LISTENER TOMBOL JALANKAN ASESMEN
    document.querySelectorAll('.btn-mulai-ass').forEach(btn => {
        btn.onclick = (e) => {
            const targetId = btn.getAttribute('data-id');
            const atletSelected = daftarAtlet.find(a => a.id_user === targetId);
            
            if (atletSelected) {
                selectedAthleteId = atletSelected.id_user;
                
                // Konfigurasi awal interface Modal 1
                document.getElementById('modal-ass-title-atlet').innerHTML = `<i class="fas fa-user"></i> Asesmen: <strong>${atletSelected.nama}</strong>`;
                document.getElementById('assessment-sub-menu-block').style.display = 'block';
                document.getElementById('assessment-form-block').style.display = 'none';
                document.getElementById('modal-assessment-process').style.display = 'block';
            }
        };
    });

    // Inisialisasi Kontroler Aksi di Dalam Modal (Hanya dipasang sekali)
    setupAssessmentModalActions();
}

// --- FUNGSI ASISTEN UNTUK PENGATURAN AKSI DI DALAM INTERFASE MODAL ASESMEN ---
function setupAssessmentModalActions() {
    const modal1 = document.getElementById('modal-assessment-process');
    const modal2 = document.getElementById('modal-assessment-evaluation');
    
    const blockSubMenu = document.getElementById('assessment-sub-menu-block');
    const blockForm = document.getElementById('assessment-form-block');
    
    // Tombol Tutup Modal 1
    document.getElementById('btn-close-ass-modal').onclick = () => {
        modal1.style.display = 'none';
    };

    // Tombol Pilih Sub-Kategori Pukulan
    document.querySelectorAll('.btn-sub-ass').forEach(btn => {
        btn.onclick = () => {
            selectedAssessmentId = btn.getAttribute('data-id');
            selectedAssessmentName = btn.textContent.trim();

            document.getElementById('selected-sub-title').innerHTML = `<i class="fas fa-bullseye"></i> Modul: ${selectedAssessmentName}`;
            blockSubMenu.style.display = 'none';
            blockForm.style.display = 'block';

            // Reset field input nilai form
            document.getElementById('form-input-nilai-real').reset();
        };
    });

    // Tombol Kembali dari Form ke Menu Sub-Kategori
    document.getElementById('btn-back-to-sub').onclick = () => {
        blockForm.style.display = 'none';
        blockSubMenu.style.display = 'block';
    };

    // SUBMIT FORM DATA INDIKATOR (AKURASI & KONSISTENSI)
    const formNilaiReal = document.getElementById('form-input-nilai-real');
    formNilaiReal.onsubmit = (e) => {
        e.preventDefault();
        
        const riwayatDB = JSON.parse(localStorage.getItem('tb_riwayat_assessment')) || [];

        // ... (di dalam event submit asesmen)
        const session = JSON.parse(localStorage.getItem('app_session')); // Ambil sesi pelatih
        
        const newRecord = {
            id_riwayat_ass: 'RASS-' + Date.now() + Math.floor(Math.random() * 100),
            user_id: selectedAthleteId,
            id_pelatih: session.id_user,       // <--- TAMBAHAN VALIDASI
            nama_pelatih: session.nama,        // <--- TAMBAHAN VALIDASI
            tanggal: new Date().toISOString(),
            id_assessment: selectedAssessmentId,
            // ... (lanjutan hasil_metrik dan catatan_pelatih seperti sebelumnya)

            hasil_metrik: {
                "Akurasi": {
                    //nilai_aktual: parseFloat(document.getElementById('ass-input-akurasi-aktual').value),
                    skor_1_10: parseInt(document.getElementById('ass-input-akurasi-skor').value)
                },
                "Konsistensi": {
                    //nilai_aktual: parseFloat(document.getElementById('ass-input-konsistensi-aktual').value),
                    skor_1_10: parseInt(document.getElementById('ass-input-konsistensi-skor').value)
                }
            },
            catatan_pelatih: document.getElementById('ass-input-catatan').value.trim()
        };

        riwayatDB.push(newRecord);
        localStorage.setItem('tb_riwayat_assessment', JSON.stringify(riwayatDB));

        // Tutup Modal Proses 1, Pindah buka Modal Evaluasi Status 2
        modal1.style.display = 'none';
        
        const usersDB = JSON.parse(localStorage.getItem('tb_users')) || [];
        const atletActive = usersDB.find(u => u.id_user === selectedAthleteId);

        if(atletActive) {
            document.getElementById('eval-status-nama').value = atletActive.nama;
            document.getElementById('eval-status-level').value = atletActive.level || 'Beginner 1';
            document.getElementById('eval-status-kekurangan').value = atletActive.kelemahanUtama || '';
            modal2.style.display = 'block';
        }
    };

    // SIMPAN AKHIR MODAL EVALUASI (UPDATE LEVEL & KEKURANGAN UTAMA DI TB_USERS)
    document.getElementById('btn-submit-final-evaluation').onclick = () => {
        const usersDB = JSON.parse(localStorage.getItem('tb_users')) || [];
        const atletIndex = usersDB.findIndex(u => u.id_user === selectedAthleteId);

        if (atletIndex !== -1) {
            // Update langsung data master atlet di database lokal
            usersDB[atletIndex].level = document.getElementById('eval-status-level').value;
            usersDB[atletIndex].kelemahanUtama = document.getElementById('eval-status-kekurangan').value.trim() || 'Tidak Ada';

            localStorage.setItem('tb_users', JSON.stringify(usersDB));
            alert('🎉 Sukses! Evaluasi berkala serta status profil kemajuan atlet berhasil diperbarui.');
            
            modal2.style.display = 'none';
            renderAssessmentForm(); // Refresh isi tabel utama agar status terbarunya langsung muncul
        }
    };
}

/* ==========================================================================
   4. FITUR PELATIH (DASHBOARD & EXPORT EXCEL)
   ========================================================================== */
/* ==========================================================================
   FITUR PELATIH (DASHBOARD MULTIUSER & GRAFIK)
   ========================================================================== */
   function renderCoachHome() {
    // 1. Ambil seluruh data pengguna dari tabel multiuser
    const usersDB = JSON.parse(localStorage.getItem('tb_users')) || [];
    
    // 2. Filter hanya akun yang berstatus 'atlet'
    const daftarAtlet = usersDB.filter(u => u.role === 'atlet');

    const selectAtlet = document.getElementById('select-atlet');
    const infoContainer = document.getElementById('coach-atlet-info');

    // Kosongkan kontainer UI sebelum diisi ulang
    if(selectAtlet) selectAtlet.innerHTML = '';
    if(infoContainer) infoContainer.innerHTML = '';

    // Jika belum ada atlet yang mendaftar
    if (daftarAtlet.length === 0) {
        if(infoContainer) infoContainer.innerHTML = '<p class="text-danger" style="text-align:center;">Belum ada atlet terdaftar di sistem.</p>';
        renderCoachChart(null);
        return;
    }

    // 3. Masukkan daftar atlet ke dalam Dropdown
    daftarAtlet.forEach(atlet => {
        const option = document.createElement('option');
        option.value = atlet.id_user;
        option.textContent = atlet.nama;
        selectAtlet.appendChild(option);
    });

    // 4. Render data default (Atlet urutan pertama) saat halaman dimuat
    renderAtletInfo(daftarAtlet[0]);
    renderCoachChart(daftarAtlet[0].id_user); 

    // 5. Event listener saat Pelatih mengganti pilihan atlet di dropdown
    selectAtlet.onchange = (e) => {
        const selectedId = e.target.value;
        const selectedAtlet = daftarAtlet.find(a => a.id_user === selectedId);
        
        if (selectedAtlet) {
            renderAtletInfo(selectedAtlet);     
            renderCoachChart(selectedId);       
        }
    };
}

// Fungsi pembantu untuk mencetak info biodata atlet
function renderAtletInfo(atlet) {
    const infoContainer = document.getElementById('coach-atlet-info');
    if(!infoContainer) return;
    
    infoContainer.innerHTML = `
    <p><strong>Nama:</strong> ${atlet.nama}</p>
    <p><strong>Usia / Tinggi:</strong> ${atlet.usia} Tahun / ${atlet.tinggi_cm} cm</p>
    <p><strong>Level:</strong> <span class="badge">${atlet.level || 'Beginner 1'}</span></p>
    <p><strong>Kelemahan Utama:</strong> <span class="text-danger">${atlet.kelemahanUtama || 'Belum diidentifikasi'}</span></p>
    `;
}

// Fungsi khusus membuat grafik berdasarkan riwayat assesment atlet yang dipilih
// --- FUNGSI KHUSUS GRAFIK PELATIH (5 GARIS INDIKATOR) ---
// --- FUNGSI KHUSUS GRAFIK PELATIH (LINE & RADAR) ---
function renderCoachChart(targetUserId) {
    const ctxLine = document.getElementById('chart-coach-atlet-progress');
    const ctxRadar = document.getElementById('chart-coach-radar');
    
    // Hancurkan chart lama agar tidak bertumpuk
    if(chartMingguan) chartMingguan.destroy();
    if(chartRadar) chartRadar.destroy();

    if(!ctxLine || !ctxRadar) return;

    const riwayat = JSON.parse(localStorage.getItem('tb_riwayat_assessment')) || [];
    const masterAss = JSON.parse(localStorage.getItem('tb_master_assessment')) || [];
    
    // Filter riwayat HANYA milik atlet yang dipilih
    const riwayatTarget = targetUserId ? riwayat.filter(r => r.user_id === targetUserId) : [];

    // Jika belum ada data sama sekali
    if (riwayatTarget.length === 0) {
        chartMingguan = new Chart(ctxLine.getContext('2d'), {
            type: 'line', data: { labels: ['Belum Ada Data'], datasets: [] }
        });
        chartRadar = new Chart(ctxRadar.getContext('2d'), {
            type: 'radar', data: { labels: ['Kosong'], datasets: [] }
        });
        return;
    }

    // ====================================================================
    // BAGIAN 1: KALKULASI GRAFIK LABA-LABA (RADAR) - NILAI TERBARU
    // ====================================================================
    const radarLabels = [];
    const radarData = [];

    masterAss.forEach(ass => {
        // Ambil nama pukulan tanpa kata "Assessment"
        radarLabels.push(ass.nama.replace(' Assessment', ''));

        // Cari riwayat khusus untuk tes ini
        const tesKategoriIni = riwayatTarget.filter(r => r.id_assessment === ass.id_assessment);
        
        if (tesKategoriIni.length > 0) {
            // Urutkan dan ambil yang PALING BARU (Index 0)
            tesKategoriIni.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
            const tesTerbaru = tesKategoriIni[0];
            
            // Ekstrak skor
            const m = tesTerbaru.hasil_metrik || {};
            const skorAkurasi = m["Akurasi"] ? m["Akurasi"].skor_1_10 : 0;
            const skorKonsistensi = m["Konsistensi"] ? m["Konsistensi"].skor_1_10 : 0;
            
            radarData.push((skorAkurasi + skorKonsistensi) / 2);
        } else {
            radarData.push(0); // Jika belum pernah dites, nilainya 0
        }
    });

    chartRadar = new Chart(ctxRadar.getContext('2d'), {
        type: 'radar',
        data: {
            labels: radarLabels,
            datasets: [{
                label: 'Skor Penguasaan Terkini',
                data: radarData,
                backgroundColor: 'rgba(76, 175, 80, 0.3)', // Hijau Lapangan transparan
                borderColor: '#4CAF50',
                pointBackgroundColor: '#1E56A0', // Titik Biru
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#1E56A0',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    angleLines: { display: true, color: 'rgba(0,0,0,0.1)' },
                    suggestedMin: 0,
                    suggestedMax: 10,
                    ticks: { stepSize: 2, backdropColor: 'transparent' }
                }
            },
            plugins: { legend: { display: false } } // Legend disembunyikan agar rapi
        }
    });

    // ====================================================================
    // BAGIAN 2: KALKULASI GRAFIK GARIS (LINE) - HISTORIS PERKEMBANGAN
    // ====================================================================
    const rawDates = riwayatTarget.map(r => dayjs(r.tanggal).format('DD MMM'));
    const uniqueDates = [...new Set(rawDates)].sort((a, b) => dayjs(a, 'DD MMM').valueOf() - dayjs(b, 'DD MMM').valueOf());

    const lineColors = ['#1E56A0', '#4CAF50', '#F44336', '#FF9800', '#9C27B0'];

    const datasetsConfig = masterAss.map((ass, index) => {
        const dataPoints = uniqueDates.map(tglLabel => {
            const rekamJejak = riwayatTarget.filter(r => 
                dayjs(r.tanggal).format('DD MMM') === tglLabel && r.id_assessment === ass.id_assessment
                );

            if (rekamJejak.length > 0) {
                let totalGabungan = 0;
                rekamJejak.forEach(rec => {
                    const m = rec.hasil_metrik || {};
                    const sAkurasi = m["Akurasi"] ? m["Akurasi"].skor_1_10 : 0;
                    const sKonsistensi = m["Konsistensi"] ? m["Konsistensi"].skor_1_10 : 0;
                    totalGabungan += (sAkurasi + sKonsistensi) / 2;
                });
                return (totalGabungan / rekamJejak.length).toFixed(1);
            } else {
                return null;
            }
        });

        return {
            label: ass.nama.replace(' Assessment', ''),
            data: dataPoints,
            borderColor: lineColors[index % lineColors.length],
            backgroundColor: lineColors[index % lineColors.length] + '33',
            borderWidth: 2, tension: 0.4, spanGaps: true, pointRadius: 3
        };
    });

    chartMingguan = new Chart(ctxLine.getContext('2d'), {
        type: 'line',
        data: { labels: uniqueDates, datasets: datasetsConfig },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', labels: { boxWidth: 8, font: { size: 10 } } }
            },
            scales: { y: { beginAtZero: true, max: 10 } }
        }
    });
}


/* ==========================================================================
   5. HELPER: CHART.JS & THREE.JS
   ========================================================================== */
   
   // --- FUNGSI MENGAMBIL DATA AKTUAL UNTUK GRAFIK ---

   function renderChart(canvasId, title) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Hancurkan chart lama jika ada agar tidak tumpang tindih
    if(chartMingguan) chartMingguan.destroy();

    // 1. Ambil data aktual dari database lokal
    const realData = getChartDataFromAssessment();

    // 2. Render chart dengan data tersebut
    chartMingguan = new Chart(ctx, {
        type: 'line',
        data: {
            labels: realData.labels, // Sumbu X: Tanggal dari Assessment
            datasets: [{
                label: title,
                data: realData.data, // Sumbu Y: Rata-rata Skor
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                tension: 0.3, // Membuat garis melengkung halus
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: { 
                y: { 
                    beginAtZero: true, 
                    max: 10 // Skala maksimal nilai adalah 10
                } 
            }
        }
    });
}

// --- FUNGSI PENGAMBIL DATA CHART ---
function getChartDataFromAssessment() {
    const session = JSON.parse(localStorage.getItem('app_session'));
    const riwayat = JSON.parse(localStorage.getItem('tb_riwayat_assessment')) || [];
    
    // Filter HANYA data milik user yang sedang aktif
    const riwayatUser = riwayat.filter(r => r.user_id === session.id_user);

    if(riwayatUser.length === 0) {
        return { labels: ['Belum Ada Data'], data: [0] };
    }

    const groupedData = {};
    riwayatUser.forEach(r => {
        const tgl = dayjs(r.tanggal).format('DD MMM');
        if (!groupedData[tgl]) groupedData[tgl] = [];
        
        // Ambil nilai properti skor_1_10 dari objek bersarang
        const nilaiSkor = Object.values(r.hasil_metrik).map(m => m.skor_1_10);
        const rataRata = nilaiSkor.reduce((a, b) => a + b, 0) / nilaiSkor.length;
        
        groupedData[tgl].push(rataRata);
    });

    const labels = Object.keys(groupedData).sort((a,b) => dayjs(a).valueOf() - dayjs(b).valueOf());
    const data = labels.map(tgl => {
        const kumpulanSkor = groupedData[tgl];
        const avgHarian = kumpulanSkor.reduce((a, b) => a + b, 0) / kumpulanSkor.length;
        return avgHarian.toFixed(1); 
    });

    return { labels: labels, data: data };
}

// --- FUNGSI PENGATURAN AKUN ---
// --- FUNGSI PENGATURAN AKUN (MULTI-ROLE) ---
function renderAccountForm() {
    const session = JSON.parse(localStorage.getItem('app_session'));
    const usersDB = JSON.parse(localStorage.getItem('tb_users')) || [];
    
    // Cari index user aktif di database
    const userIndex = usersDB.findIndex(u => u.id_user === session.id_user);
    if(userIndex === -1) return;

    const akun = usersDB[userIndex];
    
    // Referensi Form DOM
    const formAtlet = document.getElementById('account-form');
    const formPelatih = document.getElementById('account-form-pelatih');

    // ==========================================
    // LOGIKA RENDER UNTUK ATLET
    // ==========================================
    if (session.role === 'atlet') {
        if(formPelatih) formPelatih.style.display = 'none';
        if(formAtlet) formAtlet.style.display = 'block';

        // Isi form dengan data atlet
        document.getElementById('acc-nama').value = akun.nama || '';
        document.getElementById('acc-username').value = akun.username || '';
        document.getElementById('acc-password').value = akun.password || '';
        document.getElementById('acc-usia').value = akun.usia || '';
        document.getElementById('acc-tinggi').value = akun.tinggi_cm || '';
        document.getElementById('acc-lama').value = akun.lamaLatihan_bulan || '';
        document.getElementById('acc-level').value = akun.level || 'Beginner 1';
        document.getElementById('acc-kelemahan').value = akun.kelemahanUtama || '';

        // Handle Simpan Atlet
        const btnSave = document.getElementById('btn-save-account');
        btnSave.onclick = () => {
            akun.nama = document.getElementById('acc-nama').value;
            akun.username = document.getElementById('acc-username').value;
            akun.password = document.getElementById('acc-password').value;
            akun.usia = parseInt(document.getElementById('acc-usia').value) || 0;
            akun.tinggi_cm = parseInt(document.getElementById('acc-tinggi').value) || 0;
            akun.lamaLatihan_bulan = parseInt(document.getElementById('acc-lama').value) || 0;
            akun.level = document.getElementById('acc-level').value;
            akun.kelemahanUtama = document.getElementById('acc-kelemahan').value;

            updateUserData(usersDB, userIndex, akun, session);
            keatas();
            navigateTo('view-athlete-home');
        };
    } 
    // ==========================================
    // LOGIKA RENDER UNTUK PELATIH
    // ==========================================
    else if (session.role === 'pelatih') {
        if(formAtlet) formAtlet.style.display = 'none';
        if(formPelatih) formPelatih.style.display = 'block';

        // Isi form dengan data pelatih
        document.getElementById('acc-plt-nama').value = akun.nama || '';
        document.getElementById('acc-plt-email').value = akun.email || '';
        document.getElementById('acc-plt-username').value = akun.username || '';
        document.getElementById('acc-plt-password').value = akun.password || '';
        document.getElementById('acc-plt-spesialisasi').value = akun.spesialisasi || 'Teknik Dasar';

        // Handle Simpan Pelatih
        const btnSavePlt = document.getElementById('btn-save-account-plt');
        btnSavePlt.onclick = () => {
            akun.nama = document.getElementById('acc-plt-nama').value;
            akun.email = document.getElementById('acc-plt-email').value;
            akun.username = document.getElementById('acc-plt-username').value;
            akun.password = document.getElementById('acc-plt-password').value;
            akun.spesialisasi = document.getElementById('acc-plt-spesialisasi').value;

            updateUserData(usersDB, userIndex, akun, session);
            // Tambahkan kode ini untuk mengalihkan ke beranda pelatih
            navigateTo('view-coach-home');
        };
    }
}

// Fungsi Helper untuk melakukan penyimpanan data (Mencegah pengulangan kode)
function updateUserData(usersDB, userIndex, updatedAkun, session) {
    // 1. Simpan ke tabel master
    usersDB[userIndex] = updatedAkun;
    localStorage.setItem('tb_users', JSON.stringify(usersDB));
    
    // 2. Update data session jika nama diubah
    session.nama = updatedAkun.nama;
    localStorage.setItem('app_session', JSON.stringify(session));

    alert('✅ Profil berhasil diperbarui!');
    
    // 3. Update nama di Beranda jika elemen sapaan tersedia di layar
    if(document.getElementById('welcome-name')) {
        document.getElementById('welcome-name').textContent = `Selamat datang, ${updatedAkun.nama}!`;
    }
    if(document.getElementById('welcome-level') && updatedAkun.level) {
        document.getElementById('welcome-level').textContent = updatedAkun.level;
    }

}



// --- FUNGSI PENGATURAN AKUN ---


/* ==========================================================================
   FITUR MATERI & ANIMASI 3D
   ========================================================================== */
/* ==========================================================================
   FITUR MATERI & ANIMASI 3D (UX Diperbarui)
   ========================================================================== */
   function renderMaterial3D() {
    const dataMateri =  materi_json; // JSON.parse(localStorage.getItem('dataMateri')) || [];
    
    // Ambil elemen DOM
    const listView = document.getElementById('materi-list-view');
    const detailView = document.getElementById('materi-detail-view');
    const containerButtons = document.getElementById('materi-buttons');
    const btnKembaliList = document.querySelectorAll('.btn-kembali');

    // RESET STATE: Tampilkan List, Sembunyikan Detail saat menu diakses dari Navigasi
    listView.style.display = 'block';
    detailView.style.display = 'none';
    containerButtons.innerHTML = ''; // Bersihkan tombol lama

    if (dataMateri.length === 0) {
        containerButtons.innerHTML = '<p class="text-danger">Data materi belum tersedia.</p>';
        return;
    }

    // FUNGSI TOMBOL KEMBALI
    btnKembaliList.forEach(btn => {
        btn.onclick = () => {
            detailView.style.display = 'none';
            listView.style.display = 'block';
            if (materi3DViewer) materi3DViewer.stop(); // Hentikan render loop
            
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll otomatis ke atas
        };
    });


    // Jika viewer belum ada, inisialisasi HANYA SEKALI
    if (!materi3DViewer) {
        materi3DViewer = new Viewer3D('canvas-3d');
        setup3DButtons(); // Pasang event listener tombol kontrol
    }


    // RENDER TOMBOL DAFTAR MATERI
    dataMateri.forEach(materi => {
        const btn = document.createElement('button');
        
        // Styling langsung via JS agar terlihat seperti card menu yang bisa diklik
        btn.style.width = '100%';
        btn.style.textAlign = 'left';
        btn.style.padding = '15px';
        btn.style.backgroundColor = 'var(--white)';
        btn.style.color = 'var(--dark-text)';
        btn.style.border = '1px solid var(--border-color)';
        btn.style.borderRadius = '10px';
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
        
        // Desain isi tombol: Ikon, Judul, dan tanda panah ">"
        btn.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
        <i class="fas fa-cube" style="color: var(--primary-blue); margin-right: 12px; font-size: 1.2rem;"></i> 
        <strong style="font-size: 1.05rem;">${materi.judul}</strong>
        </div>
        <i class="fas fa-chevron-right" style="color: #bbb;"></i>
        </div>
        `;

        // SAAT MATERI DIKLIK
        btn.onclick = () => {
            // 1. Ganti Tampilan: Sembunyikan List, Munculkan Detail
            listView.style.display = 'none';
            detailView.style.display = 'block';

            // 2. Isi konten Teks
            document.getElementById('materi-title').textContent = materi.judul;
            document.getElementById('materi-desc').textContent = materi.deskripsi;

            const stepsContainer = document.getElementById('materi-steps');
            stepsContainer.innerHTML = ''; 
            
            if (materi.langkah && materi.langkah.length > 0) {
                materi.langkah.forEach(langkah => {
                    const li = document.createElement('li');
                    li.textContent = langkah;
                    li.style.marginBottom = '8px';
                    stepsContainer.appendChild(li);
                });
            } else {
                stepsContainer.innerHTML = '<li>Tidak ada detail langkah.</li>';
            }

            // 3. PENTING UNTUK CANVAS 3D:
            // Elemen <canvas> sering mengalami "glitch" ukuran (gepeng/mengecil) jika dirender 
            // saat container induknya dalam status 'display: none'.
            // Karena kita baru mengubah display menjadi 'block', kita berikan trigger resize paksa
            // agar Three.js menyesuaikan ulang ukuran canvasnya.
            setTimeout(() => {
                materi3DViewer.resize();
            }, 50);

            // 4. Scroll ke atas otomatis
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // ========================================================
            // 5. MUAT MODEL 3D (BAGIAN INI SEBELUMNYA TERLEWAT)
            // ========================================================
            if (materi.model3D) {
                // Pastikan path ini sesuai dengan folder tempat Anda menyimpan file GLTF
                const pathFolder = "assets/models/"; 
                materi3DViewer.loadModel(pathFolder + materi.model3D);
            }
        };

        containerButtons.appendChild(btn);
    });
}

// Fungsi untuk menghubungkan tombol UI dengan logika Modul Viewer3D
function setup3DButtons() {
    const btnPlay = document.getElementById('btn-3d-play');
    const btnSlow = document.getElementById('btn-3d-slow');
    const btnReset = document.getElementById('btn-3d-reset');
    
    let isSlowMo = false;

    btnPlay.onclick = () => {
        const isPlaying = materi3DViewer.togglePlayPause();
        // Ganti ikon FontAwesome
        btnPlay.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    };

    btnSlow.onclick = () => {
        isSlowMo = !isSlowMo;
        materi3DViewer.setSlowMotion(isSlowMo);
        // Ubah warna/teks tombol sebagai indikator aktif
        btnSlow.style.backgroundColor = isSlowMo ? '#f44336' : ''; 
        btnSlow.style.color = isSlowMo ? 'white' : '';
    };

    btnReset.onclick = () => {
        materi3DViewer.resetCamera();
    };

    // Dengarkan event resize layar
    window.addEventListener('resize', () => {
        if (document.getElementById('materi-detail-view').style.display === 'block') {
            materi3DViewer.resize();
        }
    });
}

function keatas(){
    setTimeout(function(){
        console.log('naik')
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }, 1000)
}
