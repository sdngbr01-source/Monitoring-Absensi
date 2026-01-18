// Konfigurasi Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB7JpUlxTVIN40WYF7IkMy0bdFgkfpM9HI",
  authDomain: "absensi-siswa-22ef5.firebaseapp.com",
  projectId: "absensi-siswa-22ef5",
  storageBucket: "absensi-siswa-22ef5.firebasestorage.app",
  messagingSenderId: "894029283779",
  appId: "1:894029283779:web:e11da705ca20b23aa87d76"
};


// ===== DEBUG: TAMPILKAN CONFIG =====
console.log("🔧 Firebase Config Loaded");
console.log("Project ID:", firebaseConfig.projectId);
console.log("Auth Domain:", firebaseConfig.authDomain);

// ===== INITIALIZE FIREBASE =====
let firebaseApp;
let firestoreDb;
let isFirebaseConnected = false;

// Function untuk initialize Firebase
function initializeFirebase() {
    try {
        console.log("🔄 Initializing Firebase...");
        
        // Check if Firebase SDK is loaded
        if (typeof firebase === 'undefined') {
            console.error("❌ Firebase SDK not loaded!");
            throw new Error("Firebase SDK not loaded. Check internet connection.");
        }
        
        // Initialize Firebase
        firebaseApp = firebase.initializeApp(firebaseConfig);
        firestoreDb = firebase.firestore();
        
        console.log("✅ Firebase App initialized:", firebaseApp.name);
        
        // Enable persistence for offline support
        firestoreDb.enablePersistence()
            .then(() => {
                console.log("💾 Firebase persistence enabled");
            })
            .catch((err) => {
                console.warn("⚠️ Persistence error:", err.code);
            });
        
        // Test connection
        testFirebaseConnection();
        
    } catch (error) {
        console.error("❌ Firebase initialization failed:", error);
        
        // Show error in UI
        if (document.getElementById('loadingText')) {
            document.getElementById('loadingText').textContent = 
                `Firebase Error: ${error.message}. Refresh page or check config.`;
        }
        
        // Retry after 5 seconds
        setTimeout(initializeFirebase, 5000);
    }
}

// ===== TEST FIREBASE CONNECTION =====
async function testFirebaseConnection() {
    try {
        console.log("🔍 Testing Firebase connection...");
        
        // Simple test - try to access Firestore
        const testCollection = firestoreDb.collection('students');
        const testQuery = testCollection.limit(1);
        
        // Use timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Connection timeout')), 10000);
        });
        
        const connectionPromise = testQuery.get();
        
        await Promise.race([connectionPromise, timeoutPromise]);
        
        isFirebaseConnected = true;
        console.log("✅ Firebase connection successful!");
        
        // Update global variable
        window.isFirebaseConnected = true;
        window.firestoreDb = firestoreDb;
        
        // Hide loading if still showing
        setTimeout(() => {
            if (document.getElementById('loadingOverlay')) {
                document.getElementById('loadingOverlay').style.display = 'none';
            }
        }, 1000);
        
    } catch (error) {
        console.error("❌ Firebase connection test failed:", error);
        isFirebaseConnected = false;
        window.isFirebaseConnected = false;
        
        // Retry connection
        setTimeout(testFirebaseConnection, 3000);
    }
}

// ===== DATABASE FUNCTIONS =====
function getStudentsCollection() {
    if (!firestoreDb) {
        throw new Error("Firestore not initialized");
    }
    return firestoreDb.collection('students');
}

function getAttendanceCollection() {
    if (!firestoreDb) {
        throw new Error("Firestore not initialized");
    }
    return firestoreDb.collection('attendance');
}

// ===== EXPORT TO WINDOW =====
window.firebaseApp = firebaseApp;
window.firestoreDb = firestoreDb;
window.isFirebaseConnected = isFirebaseConnected;
window.getStudentsCollection = getStudentsCollection;
window.getAttendanceCollection = getAttendanceCollection;

// ===== INITIALIZE ON LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    console.log("📱 DOM Loaded - Initializing Firebase");
    setTimeout(initializeFirebase, 100);
});

// Global error handler for Firebase
window.addEventListener('error', function(e) {
    if (e.message.includes('firebase') || e.message.includes('Firebase')) {
        console.error("Global Firebase error:", e);
    }
});
