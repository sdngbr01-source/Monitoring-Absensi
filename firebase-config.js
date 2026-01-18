// Konfigurasi Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB7JpUlxTVIN40WYF7IkMy0bdFgkfpM9HI",
  authDomain: "absensi-siswa-22ef5.firebaseapp.com",
  projectId: "absensi-siswa-22ef5",
  storageBucket: "absensi-siswa-22ef5.firebasestorage.app",
  messagingSenderId: "894029283779",
  appId: "1:894029283779:web:e11da705ca20b23aa87d76"
};

// ===== INITIALIZE FIREBASE =====
let firebaseApp;
let firestoreDb;
let firebaseAuth;
let isFirebaseConnected = false;

try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    firestoreDb = firebase.firestore();
    firebaseAuth = firebase.auth();
    
    console.log("✅ Firebase initialized");
    
    // Konfigurasi sederhana tanpa persistence yang ribet
    try {
        // Coba enable persistence tapi tidak terlalu strict
        firestoreDb.enablePersistence()
            .catch((err) => {
                // Ignore persistence errors
                console.log("ℹ️ Persistence:", err.code);
            });
    } catch (err) {
        // Ignore semua error persistence
    }
    
    // Update status Firebase
    updateFirebaseStatus(true);
    
} catch (error) {
    console.error("❌ Firebase init error:", error);
    updateFirebaseStatus(false);
}

// ===== DATABASE REFERENCES =====
const getStudentsCollection = () => {
    return firestoreDb.collection('students');
};

const getAttendanceCollection = () => {
    return firestoreDb.collection('attendance');
};

// ===== SIMPLE STATUS MANAGEMENT =====
function updateFirebaseStatus(connected) {
    isFirebaseConnected = connected;
    
    // Update mini status di sidebar saja
    const miniStatusElement = document.getElementById('firebaseStatusMini');
    
    if (miniStatusElement) {
        if (connected) {
            miniStatusElement.className = 'firebase-status-mini connected';
            miniStatusElement.innerHTML = '<i class="fas fa-circle fa-xs"></i>';
            miniStatusElement.title = 'Database terhubung';
        } else {
            miniStatusElement.className = 'firebase-status-mini disconnected';
            miniStatusElement.innerHTML = '<i class="fas fa-circle fa-xs"></i>';
            miniStatusElement.title = 'Database offline';
        }
    }
    
    // Update window variable
    window.isFirebaseConnected = isFirebaseConnected;
}

// ===== HAPUS NETWORK MONITORING =====
// Hapus semua kode yang menampilkan status internet
// Tidak perlu listen untuk online/offline events

// Export Firebase objects
window.firebaseApp = firebaseApp;
window.firestoreDb = firestoreDb;
window.firebaseAuth = firebaseAuth;
window.isFirebaseConnected = isFirebaseConnected;