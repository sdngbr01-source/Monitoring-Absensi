// ===== GLOBAL VARIABLES =====
let currentUser = null;
let currentClass = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let students = [];
let attendanceData = [];
let isLoading = false;

// Class list
const classList = ['3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B'];
const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// Status mapping
const STATUS_MAP = {
    'Datang': 'present',
    'Pulang': 'present',
    'Terlambat': 'late',
    'Izin': 'permission',
    'Sakit': 'permission',
    'Alpha': 'absent'
};

// ===== DOM ELEMENTS =====
const loadingOverlay = document.getElementById('loadingOverlay');
const loginPage = document.getElementById('loginPage');
const dashboardPage = document.getElementById('dashboardPage');
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const togglePassword = document.getElementById('togglePassword');
const logoutBtn = document.getElementById('logoutBtn');
const sidebarToggle = document.getElementById('sidebarToggle');
const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
const classTabs = document.getElementById('classTabs');
const monthSelect = document.getElementById('monthSelect');
const downloadBtn = document.getElementById('downloadBtn');
const currentClassName = document.getElementById('currentClassName');
const totalStudents = document.getElementById('totalStudents');
const statsContainer = document.getElementById('statsContainer');
const attendanceTable = document.getElementById('attendanceTable');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const dataStatus = document.getElementById('dataStatus');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 Aplikasi Absensi Siswa Dimulai");
    initApp();
});

async function initApp() {
    try {
        // Tunggu Firebase siap
        await waitForFirebase(2000);
        
        // Cek login status
        const isLoggedIn = localStorage.getItem('attendanceAdminLoggedIn');
        
        if (isLoggedIn === 'true') {
            // Login berhasil
            showDashboard();
            initializeDashboard();
        } else {
            // Belum login
            showLogin();
            initializeLoginPage();
        }
        
    } catch (error) {
        console.error('Error inisialisasi:', error);
        showLogin();
        initializeLoginPage();
    }
}

// ===== UTILITY FUNCTIONS =====
function waitForFirebase(timeout = 2000) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        const checkInterval = setInterval(() => {
            if (window.firestoreDb !== undefined) {
                clearInterval(checkInterval);
                resolve();
                return;
            }
            
            if (Date.now() - startTime > timeout) {
                clearInterval(checkInterval);
                resolve();
                return;
            }
        }, 100);
    });
}

function showLoading(message = 'Memuat...') {
    if (loadingOverlay) {
        loadingOverlay.querySelector('p').textContent = message;
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

function showLogin() {
    if (loginPage) loginPage.style.display = 'block';
    if (dashboardPage) dashboardPage.style.display = 'none';
}

function showDashboard() {
    if (loginPage) loginPage.style.display = 'none';
    if (dashboardPage) dashboardPage.style.display = 'block';
}

function showError(message) {
    console.error('Error:', message);
    
    // Alert sederhana
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.maxWidth = '300px';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-circle me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

function updateDataStatus(status) {
    if (!dataStatus) return;
    
    const statusMap = {
        'memuat': { text: 'Memuat...', icon: 'fa-spinner fa-spin', color: 'bg-info text-white' },
        'tersambung': { text: 'Tersambung', icon: 'fa-check', color: 'bg-success text-white' },
        'data-kosong': { text: 'Belum ada absensi', icon: 'fa-database', color: 'bg-secondary text-white' }
    };
    
    const config = statusMap[status] || statusMap['memuat'];
    
    dataStatus.className = `badge ${config.color} border`;
    dataStatus.innerHTML = `<i class="fas ${config.icon} me-1"></i><span>${config.text}</span>`;
}

// ===== LOGIN FUNCTIONS =====
function initializeLoginPage() {
    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }
    
    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showError('Harap isi username dan password');
        return;
    }
    
    // Disable button
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Memproses...';
    }
    
    // Check credentials
    if (username === 'admin' && password === 'admin123') {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Set login state
        localStorage.setItem('attendanceAdminLoggedIn', 'true');
        
        // Reset button
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Masuk';
        }
        
        // Show dashboard
        showDashboard();
        initializeDashboard();
        
    } else {
        showError('Username atau password salah');
        
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Masuk';
        }
    }
}

