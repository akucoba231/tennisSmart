/* ==========================================================================
   TENNIS SMART TRAINING 3D - APP LOGIC
   ========================================================================== */

// --- STATE APLIKASI ---
let currentRole = null; // 'atlet' atau 'pelatih'
let chartMingguan = null; // Menyimpan instance Chart.js
let scene3D, camera3D, renderer3D; // Instance Three.js

// --- INISIALISASI SAAT HALAMAN DIMUAT ---
document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initAuth();
    initThreeJSBoilerplate();
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
   /*
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
        */
        
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
        if (viewId === 'view-progress') renderAthleteProgress(); // <--- TAMBAHKAN BARIS INI
        if (viewId === 'view-account') renderAccountForm();


    }
}

/* ==========================================================================
   2. SISTEM AUTENTIKASI (LOGIN, LOGOUT, RESET)
   ========================================================================== */
function initAuth() {
    const formLogin = document.getElementById('login-form');
    const btnCoachLogin = document.getElementById('btn-login-pelatih');
    const btnLogout = document.getElementById('btn-logout');
    const btnForgot = document.getElementById('btn-forgot-password');

    // Login Atlet
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const userIn = document.getElementById('login-username').value;
        const passIn = document.getElementById('login-password').value;
        
        const akunDB = JSON.parse(localStorage.getItem('akunAtlet'));
        
        if (userIn === akunDB.username && passIn === akunDB.password) {
            currentRole = 'atlet';
            navigateTo('view-athlete-home');
            setupAthleteMenu(); // Tampilkan menu atlet di dropdown
        } else {
            alert('Username atau Password salah!');
        }
    });

    // Login Pelatih (Bypass)
    btnCoachLogin.addEventListener('click', () => {
        currentRole = 'pelatih';
        navigateTo('view-coach-home');
        setupCoachMenu(); // Sembunyikan menu atlet di dropdown
    });

    // Logout
    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        currentRole = null;
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        navigateTo('view-login');
        document.getElementById('dropdown-menu').classList.remove('show');
    });

    // Lupa Password (Reset Root)
    btnForgot.addEventListener('click', () => {
        const rootPass = prompt('Masukkan password reset sistem:');
        if (rootPass === 'root') {
            const akunDB = JSON.parse(localStorage.getItem('akunAtlet'));
            akunDB.username = 'Atlet';
            akunDB.password = 'atlet';
            localStorage.setItem('akunAtlet', JSON.stringify(akunDB));
            alert('Akun berhasil di-reset ke Default (Username: Atlet, Password: atlet). Data latihan Anda tetap aman.');
        } else if (rootPass !== null) {
            alert('Password reset salah!');
        }
    });
}

function setupAthleteMenu() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.style.display = 'block'; // Tampilkan semua menu
    });
    // Arahkan 'Beranda' ke home atlet
    document.querySelector('.nav-link[data-target^="view-"]').setAttribute('data-target', 'view-athlete-home');
}

function setupCoachMenu() {
    document.querySelectorAll('.nav-link').forEach(link => {
        // Sembunyikan semua menu kecuali 'Beranda'
        if(link.textContent !== 'Beranda') link.style.display = 'none';
    });
    // Arahkan 'Beranda' ke home pelatih
    document.querySelector('.nav-link[data-target^="view-"]').setAttribute('data-target', 'view-coach-home');
}

