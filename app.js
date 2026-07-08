console.log("%cAlanya İtiraf Portalı - Script Yüklendi", "color:#ff6b00;font-size:16px");

let currentTab = "home";

// Tab değiştirme fonksiyonu
function switchTab(tab) {
    console.log("Tab değiştiriliyor:", tab);
    
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.remove('active');
    });
    
    const target = document.getElementById(tab);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-tab') === tab);
    });
}

// Hamburger
document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('active');
});

// Nav linkler
document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.getAttribute('data-tab');
        switchTab(tab);
    });
});

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ DOMContentLoaded - Tüm event listenerlar eklendi");
    
    // Test butonu
    const testBtn = document.createElement('button');
    testBtn.textContent = "TEST - Submit Tab";
    testBtn.style.position = "fixed";
    testBtn.style.bottom = "20px";
    testBtn.style.right = "20px";
    testBtn.style.zIndex = "9999";
    testBtn.onclick = () => switchTab('submit');
    document.body.appendChild(testBtn);
});
