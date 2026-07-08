// app.js - TAM VERSİYON
console.log("%c🔥 Alanya İtiraf Portalı - Tam Versiyon", "color:#ff6b00; font-size:18px; font-weight:bold");

const firebaseConfig = {
    apiKey: "AIzaSyB4zaHiwLkN7XM4aBnMp16nUuCD-ghJ7JA",
    authDomain: "alanya-itiraf-site.firebaseapp.com",
    projectId: "alanya-itiraf-site",
    storageBucket: "alanya-itiraf-site.firebasestorage.app",
    messagingSenderId: "554374615785",
    appId: "1:554374615785:web:2709ca47900b909a9d1678"
};

let db;
let isAdminLoggedIn = false;

// Firebase Init
function initFirebase() {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log("✅ Firebase bağlandı");
    } catch (e) {
        console.error("Firebase hatası:", e);
    }
}

// Hamburger
function initHamburger() {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });
}

// TAB DEĞİŞTİRME - EN ÖNEMLİ KISIM
window.switchTab = function(tab) {
    console.log("SwitchTab çağrıldı →", tab);
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const target = document.getElementById(tab);
    if (target) {
        target.classList.add('active');
    } else {
        console.error("Tab bulunamadı:", tab);
    }

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-tab') === tab) {
            item.classList.add('active');
        }
    });
};

// Escape HTML
function escapeHtml(unsafe) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// İtiraf Gönderme
window.submitPost = async function() {
    const text = document.getElementById('post-text').value.trim();
    if (!text) {
        alert("Lütfen bir itiraf yazın.");
        return;
    }
    alert("İtirafınız alındı (Demo modu - Firebase bağlantısı tamamlanınca gerçek çalışacak)");
};

// Admin Giriş
window.loginAdmin = function() {
    const pass = document.getElementById('admin-password').value;
    if (pass.length > 3) {
        isAdminLoggedIn = true;
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        alert("Admin girişi başarılı (Demo)");
    } else {
        alert("Şifre girin");
    }
};

// Sayfa Yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ Sayfa tamamen yüklendi");
    
    initFirebase();
    initHamburger();

    // Nav linkler için
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.getAttribute('data-tab');
            if (tab) switchTab(tab);
        });
    });

    // İlk yükleme
    console.log("Ana sayfa aktif");
});

console.log("%cTüm fonksiyonlar yüklendi. Artık butonlar çalışmalı.", "color:green");
