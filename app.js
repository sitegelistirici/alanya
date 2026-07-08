console.log("%c✅ Alanya İtiraf Portalı Tamamen Yüklendi", "color:#ff6b00; font-size:16px; font-weight:bold");

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById(tab).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-tab') === tab);
    });

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

    // Hamburger aç
    hamburger.addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('open');
        overlay.classList.add('active');
    });

    // Çarpı ile kapat
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSidebar);
    }

    // Overlay tıklayınca kapat
    overlay.addEventListener('click', closeSidebar);

    // Menü linkleri
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = link.getAttribute('data-tab');
            if (tab) switchTab(tab);
        });
    });

    console.log("✅ Sidebar ve butonlar aktif");
});
