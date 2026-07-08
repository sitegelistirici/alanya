// app.js
console.log("%c🔥 Alanya İtiraf Portalı Başlatılıyor...", "color:#ff6b00; font-size:16px; font-weight:bold");

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyB4zaHiwLkN7XM4aBnMp16nUuCD-ghJ7JA",
    authDomain: "alanya-itiraf-site.firebaseapp.com",
    projectId: "alanya-itiraf-site",
    storageBucket: "alanya-itiraf-site.firebasestorage.app",
    messagingSenderId: "554374615785",
    appId: "1:554374615785:web:2709ca47900b909a9d1678",
    measurementId: "G-FTFS2TTX1W"
};

let db, isAdminLoggedIn = false;

// Initialize Firebase
function initFirebase() {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log("✅ Firebase başarıyla bağlandı");
    } catch (e) {
        console.error("❌ Firebase başlatılamadı:", e);
    }
}

// Hamburger Menu
function initHamburger() {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    if (!hamburger) {
        console.error("Hamburger butonu bulunamadı!");
        return;
    }

    hamburger.addEventListener('click', () => {
        console.log("Hamburger tıklandı");
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });
}

// Tab Switching
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById(tab).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-tab') === tab);
    });
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Sayfa Yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    console.log("📄 DOM yüklendi");
    
    initFirebase();
    initHamburger();
    
    // Image input
    const imageInput = document.getElementById('image-input');
    if (imageInput) {
        imageInput.addEventListener('change', function() {
            const fileNameEl = document.getElementById('file-name');
            if (this.files.length > 0) {
                fileNameEl.textContent = this.files[0].name;
            }
        });
    }

    // İlk yükleme
    setTimeout(() => {
        if (typeof loadApprovedPosts === 'function') loadApprovedPosts();
        if (typeof loadPolls === 'function') loadPolls();
        if (typeof loadLeaders === 'function') loadLeaders();
    }, 800);
});

// Diğer fonksiyonlar (submitPost, loginAdmin vb.) önceki mesajımdaki gibi aynı kalabilir.
// İstersen hepsini de buraya ekleyeyim.

async function submitPost() { /* ... önceki kod ... */ }
async function loginAdmin() { /* ... önceki kod ... */ }
// ... diğer fonksiyonlar
