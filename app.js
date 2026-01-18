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

// ===== DOM ELEMENTS =====
const loadingOverlay = document.getElementById('loadingOverlay');
const loginPage = document.getElementById('loginPage');
const dashboardPage = document.getElementById('dashboardPage');
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const togglePassword = document.getElementById('togglePassword');
const logoutBtn = document.getElementById('logoutBtn');
const classTabs = document.getElementById('classTabs');
const monthSelect = document.getElementById('monthSelect');
const downloadBtn = document.getElementById('downloadBtn');
const currentClassName = document.getElementById('currentClassName');
const totalStudents = document.getElementById('totalStudents');
const statsContainer = document.getElementById('statsContainer');
const attendanceTable = document.getElementById('attendanceTable');
const dataStatus = document.getElementById('dataStatus');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 Application Starting...");
    
    // Check login status
    setTimeout(checkLoginStatus, 1500);
});

function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('attendanceAdminLoggedIn');
    
    if (isLoggedIn === 'true') {
        // Check Firebase connection first
        checkFirebaseAndLogin();
    } else {
        showLogin();
        initializeLoginPage();
        hideLoading();
    }
}

async function checkFirebaseAndLogin() {
    showLoading('Menghubungkan ke database...');
    
    // Wait for Firebase to be ready (max 10 seconds)
    const startTime = Date.now();
    const maxWaitTime = 10000;
    
    while (Date.now() - startTime < maxWaitTime) {
        if (window.isFirebaseConnected === true) {
            console.log("✅ Firebase connected, proceeding to dashboard");
            showDashboard();
            initializeDashboard();
            hideLoading();
            return;
        }
        
        if (window.isFirebaseConnected === false) {
            console.log("❌ Firebase not connected");
            showError("Database tidak terhubung. Refresh halaman.");
            hideLoading();
            return;
        }
        
        // Wait 100ms before checking again
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Timeout
    console.log("⏰ Firebase connection timeout");
    showError("Koneksi database timeout. Coba refresh.");
    hideLoading();
}

// ===== UTILITY FUNCTIONS =====
function showLoading(message) {
    if (loadingOverlay) {
        const text = loadingOverlay.querySelector('p');
        if (text) text.textContent = message;
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
    alert(message);
}

function updateDataStatus(status) {
    if (!dataStatus) return;
    
    const statusMap = {
        'memuat': { text: 'Memuat...', icon: 'fa-spinner fa-spin', color: 'bg-info' },
        'tersambung': { text: 'Online', icon: 'fa-check', color: 'bg-success' },
        'error': { text: 'Error', icon: 'fa-exclamation', color: 'bg-danger' }
    };
    
    const config = statusMap[status] || statusMap['memuat'];
    dataStatus.className = `badge ${config.color} text-white border`;
    dataStatus.innerHTML = `<i class="fas ${config.icon} me-1"></i><span>${config.text}</span>`;
}

// ===== LOGIN FUNCTIONS =====
function initializeLoginPage() {
    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }
    
    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
}

function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showError('Harap isi username dan password');
        return;
    }
    
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Memproses...';
    }
    
    // Check credentials
    if (username === 'admin' && password === 'admin123') {
        // Save login state
        localStorage.setItem('attendanceAdminLoggedIn', 'true');
        
        // Reset button
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Masuk';
        }
        
        // Check Firebase and show dashboard
        checkFirebaseAndLogin();
        
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
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Keluar dari aplikasi?')) {
                localStorage.removeItem('attendanceAdminLoggedIn');
                showLogin();
                if (loginForm) loginForm.reset();
            }
        });
    }
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', handleDownload);
    }
    
    // Load first class
    if (classList.length > 0) {
        selectClass(classList[0]);
    }
    
    updateDataStatus('tersambung');
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
    
    monthSelect.addEventListener('change', function() {
        currentMonth = parseInt(this.value);
        if (currentClass) {
            loadClassData(currentClass);
        }
    });
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
        
        // Load data from Firebase
        await loadClassData(className);
        
        updateDataStatus('tersambung');
        hideLoading();
        
    } catch (error) {
        console.error('Error memuat kelas:', error);
        showError('Gagal memuat data dari database');
        updateDataStatus('error');
        hideLoading();
    } finally {
        isLoading = false;
    }
}