/* ==========================================================================
   3. FITUR ATLET (HOME, LATIHAN, ASSESMENT)
   ========================================================================== */
   /*
function renderAthleteHome() {
    const akun = JSON.parse(localStorage.getItem('akunAtlet'));
    document.getElementById('welcome-name').textContent = `Selamat datang, ${akun.nama}!`;
    document.getElementById('welcome-level').textContent = akun.level;
    
    // Render Dummy Chart Mingguan (Chart.js)
    renderChart('chart-athlete-home', 'Progress Teknik Mingguan');
}
*/
function renderAthleteHome() {
    const akun = JSON.parse(localStorage.getItem('akunAtlet'));
    document.getElementById('welcome-name').textContent = `Selamat datang, ${akun.nama}!`;
    document.getElementById('welcome-level').textContent = akun.level;
    
    // --- MENGGANTI TULISAN "MEMUAT..." DENGAN DATA REAL ---
    const riwayatLatihan = JSON.parse(localStorage.getItem('riwayatLatihan')) || [];
    const dataLatihan = JSON.parse(localStorage.getItem('dataLatihan')) || [];
    const hariIni = dayjs().format('YYYY-MM-DD');

    // Filter latihan yang dikerjakan hari ini
    const latihanHariIni = riwayatLatihan.filter(r => r.tanggal === hariIni);
    const containerSummary = document.getElementById('today-drill-summary');

    if (latihanHariIni.length === 0) {
        containerSummary.innerHTML = '<p class="text-danger">Belum ada latihan yang diselesaikan hari ini.</p>';
    } else {
        containerSummary.innerHTML = `
            <p>✅ Hebat! Anda telah menyelesaikan <strong>${latihanHariIni.length}</strong> sesi latihan hari ini dari total ${dataLatihan.length} program yang tersedia.</p>
        `;
    }

    // Render Dummy Chart Mingguan (Chart.js)
    renderChart('chart-athlete-home', 'Progress Teknik Mingguan');
}

// --- FUNGSI BARU UNTUK MENAMPILKAN TABEL PROGRESS ATLET ---
function renderAthleteProgress() {
    const riwayatLatihan = JSON.parse(localStorage.getItem('riwayatLatihan')) || [];
    const riwayatAssessment = JSON.parse(localStorage.getItem('riwayatAssessment')) || [];
    const dataLatihan = JSON.parse(localStorage.getItem('dataLatihan')) || [];
    const dataAssessment = JSON.parse(localStorage.getItem('dataAssessment')) || [];

    const tbody = document.getElementById('tbody-athlete-history');
    tbody.innerHTML = '';

    let semuaRiwayat = [];

    // 1. Ambil & Format Data Latihan
    riwayatLatihan.forEach(r => {
        const latInfo = dataLatihan.find(l => l.id === r.id_latihan);
        semuaRiwayat.push({
            tanggal: r.tanggal,
            jenis: 'Latihan',
            nama: latInfo ? latInfo.nama : 'Tidak Dikenal',
            status: 'Selesai ✅',
            timestamp: new Date(r.tanggal).getTime() // Untuk sorting
        });
    });

    // 2. Ambil & Format Data Assesment
    riwayatAssessment.forEach(r => {
        const assInfo = dataAssessment.find(a => a.id === r.id_assessment);
        // Mengubah objek skor {Akurasi: 7, Konsistensi: 8} menjadi teks string
        const skorStr = Object.entries(r.skor).map(([k, v]) => `${k}: ${v}`).join('<br>');
        
        semuaRiwayat.push({
            tanggal: r.tanggal,
            jenis: 'Assesment',
            nama: assInfo ? assInfo.nama : 'Tidak Dikenal',
            status: skorStr,
            timestamp: new Date(r.tanggal).getTime() // Untuk sorting
        });
    });

    // Urutkan data dari yang paling baru ke yang paling lama
    semuaRiwayat.sort((a, b) => b.timestamp - a.timestamp);

    // Render ke tabel HTML
    if (semuaRiwayat.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Belum ada riwayat aktivitas.</td></tr>';
    } else {
        semuaRiwayat.forEach(item => {
            // Warnai badge sesuai jenis (Assessment biru, Latihan hijau)
            const badgeColor = item.jenis === 'Assesment' ? '#1E56A0' : '#4CAF50';
            
            tbody.innerHTML += `
                <tr>
                    <td style="white-space:nowrap;">${dayjs(item.tanggal).format('DD MMM YYYY')}</td>
                    <td>
                        <span style="background:${badgeColor}; color:white; padding:2px 6px; border-radius:4px; font-size:0.7rem;">${item.jenis}</span>
                        <br><strong>${item.nama}</strong>
                    </td>
                    <td>${item.status}</td>
                </tr>
            `;
        });
    }

    // Render Grafik di halaman Progress
    renderChart('chart-athlete-progress', 'Grafik Perkembangan Keseluruhan');

    // Aktifkan tombol Export Excel untuk Atlet
    const btnExport = document.getElementById('btn-export-athlete');
    if(btnExport) {
        btnExport.onclick = () => {
            const table = document.getElementById('table-athlete-history');
            const akun = JSON.parse(localStorage.getItem('akunAtlet'));
            const workbook = XLSX.utils.table_to_book(table, {sheet: "Riwayat Progress"});
            XLSX.writeFile(workbook, `Progress_${akun.nama.replace(/\s+/g, '_')}.xlsx`);
        };
    }
}

