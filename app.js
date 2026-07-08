// app.js - Modern ve Kusursuz Versiyon
console.log("%c✅ Alanya İtiraf Portalı - Premium JS Yüklendi", "color:#ff6b00; font-size:17px; font-weight:600");

function switchTab(tab) {
    console.log("🔄 Tab değiştiriliyor:", tab);
    
    // Tüm tabları gizle
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.remove('active');
    });
    
    // Hedef tabı göster
    const targetTab = document.getElementById(tab);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // Sidebar menüdeki active durumunu güncelle
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-tab') === tab);
    });

    // Sidebar'ı kapat
    closeSidebar();
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const closeBtn = document.getElementById('close-sidebar');
    const overlay = document.getElementById('overlay');

    // Hamburger Menü
    hamburger.addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('open');
        overlay.classList.add('active');
    });

    // Çarpı Butonu
    closeBtn.addEventListener('click', closeSidebar);

    // Overlay tıklama
    overlay.addEventListener('click', closeSidebar);

    // Nav Menü Linkleri
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = link.getAttribute('data-tab');
            if (tab) switchTab(tab);
        });
    });

    // Klavye ile kapatma (ESC tuşu)
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            closeSidebar();
        }
    });

    console.log("🚀 Tüm etkileşimler aktif - Hamburger, Tablar, Sidebar hazır");
});
