// 1. Sağladığın Resmi Firebase Yapılandırması Entegrasyonu
const firebaseConfig = {
  apiKey: "AIzaSyB4zaHiwLkN7XM4aBnMp16nUuCD-ghJ7JA",
  authDomain: "alanya-itiraf-site.firebaseapp.com",
  projectId: "alanya-itiraf-site",
  storageBucket: "alanya-itiraf-site.firebasestorage.app",
  messagingSenderId: "554374615785",
  appId: "1:554374615785:web:2709ca47900b909a9d1678",
  measurementId: "G-FTFS2TTX1W"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const IMGBB_API_KEY = '26385eefa0d44dc1f5bad224ced5d83d';
let isAdminAuthenticated = false;

// Element Tanımları
const confessForm = document.getElementById('confessForm');
const confessMessage = document.getElementById('confessMessage');
const imageInput = document.getElementById('imageInput');
const fileName = document.getElementById('fileName');
const submitBtn = document.getElementById('submitBtn');
const globalStatus = document.getElementById('globalStatus');

// Dosya Seçim Kontrolü
imageInput.addEventListener('change', (e) => {
    if(e.target.files.length > 0) fileName.textContent = e.target.files[0].name;
});

// Sekme Değiştirici Metot
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`${tabName}Tab`).classList.add('active');
    event.currentTarget.classList.add('active');
}

// ImgBB Upload Motoru
async function uploadToImgBB(file) {
    const formData = new FormData();
    formData.append('image', file);
    try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
        const data = await res.json();
        return data.success ? data.data.url : null;
    } catch { return null; }
}

// KULLANICI: İtiraf Gönderme -> [pending_posts] Koleksiyonuna Düşer
confessForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = confessMessage.value.trim();
    const file = imageInput.files[0];
    if(!msg) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ENKRİPTE EDİLİYOR...`;

    let imgUrl = "";
    if(file) {
        globalStatus.textContent = "Görsel ImgBB sunucularına aktarılıyor...";
        imgUrl = await uploadToImgBB(file);
    }

    globalStatus.textContent = "İtiraf admin onayına gönderiliyor...";
    
    // Veri önce pending_posts'a ekleniyor
    db.collection('pending_posts').add({
        text: msg,
        imageUrl: imgUrl,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        globalStatus.innerHTML = "<span style='color:var(--neon-green)'>Sistem: Gönderi şifrelendi, admin paneline ulaştırıldı.</span>";
        confessForm.reset();
        fileName.textContent = "Dosya taranmadı";
    }).catch(() => {
        globalStatus.textContent = "Hata: Güvenli bağlantı kurulamadı.";
    }).finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> AĞA SIZDIR`;
    });
});

// CANLI VERİ AKIŞI: Onaylanmış Gönderiler [upload_posts]
db.collection('upload_posts').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
    const feed = document.getElementById('uploadPostsFeed');
    feed.innerHTML = "";
    if(snapshot.empty) { feed.innerHTML = "<p class='status-text'>Ağda onaylanmış veri akışı bulunmuyor.</p>"; return; }
    
    snapshot.forEach(doc => {
        const post = doc.data();
        const date = post.timestamp ? new Date(post.timestamp.seconds * 1000).toLocaleString() : "Şimdi";
        const card = document.createElement('div');
        card.className = "cyber-card glass-panel post-card";
        card.innerHTML = `
            <span class="post-time">// KOD: #${doc.id.substring(0,6)} | ${date}</span>
            <p>${escapeHtml(post.text)}</p>
            ${post.imageUrl ? `<img src="${post.imageUrl}" class="post-img">` : ''}
        `;
        feed.appendChild(card);
    });
});

// LİDERLİK TABLOSU CANLI TAKİP [users]
db.collection('users').orderBy('score', 'desc').limit(10).onSnapshot(snapshot => {
    const container = document.getElementById('leaderboardContainer');
    container.innerHTML = "";
    let index = 1;
    snapshot.forEach(doc => {
        const u = doc.data();
        container.innerHTML += `
            <tr>
                <td class="neon-blue">${index++}</td>
                <td>${escapeHtml(u.username || 'Anonim_Hacker')}</td>
                <td class="neon-green">${u.score || 0} SP</td>
            </tr>
        `;
    });
});