/*
function renderTrainingList() {
    const dataLatihan = JSON.parse(localStorage.getItem('dataLatihan'));
    const container = document.getElementById('training-checklist-container');
    container.innerHTML = ''; // Bersihkan kontainer
    
    dataLatihan.forEach(lat => {
        container.innerHTML += `
            <div class="form-group" style="display:flex; align-items:center; gap:10px; background:#FAFAFA; padding:10px; border-radius:8px;">
                <input type="checkbox" id="lat-${lat.id}" value="${lat.id}" style="width:20px; height:20px;">
                <label for="lat-${lat.id}" style="margin:0;"><strong>${lat.kategori}:</strong> ${lat.nama}</label>
            </div>
        `;
    });

    // Tombol Selesai Latihan
    document.getElementById('btn-finish-training').onclick = () => {
        const riwayat = JSON.parse(localStorage.getItem('riwayatLatihan')) || [];
        const hariIni = dayjs().format('YYYY-MM-DD'); // Menggunakan Day.js
        
        let checkedCount = 0;
        document.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
            riwayat.push({ id: 'RLAT-' + Date.now() + Math.floor(Math.random()*100), tanggal: hariIni, id_latihan: cb.value, status_selesai: true });
            checkedCount++;
        });

        if(checkedCount > 0) {
            localStorage.setItem('riwayatLatihan', JSON.stringify(riwayat));
            alert('Latihan hari ini berhasil disimpan!');
            navigateTo('view-progress'); // Lempar ke halaman progress
        } else {
            alert('Centang minimal 1 latihan yang diselesaikan.');
        }
    };
}

function renderAssessmentForm() {
    const dataAssessment = JSON.parse(localStorage.getItem('dataAssessment'));
    const container = document.getElementById('assessment-form-container');
    container.innerHTML = '';
    
    dataAssessment.forEach(ass => {
        let inputs = ass.metrik.map(m => `<input type="number" placeholder="Nilai ${m} (1-10)" id="val-${ass.id}-${m.replace(/\s+/g, '')}" min="1" max="10">`).join('');
        container.innerHTML += `
            <div class="card">
                <h4>${ass.nama}</h4>
                ${inputs}
            </div>
        `;
    });
}
*/

function renderTrainingList() {
    const dataLatihan = JSON.parse(localStorage.getItem('dataLatihan'));
    const container = document.getElementById('training-checklist-container');
    container.innerHTML = ''; // Bersihkan kontainer
    
    dataLatihan.forEach(lat => {
        container.innerHTML += `
            <div class="form-group" style="display:flex; align-items:center; gap:10px; background:#FAFAFA; padding:10px; border-radius:8px; margin-bottom:10px;">
                <input type="checkbox" id="lat-${lat.id}" value="${lat.id}" class="check-latihan" style="width:20px; height:20px; cursor:pointer;">
                <label for="lat-${lat.id}" style="margin:0; cursor:pointer;"><strong>${lat.kategori}:</strong> ${lat.nama}</label>
            </div>
        `;
    });

    // Menangani klik tombol Selesai Latihan
    const btnFinish = document.getElementById('btn-finish-training');
    btnFinish.onclick = () => {
        const riwayat = JSON.parse(localStorage.getItem('riwayatLatihan')) || [];
        const hariIni = dayjs().format('YYYY-MM-DD'); // Membutuhkan internet untuk meload Day.js
        
        let checkedCount = 0;
        // Ambil semua checkbox dengan class 'check-latihan' yang dicentang
        document.querySelectorAll('.check-latihan:checked').forEach(cb => {
            riwayat.push({ 
                id: 'RLAT-' + Date.now() + Math.floor(Math.random()*100), 
                tanggal: hariIni, 
                id_latihan: cb.value, 
                status_selesai: true 
            });
            checkedCount++;
        });

        if(checkedCount > 0) {
            localStorage.setItem('riwayatLatihan', JSON.stringify(riwayat));
            alert('Latihan hari ini berhasil disimpan! ✅');
            navigateTo('view-progress'); // Lempar ke halaman progress
        } else {
            alert('⚠️ Centang minimal 1 latihan yang diselesaikan.');
        }
    };
}