// ===== FIREBASE DATA FUNCTIONS =====
async function getStudentsByClass(className) {
    console.log(`📋 Mengambil siswa kelas ${className} dari Firebase...`);
    
    try {
        if (!window.firestoreDb) {
            throw new Error("Firestore database not available");
        }
        
        // Query untuk mendapatkan siswa berdasarkan kelas
        // Catatan: Query ini memerlukan index jika menggunakan where + orderBy
        // Jika error index, ubah query menjadi lebih sederhana
        
        const snapshot = await window.firestoreDb
            .collection('students')
            .where('kelas', '==', className)
            .get();
        
        if (snapshot.empty) {
            console.log(`📭 Tidak ada siswa di kelas ${className}`);
            return [];
        }
        
        const students = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                uid: data.uid || '',
                name: data.name || '',
                kelas: data.kelas || '',
                nohp: data.nohp || ''
            };
        });
        
        // Sort manually in JavaScript
        students.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        
        console.log(`✅ Ditemukan ${students.length} siswa di kelas ${className}`);
        return students;
        
    } catch (error) {
        console.error('❌ Error mengambil siswa dari Firebase:', error);
        
        // Tampilkan error detail untuk debugging
        if (error.code === 'failed-precondition') {
            console.error('⚠️ Perlu buat index di Firebase Console');
            console.error('Link untuk buat index:', error.message.match(/https:\/\/[^\s]+/)?.[0] || '');
        }
        
        throw error;
    }
}