// ===== DASHBOARD FUNCTIONS =====
function initializeDashboard() {
    // Initialize month selector
    initializeMonthSelector();
    
    // Initialize class tabs
    initializeClassTabs();
    
    // Event listeners
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (mobileSidebarToggle) mobileSidebarToggle.addEventListener('click', toggleMobileSidebar);
    if (monthSelect) monthSelect.addEventListener('change', handleMonthChange);
    if (downloadBtn) downloadBtn.addEventListener('click', handleDownload);
    
    // Load first class
    if (classList.length > 0) {
        selectClass(classList[0]);
    }
}

function initializeMonthSelector() {
    if (!monthSelect) return;
    
    monthSelect.innerHTML = '';
    
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth();
    
    for (let i = 0; i <= currentMonthIndex; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${months[i]} ${currentYear}`;
        option.selected = i === currentMonth;
        monthSelect.appendChild(option);
    }
}

function initializeClassTabs() {
    if (!classTabs) return;
    
    classTabs.innerHTML = '';
    
    classList.forEach(className => {
        const li = document.createElement('li');
        li.className = 'nav-item';
        
        const a = document.createElement('a');
        a.className = 'nav-link';
        a.href = '#';
        a.innerHTML = `<i class="fas fa-users me-2"></i><span>Kelas ${className}</span>`;
        
        a.addEventListener('click', (e) => {
            e.preventDefault();
            selectClass(className);
        });
        
        li.appendChild(a);
        classTabs.appendChild(li);
    });
}

async function selectClass(className) {
    if (isLoading) return;
    
    try {
        isLoading = true;
        showLoading('Memuat data kelas...');
        updateDataStatus('memuat');
        
        currentClass = className;
        
        // Update active tab
        document.querySelectorAll('#classTabs .nav-link').forEach(tab => {
            tab.classList.remove('active');
            if (tab.textContent.includes(className)) {
                tab.classList.add('active');
            }
        });
        
        // Update title
        if (currentClassName) {
            currentClassName.innerHTML = `<i class="fas fa-chalkboard-teacher me-2"></i>Kelas ${className}`;
        }
        
        // Load data
        await loadClassData(className);
        
        updateDataStatus('tersambung');
        hideLoading();
        
    } catch (error) {
        console.error('Error memuat kelas:', error);
        showError('Gagal memuat data kelas');
        updateDataStatus('data-kosong');
        hideLoading();
    } finally {
        isLoading = false;
    }
}

// ===== FIREBASE DATA FUNCTIONS =====
async function getStudentsByClass(className) {
    console.log(`📋 Mengambil siswa kelas ${className}...`);
    
    try {
        if (!window.firestoreDb) {
            throw new Error('Firestore tidak tersedia');
        }
        
        // AMBIL SEMUA DATA DULU - Hindari error index
        const snapshot = await window.firestoreDb.collection('students').get();
        
        if (snapshot.empty) {
            console.log('📭 Database siswa kosong');
            return [];
        }
        
        // Proses semua data
        const allStudents = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                uid: data.uid || '',
                name: data.name || '',
                kelas: data.kelas || '',
                nohp: data.nohp || ''
            };
        });
        
        // Filter berdasarkan kelas
        const students = allStudents.filter(student => student.kelas === className);
        
        // Urutkan berdasarkan nama
        students.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        
        console.log(`✅ Ditemukan ${students.length} siswa di kelas ${className}`);
        return students;
        
    } catch (error) {
        console.error('Error mengambil siswa:', error);
        
        // Jika ada error, tampilkan data dummy untuk testing
        console.log('⚠️ Menggunakan data dummy untuk preview');
        return generateDummyStudents(className);
    }
}

async function getAttendanceData(className, month, year) {
    console.log(`📋 Mengambil data kehadiran...`);
    
    try {
        if (!window.firestoreDb) {
            throw new Error('Firestore tidak tersedia');
        }
        
        const monthStr = (month + 1).toString().padStart(2, '0');
        const yearStr = year.toString();
        
        // Ambil semua data attendance
        const snapshot = await window.firestoreDb.collection('attendance').get();
        
        if (snapshot.empty) {
            console.log('📭 Database kehadiran kosong');
            return [];
        }
        
        // Proses data
        const allRecords = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                uid: data.uid || '',
                name: data.name || '',
                date: data.date || '',
                status: data.status || '',
                time: data.time || '',
                keterangan: data.keterangan || '',
                kelas: data.kelas || ''
            };
        });
        
        // Filter berdasarkan kelas dan bulan
        const filteredRecords = allRecords.filter(record => {
            if (record.kelas !== className) return false;
            if (!record.date) return false;
            
            const recordDate = record.date; // Format: "2026-01-17"
            return recordDate.startsWith(`${yearStr}-${monthStr}`);
        });
        
        console.log(`✅ Ditemukan ${filteredRecords.length} data kehadiran`);
        return filteredRecords;
        
    } catch (error) {
        console.error('Error mengambil kehadiran:', error);
        return [];
    }
}

function generateDummyStudents(className) {
    // Data dummy untuk preview jika database kosong
    const dummyNames = [
        'ADI SANTOSO', 'BUDI WIBOWO', 'CITRA PRATAMA', 'DWI KUSUMA',
        'ERNA HARTONO', 'FATHUR SUKMA', 'GITA WIDODO', 'HADI SURYANINGRAT',
        'INTAN PANGESTU', 'JOKO WIRAWAN', 'KARTIKA DEWI', 'LUKMAN HAKIM'
    ];
    
    const students = [];
    const studentCount = Math.floor(Math.random() * 5) + 10; // 10-15 siswa
    
    for (let i = 1; i <= studentCount; i++) {
        const name = dummyNames[Math.floor(Math.random() * dummyNames.length)];
        students.push({
            id: `dummy-${i}`,
            uid: `00${i.toString().padStart(6, '0')}`,
            name: name,
            kelas: className,
            nohp: `628${Math.floor(1000000000 + Math.random() * 9000000000)}`
        });
    }
    
    // Urutkan berdasarkan nama
    return students.sort((a, b) => a.name.localeCompare(b.name));
}

function processAttendanceData(records, students) {
    console.log(`🔄 Memproses data kehadiran...`);
    
    // Inisialisasi struktur data per siswa
    const attendanceByStudent = students.map(student => ({
        studentId: student.uid,
        studentName: student.name,
        studentPhone: student.nohp,
        attendance: {} // Akan diisi per tanggal
    }));
    
    // Kelompokkan data per siswa per tanggal
    records.forEach(record => {
        // Cari siswa berdasarkan UID
        const studentIndex = attendanceByStudent.findIndex(s => s.studentId === record.uid);
        
        if (studentIndex !== -1) {
            const dateStr = record.date;
            const status = STATUS_MAP[record.status] || 'present';
            
            // Simpan data jika belum ada untuk tanggal ini
            if (!attendanceByStudent[studentIndex].attendance[dateStr]) {
                attendanceByStudent[studentIndex].attendance[dateStr] = {
                    status: status,
                    time: record.time,
                    originalStatus: record.status,
                    keterangan: record.keterangan
                };
            }
        }
    });
    
    console.log(`✅ Data diproses untuk ${attendanceByStudent.length} siswa`);
    return attendanceByStudent;
}

// ===== LOAD CLASS DATA =====
async function loadClassData(className) {
    try {
        // Reset data
        students = [];
        attendanceData = [];
        
        // 1. Load siswa dari Firebase
        students = await getStudentsByClass(className);
        
        if (students.length === 0) {
            showNoDataMessage('Tidak ada data siswa di database');
            return;
        }
        
        // 2. Load data kehadiran
        const attendanceRecords = await getAttendanceData(className, currentMonth, currentYear);
        
        // 3. Proses data kehadiran
        if (attendanceRecords.length > 0) {
            attendanceData = processAttendanceData(attendanceRecords, students);
        } else {
            // Jika tidak ada data kehadiran, buat struktur kosong
            attendanceData = students.map(student => ({
                studentId: student.uid,
                studentName: student.name,
                studentPhone: student.nohp,
                attendance: {} // Kosong karena belum absen
            }));
        }
        
        // 4. Update UI
        updateStats();
        updateAttendanceTable();
        
        // Update total siswa
        if (totalStudents) {
            totalStudents.textContent = `${students.length} siswa`;
        }
        
    } catch (error) {
        console.error('Error loading class data:', error);
        throw error;
    }
}

// ===== UI UPDATE FUNCTIONS =====
function showNoDataMessage(message) {
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    ${message}
                </div>
            </div>
        `;
    }
    
    if (attendanceTable) {
        attendanceTable.innerHTML = `
            <tr>
                <td colspan="35" class="text-center py-5">
                    <div class="text-muted">
                        <i class="fas fa-users fa-2x mb-3"></i>
                        <p>${message}</p>
                    </div>
                </td>
            </tr>
        `;
    }
    
    if (totalStudents) {
        totalStudents.textContent = '0 siswa';
    }
}