function renderAssessmentForm() {
    const dataAssessment = JSON.parse(localStorage.getItem('dataAssessment'));
    const container = document.getElementById('assessment-form-container');
    container.innerHTML = '';
    
    // Render form input berdasarkan JSON master
    dataAssessment.forEach(ass => {
        let inputs = ass.metrik.map(m => {
            const safeId = `val-${ass.id}-${m.replace(/\s+/g, '')}`;
            return `
                <div class="form-group" style="margin-bottom: 10px;">
                    <label style="font-size: 0.85rem; color: #555;">${m}</label>
                    <input type="number" id="${safeId}" placeholder="Nilai (1-10)" min="1" max="10" style="padding: 8px;">
                </div>
            `;
        }).join('');
        
        container.innerHTML += `
            <div class="card" style="margin-bottom: 15px;">
                <h4 style="margin-bottom: 10px;">${ass.nama}</h4>
                ${inputs}
            </div>
        `;
    });

    // Menangani klik tombol Simpan Assesment
    const btnSaveAssesment = document.getElementById('btn-save-assessment');
    btnSaveAssesment.onclick = () => {
        const riwayat = JSON.parse(localStorage.getItem('riwayatAssessment')) || [];
        const hariIni = dayjs().format('YYYY-MM-DD');
        let dataTersimpan = 0;

        dataAssessment.forEach(ass => {
            let skor = {};
            let isFilled = true;
            
            // Loop setiap metrik (Akurasi, Konsistensi, dll) untuk mengambil nilainya
            ass.metrik.forEach(m => {
                const safeId = `val-${ass.id}-${m.replace(/\s+/g, '')}`;
                const inputElement = document.getElementById(safeId);
                
                if (!inputElement.value) {
                    isFilled = false; // Jika ada 1 saja yang kosong, jangan simpan tes ini
                } else {
                    skor[m] = parseInt(inputElement.value);
                }
            });

            // Jika satu paket tes (misal Forehand Test) terisi semua metriknya, simpan!
            if (isFilled) {
                riwayat.push({
                    id: 'RASS-' + Date.now() + Math.floor(Math.random() * 1000),
                    tanggal: hariIni,
                    id_assessment: ass.id,
                    skor: skor
                });
                dataTersimpan++;
            }
        });

        if (dataTersimpan > 0) {
            localStorage.setItem('riwayatAssessment', JSON.stringify(riwayat));
            alert(`✅ Berhasil menyimpan ${dataTersimpan} data tes assesment!`);
            renderAssessmentForm(); // Kosongkan form kembali setelah disimpan
        } else {
            alert('⚠️ Mohon isi nilai dengan lengkap minimal pada satu tes assesment sebelum menyimpan.');
        }
    };
}

/* ==========================================================================
   4. FITUR PELATIH (DASHBOARD & EXPORT EXCEL)
   ========================================================================== */
