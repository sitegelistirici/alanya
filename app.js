// app.js - Son Kusursuz Versiyon
console.log("%c✅ Alanya İtiraf Portalı - Tamamen Hazır", "color:#ff6b00; font-size:18px; font-weight:700");

const firebaseConfig = {
    apiKey: "AIzaSyB4zaHiwLkN7XM4aBnMp16nUuCD-ghJ7JA",
    authDomain: "alanya-itiraf-site.firebaseapp.com",
    projectId: "alanya-itiraf-site",
    storageBucket: "alanya-itiraf-site.firebasestorage.app",
    messagingSenderId: "554374615785",
    appId: "1:554374615785:web:2709ca47900b909a9d1678"
};

// Firebase Başlatma
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let isAdminLoggedIn = false;

// Tab Değiştirme
window.switchTab = function(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(tab);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-tab') === tab);
    });

    closeSidebar();
};

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
}

// GERÇEK ADMIN GİRİŞİ - Firestore Entegrasyonu
window.loginAdmin = async function() {
    const passwordInput = document.getElementById('admin-password');
    const loginBox = document.getElementById('admin-login');
    const adminPanel = document.getElementById('admin-panel');

    const enteredPass = passwordInput.value.trim();

    if (!enteredPass) {
        alert("Lütfen admin şifresini girin.");
        return;
    }

    try {
        const configDoc = await db.collection('admin_config')
            .doc('system_config')
            .get();

        if (!configDoc.exists) {
            alert("Admin yapılandırması bulunamadı. Lütfen Firestore'da 'admin_config/system_config' oluşturun.");
            return;
        }

        const realPassword = configDoc.data().didogram_password;

        if (enteredPass === realPassword) {
            isAdminLoggedIn = true;
            loginBox.style.display = "none";
            adminPanel.style.display = "block";
            alert("✅ Admin paneline başarıyla giriş yapıldı.");
            console.log("Admin girişi başarılı");
        } else {
            alert("❌ Hatalı şifre!");
            passwordInput.value = "";
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("Firestore bağlantısında hata oluştu. İnternet bağlantınızı kontrol edin.");
    }
};

// İtiraf Gönderme
window.submitPost = async function() {
    const text = document.getElementById('post-text').value.trim();
    if (!text) {
        alert("Lütfen bir itiraf yazın.");
        return;
    }

    try {
        await db.collection('pending_posts').add({
            text: text,
            imageUrl: "",
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("✅ İtirafınız başarıyla gönderildi!\nAdmin onayı bekleniyor.");
        document.getElementById('post-text').value = "";
        switchTab('confessions');
    } catch (e) {
        console.error(e);
        alert("Gönderme sırasında hata oluştu.");
    }
};

// Sayfa Yüklendiğinde Tüm Sistem
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const closeBtn = document.getElementById('close-sidebar');
    const overlay = document.getElementById('overlay');

    hamburger.addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('open');
        overlay.classList.add('active');
    });

    closeBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = link.getAttribute('data-tab');
            if (tab) switchTab(tab);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") closeSidebar();
    });

    console.log("🚀 Tüm sistem aktif ve Firebase entegrasyonu tamamlandı.");
});