function updateStats() {
    if (!students.length || !statsContainer) {
        return;
    }
    
    // Tampilkan statistik sederhana
    statsContainer.innerHTML = `
        <div class="col-md-4">
            <div class="card best-student">
                <div class="card-body text-center">
                    <i class="fas fa-users text-primary"></i>
                    <h5 class="card-title mt-2">${students.length}</h5>
                    <p class="card-text text-muted">Total Siswa</p>
                </div>
            </div>
        </div>
        
        <div class="col-md-4">
            <div class="card worst-student">
                <div class="card-body text-center">
                    <i class="fas fa-calendar-alt text-warning"></i>
                    <h5 class="card-title mt-2">${months[currentMonth]}</h5>
                    <p class="card-text text-muted">Bulan</p>
                </div>
            </div>
        </div>
        
        <div class="col-md-4">
            <div class="card attendance-rate">
                <div class="card-body text-center">
                    <i class="fas fa-chalkboard-teacher text-success"></i>
                    <h5 class="card-title mt-2">${currentClass}</h5>
                    <p class="card-text text-muted">Kelas</p>
                </div>
            </div>
        </div>
    `;
}

function updateAttendanceTable() {
    if (!students.length || !attendanceTable) {
        return;
    }
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Bangun tabel
    let tableHTML = `
        <thead>
            <tr>
                <th style="min-width: 200px;" class="text-start">Nama Siswa</th>
    `;
    
    // Header tanggal (hari)
    for (let day = 1; day <= daysInMonth; day++) {
        tableHTML += `<th class="text-center" style="min-width: 40px;">
            <div class="small fw-bold">${day}</div>
        </th>`;
    }
    
    tableHTML += `
                <th class="text-center">H</th>
                <th class="text-center">T</th>
                <th class="text-center">I/S</th>
                <th class="text-center">A</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    // Data siswa
    attendanceData.forEach(student => {
        let presentCount = 0;
        let lateCount = 0;
        let permissionCount = 0;
        let absentCount = 0;
        
        tableHTML += `<tr>`;
        tableHTML += `<td class="fw-semibold text-start">${student.studentName}</td>`;
        
        // Data kehadiran per hari
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const attendance = student.attendance[dateStr];
            
            if (attendance) {
                let dotClass = '';
                let symbol = '';
                
                if (attendance.status === 'present') {
                    dotClass = 'dot-present';
                    symbol = '•';
                    presentCount++;
                } else if (attendance.status === 'late') {
                    dotClass = 'dot-late';
                    symbol = 'T';
                    lateCount++;
                } else if (attendance.status === 'permission') {
                    dotClass = 'dot-permission';
                    symbol = 'P';
                    permissionCount++;
                } else if (attendance.status === 'absent') {
                    dotClass = 'dot-absent';
                    symbol = 'A';
                    absentCount++;
                }
                
                tableHTML += `<td class="text-center">
                    <span class="dot ${dotClass}">${symbol}</span>
                </td>`;
            } else {
                // SEL KOSONG - Belum ada data kehadiran
                tableHTML += `<td class="text-center">
                    <span class="text-muted">—</span>
                </td>`;
            }
        }
        
        // Total per siswa
        tableHTML += `
            <td class="text-center fw-bold text-success">${presentCount}</td>
            <td class="text-center fw-bold text-warning">${lateCount}</td>
            <td class="text-center fw-bold text-info">${permissionCount}</td>
            <td class="text-center fw-bold text-danger">${absentCount}</td>
        `;
        
        tableHTML += `</tr>`;
    });
    
    tableHTML += `</tbody>`;
    attendanceTable.innerHTML = tableHTML;
}

// ===== EVENT HANDLERS =====
function handleMonthChange() {
    currentMonth = parseInt(monthSelect.value);
    if (currentClass) {
        loadClassData(currentClass);
    }
}

function handleDownload() {
    if (!currentClass || !students.length) {
        showError('Tidak ada data untuk didownload');
        return;
    }
    
    try {
        showLoading('Menyiapkan file Excel...');
        
        // Data untuk Excel
        const data = [
            ['LAPORAN KEHADIRAN SISWA'],
            [`Kelas: ${currentClass}`],
            [`Bulan: ${months[currentMonth]} ${currentYear}`],
            [],
            ['Nama Siswa', 'Hadir', 'Terlambat', 'Izin/Sakit', 'Alpha']
        ];
        
        // Tambahkan data siswa
        attendanceData.forEach(student => {
            let present = 0, late = 0, permission = 0, absent = 0;
            
            Object.values(student.attendance).forEach(day => {
                if (day.status === 'present') present++;
                else if (day.status === 'late') late++;
                else if (day.status === 'permission') permission++;
                else if (day.status === 'absent') absent++;
            });
            
            data.push([student.studentName, present, late, permission, absent]);
        });
        
        // Buat file Excel
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Kehadiran');
        
        // Download
        const fileName = `kehadiran_${currentClass}_${months[currentMonth]}_${currentYear}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        hideLoading();
        
    } catch (error) {
        hideLoading();
        showError('Gagal membuat file Excel');
        console.error('Download error:', error);
    }
}