function renderCoachHome() {
  
    const akun = JSON.parse(localStorage.getItem('akunAtlet'));
    const infoContainer = document.getElementById('coach-atlet-info');
    
    infoContainer.innerHTML = `
        <p><strong>Nama:</strong> ${akun.nama}</p>
        <p><strong>Usia / Tinggi:</strong> ${akun.usia} Tahun / ${akun.tinggi_cm} cm</p>
        <p><strong>Level:</strong> <span class="badge">${akun.level}</span></p>
        <p><strong>Kelemahan Utama:</strong> <span class="text-danger">${akun.kelemahanUtama}</span></p>
    `;

    // Render Tabel Riwayat Latihan
    const riwayat = JSON.parse(localStorage.getItem('riwayatLatihan')) || [];
    const dataLatihan = JSON.parse(localStorage.getItem('dataLatihan'));
    const tbody = document.getElementById('tbody-coach-history');
    tbody.innerHTML = '';

    if (riwayat.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">Belum ada data latihan.</td></tr>';
    } else {
        // Balikkan array agar data terbaru di atas
        riwayat.reverse().forEach(r => {
            // Cari nama latihan berdasarkan Foreign Key
            const latInfo = dataLatihan.find(l => l.id === r.id_latihan);
            const namaLatihan = latInfo ? latInfo.nama : 'Latihan Tidak Dikenal';
            
            tbody.innerHTML += `
                <tr>
                    <td>${dayjs(r.tanggal).format('DD MMM YYYY')}</td>
                    <td>${namaLatihan}</td>
                    <td>Selesai ✅</td>
                </tr>
            `;
        });
    }

    // Fitur Export to Excel menggunakan SheetJS
    /*
    document.getElementById('btn-export-excel').onclick = () => {
        const table = document.getElementById('table-coach-history');
        const workbook = XLSX.utils.table_to_book(table, {sheet: "Riwayat Atlet"});
        XLSX.writeFile(workbook, `Riwayat_${akun.nama.replace(/\s+/g, '_')}.xlsx`);
    };
    */
            // Fitur Export to Excel menggunakan SheetJS
        document.getElementById('btn-export-excel').onclick = () => {
            const table = document.getElementById('table-coach-history');
            const workbook = XLSX.utils.table_to_book(table, {sheet: "Riwayat Atlet"});
            const namaFile = `Riwayat_${akun.nama.replace(/\s+/g, '_')}.xlsx`;
            
            // Tambahkan parameter bookType secara eksplisit
            XLSX.writeFile(workbook, namaFile, { bookType: 'xlsx', type: 'binary' });
        };

} //end of coach

/* ==========================================================================
   5. HELPER: CHART.JS & THREE.JS
   ========================================================================== */
   
   // --- FUNGSI MENGAMBIL DATA AKTUAL UNTUK GRAFIK ---
function getChartDataFromAssessment() {
    const riwayat = JSON.parse(localStorage.getItem('riwayatAssessment')) || [];
    
    // Jika data kosong, kembalikan array default
    if(riwayat.length === 0) {
        return { labels: ['Belum Ada Data'], data: [0] };
    }

    // Kelompokkan skor berdasarkan tanggal
    const groupedData = {};
    riwayat.forEach(r => {
        const tgl = dayjs(r.tanggal).format('DD MMM');
        if (!groupedData[tgl]) groupedData[tgl] = [];
        
        // Ambil semua nilai angka dari objek skor (misal: Akurasi: 7, Konsistensi: 8)
        const nilaiSkor = Object.values(r.skor);
        // Hitung rata-rata skor pada tes tersebut
        const rataRata = nilaiSkor.reduce((a, b) => a + b, 0) / nilaiSkor.length;
        
        groupedData[tgl].push(rataRata);
    });

    // Siapkan array untuk sumbu X (Tanggal) dan sumbu Y (Skor)
    const labels = Object.keys(groupedData).sort((a,b) => dayjs(a).valueOf() - dayjs(b).valueOf());
    const data = labels.map(tgl => {
        const kumpulanSkor = groupedData[tgl];
        const avgHarian = kumpulanSkor.reduce((a, b) => a + b, 0) / kumpulanSkor.length;
        return avgHarian.toFixed(1); // Bulatkan 1 angka di belakang koma
    });

    return { labels: labels, data: data };
}