// ANKETLER CANLI TAKİP [polls]
db.collection('polls').onSnapshot(snapshot => {
    const container = document.getElementById('pollsFeed');
    container.innerHTML = "";
    snapshot.forEach(doc => {
        const poll = doc.data();
        const totalVotes = (poll.votesOpt1 || 0) + (poll.votesOpt2 || 0) || 1;
        const p1 = Math.round(((poll.votesOpt1 || 0) / totalVotes) * 100);
        const p2 = Math.round(((poll.votesOpt2 || 0) / totalVotes) * 100);

        container.innerHTML += `
            <div class="cyber-card glass-panel">
                <h5>${escapeHtml(poll.question)}</h5>
                <div class="poll-box">
                    <button class="poll-option-btn" onclick="vote('${doc.id}', 'opt1')">
                        <div class="poll-progress" style="width: ${p1}%"></div>
                        <div class="poll-text"><span>${escapeHtml(poll.opt1)}</span><span>%${p1}</span></div>
                    </button>
                    <button class="poll-option-btn" onclick="vote('${doc.id}', 'opt2')">
                        <div class="poll-progress" style="width: ${p2}%"></div>
                        <div class="poll-text"><span>${escapeHtml(poll.opt2)}</span><span>%${p2}</span></div>
                    </button>
                </div>
            </div>
        `;
    });
});

// ADMİN PANELİ FONKSİYONLARI [admin_config, pending_posts, upload_posts]
function openAdminModal() { document.getElementById('adminModal').classList.add('active'); }
function closeAdminModal() { document.getElementById('adminModal').classList.remove('active'); }

function checkAdminAccess() {
    const passInput = document.getElementById('adminPassword').value;
    // admin_config içindeki dökümanı sorgula
    db.collection('admin_config').doc('system_config').get().then(doc => {
        if(doc.exists && doc.data().didogram_password === passInput) {
            isAdminAuthenticated = true;
            document.getElementById('adminAuthZone').style.display = 'none';
            document.getElementById('adminControlZone').style.display = 'block';
            listenPendingPosts();
        } else {
            document.getElementById('authError').textContent = "ERİŞİM REDDEDİLDİ: Geçersiz Kripto Şifre.";
        }
    });
}

// Onay Bekleyen Postları Listele
function listenPendingPosts() {
    db.collection('pending_posts').orderBy('timestamp', 'asc').onSnapshot(snapshot => {
        const container = document.getElementById('pendingPostsFeed');
        container.innerHTML = "";
        if(snapshot.empty) { container.innerHTML = "<p class='status-text'>Onay bekleyen veri yok.</p>"; return; }

        snapshot.forEach(doc => {
            const post = doc.data();
            const item = document.createElement('div');
            item.className = "admin-item";
            item.innerHTML = `
                <p><strong>İçerik:</strong> ${escapeHtml(post.text)}</p>
                ${post.imageUrl ? `<img src="${post.imageUrl}" style="width:100px;margin-top:10px;display:block;">` : ''}
                <div class="admin-actions">
                    <button class="action-btn primary-btn" onclick="approvePost('${doc.id}')">ONAYLA [upload_posts]</button>
                    <button class="action-btn danger-btn" onclick="rejectPost('${doc.id}')">SİL</button>
                </div>
            `;
            container.appendChild(item);
        });
    });
}

// ADMİN AKSİYONU: Onaylama (Pending'den alıp Upload'a taşır)
async function approvePost(docId) {
    if(!isAdminAuthenticated) return;
    const postRef = db.collection('pending_posts').doc(docId);
    const snap = await postRef.get();
    if(snap.exists) {
        const data = snap.data();
        // upload_posts koleksiyonuna ekle
        await db.collection('upload_posts').add({
            text: data.text,
            imageUrl: data.imageUrl,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        // pending_posts'tan sil
        await postRef.delete();
    }
}

// ADMİN AKSİYONU: Reddetme (Direkt pending'den siler)
function rejectPost(docId) {
    if(!isAdminAuthenticated) return;
    db.collection('pending_posts').doc(docId).delete();
}

// XSS Güvenlik Filtresi
function escapeHtml(text) {
    if(!text) return "";
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