function handleLogout() {
    if (confirm('Keluar dari aplikasi?')) {
        localStorage.removeItem('attendanceAdminLoggedIn');
        showLogin();
        
        // Reset form
        if (loginForm) loginForm.reset();
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Masuk';
        }
    }
}

function toggleSidebar() {
    if (sidebar) sidebar.classList.toggle('collapsed');
    if (mainContent) mainContent.classList.toggle('expanded');
}

function toggleMobileSidebar() {
    if (sidebar) sidebar.classList.toggle('show');
}

// ===== FIREBASE DEBUG =====
// Fungsi untuk cek koneksi database
window.checkFirebaseData = async function() {
    console.log("🔍 Cek data Firebase...");
    
    try {
        // 1. Cek collection students
        const studentsCol = await window.firestoreDb.collection('students').limit(3).get();
        console.log(`📚 Students collection: ${studentsCol.size} dokumen`);
        
        studentsCol.forEach(doc => {
            console.log(`  - ${doc.id}:`, doc.data());
        });
        
        // 2. Cek collection attendance
        const attendanceCol = await window.firestoreDb.collection('attendance').limit(3).get();
        console.log(`📅 Attendance collection: ${attendanceCol.size} dokumen`);
        
        attendanceCol.forEach(doc => {
            console.log(`  - ${doc.id}:`, doc.data());
        });
        
        return true;
        
    } catch (error) {
        console.error('❌ Error cek data:', error);
        return false;
    }
};