/*
function renderChart(canvasId, title) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Hancurkan chart lama jika ada agar tidak tumpang tindih
    if(chartMingguan) chartMingguan.destroy();

    // Data Dummy untuk presentasi visual (Nantinya difilter dari database)
    chartMingguan = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
            datasets: [{
                label: title,
                data: [5, 6, 6, 7, 8, 8, 9],
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, max: 10 } }
        }
    });
}
*/
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


function initThreeJSBoilerplate() {
    // Ini adalah kerangka dasar Three.js. 
    // Untuk me-load file .glb, Anda memerlukan Local Server (VSCode Live Server dll) karena batasan CORS browser.
    const canvas = document.getElementById('canvas-3d');
    if (!canvas) return;

    scene3D = new THREE.Scene();
    scene3D.background = new THREE.Color(0x2C3E50); // Warna latar gelap sesuai CSS

    camera3D = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera3D.position.z = 5;

    renderer3D = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer3D.setSize(canvas.clientWidth, canvas.clientHeight);

    // Tambahkan cahaya
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(2, 2, 5);
    scene3D.add(light);
    scene3D.add(new THREE.AmbientLight(0x404040));

    // Tambahkan objek dummy (Kubus) sebagai placeholder karena file .glb belum di-hosting
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
    const cube = new THREE.Mesh(geometry, material);
    scene3D.add(cube);

    // Animasi putar
    function animate() {
        requestAnimationFrame(animate);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer3D.render(scene3D, camera3D);
    }
    animate();

    // Responsif jika layar diubah ukurannya
    window.addEventListener('resize', () => {
        const wrapper = document.getElementById('canvas-container');
        if(wrapper) {
            camera3D.aspect = wrapper.clientWidth / wrapper.clientHeight;
            camera3D.updateProjectionMatrix();
            renderer3D.setSize(wrapper.clientWidth, wrapper.clientHeight);
        }
    });
}

// --- FUNGSI PENGATURAN AKUN ---
function renderAccountForm() {
    // 1. Ambil data saat ini dari database lokal
    const akun = JSON.parse(localStorage.getItem('akunAtlet'));
    
    // 2. Isi form dengan data yang ada
    document.getElementById('acc-nama').value = akun.nama || '';
    document.getElementById('acc-username').value = akun.username || '';
    document.getElementById('acc-password').value = akun.password || '';
    document.getElementById('acc-usia').value = akun.usia || '';
    document.getElementById('acc-tinggi').value = akun.tinggi_cm || '';
    document.getElementById('acc-lama').value = akun.lamaLatihan_bulan || '';
    document.getElementById('acc-level').value = akun.level || 'Beginner 1';
    document.getElementById('acc-kelemahan').value = akun.kelemahanUtama || '';

    // 3. Tangani saat tombol Simpan diklik
    const btnSave = document.getElementById('btn-save-account');
    btnSave.onclick = () => {
        // Perbarui objek akun dengan nilai baru dari form
        akun.nama = document.getElementById('acc-nama').value;
        akun.username = document.getElementById('acc-username').value;
        akun.password = document.getElementById('acc-password').value;
        akun.usia = parseInt(document.getElementById('acc-usia').value) || 0;
        akun.tinggi_cm = parseInt(document.getElementById('acc-tinggi').value) || 0;
        akun.lamaLatihan_bulan = parseInt(document.getElementById('acc-lama').value) || 0;
        akun.level = document.getElementById('acc-level').value;
        akun.kelemahanUtama = document.getElementById('acc-kelemahan').value;

        // Simpan kembali ke localStorage
        localStorage.setItem('akunAtlet', JSON.stringify(akun));
        alert('✅ Profil dan kredensial berhasil diperbarui!');
        
        // Perbarui juga nama di Homescreen agar langsung berubah
        if(document.getElementById('welcome-name')) {
            document.getElementById('welcome-name').textContent = `Selamat datang, ${akun.nama}!`;
            document.getElementById('welcome-level').textContent = akun.level;
        }
    };
}