async function getAttendanceData(className, month, year) {
    console.log(`📋 Mengambil data kehadiran dari Firebase...`);
    
    try {
        if (!window.firestoreDb) {
            throw new Error("Firestore database not available");
        }
        
        // Format tanggal untuk query
        const monthStr = (month + 1).toString().padStart(2, '0');
        const yearStr = year.toString();
        const startDate = `${yearStr}-${monthStr}-01`;
        const endDate = `${yearStr}-${monthStr}-31`;
        
        // Query data kehadiran
        const snapshot = await window.firestoreDb
            .collection('attendance')
            .where('kelas', '==', className)
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .get();
        
        if (snapshot.empty) {
            console.log(`📭 Tidak ada data kehadiran untuk ${className} bulan ${monthStr}`);
            return [];
        }
        
        const records = snapshot.docs.map(doc => {
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
        
        console.log(`✅ Ditemukan ${records.length} data kehadiran`);
        return records;
        
    } catch (error) {
        console.error('❌ Error mengambil data kehadiran:', error);
        return [];
    }
}

async function loadClassData(className) {
    try {
        // Reset data
        students = [];
        attendanceData = [];
        
        // 1. Load siswa dari Firebase
        students = await getStudentsByClass(className);
        
        if (students.length === 0) {
            showEmptyData('Tidak ada siswa di database untuk kelas ini');
            return;
        }
        
        // 2. Load data kehadiran dari Firebase
        const attendanceRecords = await getAttendanceData(className, currentMonth, currentYear);
        
        // 3. Proses data kehadiran
        const attendanceByStudent = processAttendanceData(attendanceRecords, students);
        attendanceData = attendanceByStudent;
        
        // 4. Update UI
        updateStats();
        updateAttendanceTable();
        
        if (totalStudents) {
            totalStudents.textContent = `${students.length} siswa`;
        }
        
    } catch (error) {
        console.error('Error loading class data:', error);
        throw error;
    }
}

function processAttendanceData(records, students) {
    // Mapping status
    const statusMap = {
        'Datang': 'present',
        'Pulang': 'present',
        'Terlambat': 'late',
        'Izin': 'permission',
        'Sakit': 'permission',
        'Alpha': 'absent'
    };
    
    // Initialize structure
    const attendanceByStudent = students.map(student => ({
        studentId: student.uid,
        studentName: student.name,
        attendance: {}
    }));
    
    // Process records
    records.forEach(record => {
        const studentIndex = attendanceByStudent.findIndex(s => s.studentId === record.uid);
        
        if (studentIndex !== -1) {
            const dateStr = record.date;
            const status = statusMap[record.status] || 'present';
            
            attendanceByStudent[studentIndex].attendance[dateStr] = {
                status: status,
                time: record.time,
                originalStatus: record.status
            };
        }
    });
    
    return attendanceByStudent;
}

function showEmptyData(message) {
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
                        <i class="fas fa-database fa-2x mb-3"></i>
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
    if (!statsContainer || !students.length) return;
    
    // Calculate basic stats
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    
    attendanceData.forEach(student => {
        Object.values(student.attendance).forEach(att => {
            if (att.status === 'present') presentCount++;
            else if (att.status === 'late') lateCount++;
            else if (att.status === 'absent') absentCount++;
        });
    });
    
    const totalAttendance = presentCount + lateCount + absentCount;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;
    
    statsContainer.innerHTML = `
        <div class="col-md-4">
            <div class="card">
                <div class="card-body text-center">
                    <i class="fas fa-users text-primary"></i>
                    <h5 class="card-title mt-2">${students.length}</h5>
                    <p class="card-text text-muted">Total Siswa</p>
                </div>
            </div>
        </div>
        
        <div class="col-md-4">
            <div class="card">
                <div class="card-body text-center">
                    <i class="fas fa-chart-line text-success"></i>
                    <h5 class="card-title mt-2">${attendanceRate}%</h5>
                    <p class="card-text text-muted">Kehadiran</p>
                </div>
            </div>
        </div>
        
        <div class="col-md-4">
            <div class="card">
                <div class="card-body text-center">
                    <i class="fas fa-clock text-warning"></i>
                    <h5 class="card-title mt-2">${lateCount}</h5>
                    <p class="card-text text-muted">Terlambat</p>
                </div>
            </div>
        </div>
    `;
}

function updateAttendanceTable() {
    if (!attendanceTable || !students.length) return;
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    let tableHTML = `
        <thead>
            <tr>
                <th style="min-width: 200px;" class="text-start">Nama Siswa</th>
    `;
    
    for (let day = 1; day <= daysInMonth; day++) {
        tableHTML += `<th class="text-center" style="min-width: 40px;">
            <div class="small">${day}</div>
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
    
    attendanceData.forEach(student => {
        let presentCount = 0;
        let lateCount = 0;
        let permissionCount = 0;
        let absentCount = 0;
        
        tableHTML += `<tr>`;
        tableHTML += `<td class="fw-semibold text-start">${student.studentName}</td>`;
        
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
                // Empty cell - no attendance data
                tableHTML += `<td class="text-center">
                    <span class="text-muted">—</span>
                </td>`;
            }
        }
        
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

function handleDownload() {
    if (!currentClass || !students.length) {
        alert('Tidak ada data untuk didownload');
        return;
    }
    
    try {
        showLoading('Menyiapkan file Excel...');
        
        const data = [
            ['LAPORAN KEHADIRAN SISWA'],
            [`Kelas: ${currentClass}`],
            [`Bulan: ${months[currentMonth]} ${currentYear}`],
            [],
            ['Nama Siswa', 'Hadir', 'Terlambat', 'Izin/Sakit', 'Alpha']
        ];
        
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
        
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Kehadiran');
        
        const fileName = `kehadiran_${currentClass}_${months[currentMonth]}_${currentYear}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        hideLoading();
        
    } catch (error) {
        hideLoading();
        console.error('Download error:', error);
        alert('Gagal membuat file Excel');
    }
}

// ===== FIREBASE DEBUG FUNCTION =====
window.debugFirebase = async function() {
    console.log("🔧 Firebase Debug Info:");
    console.log("isFirebaseConnected:", window.isFirebaseConnected);
    console.log("firestoreDb:", window.firestoreDb ? "Available" : "Not available");
    
    if (window.firestoreDb) {
        try {
            // Test students collection
            const students = await window.firestoreDb.collection('students').limit(3).get();
            console.log(`📚 Students collection: ${students.size} documents`);
            students.forEach(doc => console.log(`  ${doc.id}:`, doc.data()));
            
            // Test attendance collection
            const attendance = await window.firestoreDb.collection('attendance').limit(3).get();
            console.log(`📅 Attendance collection: ${attendance.size} documents`);
            attendance.forEach(doc => console.log(`  ${doc.id}:`, doc.data()));
            
        } catch (error) {
            console.error("Debug query error:", error);
        }
    }
};
