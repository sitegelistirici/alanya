// Sağladığın Resmi ve Güncel Firebase Config Entegrasyonu
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

// DOM Elementleri
const confessForm = document.getElementById('confessForm');
const confessMessage = document.getElementById('confessMessage');
const imageInput = document.getElementById('imageInput');
const fileName = document.getElementById('fileName');
const submitBtn = document.getElementById('submitBtn');
const globalStatus = document.getElementById('globalStatus');

imageInput.addEventListener('change', (e) => {
    if(e.target.files.length > 0) fileName.textContent = e.target.files[0].name;
});

// Sekme Mantığı (Tab Control)
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Görsel Yükleyici (ImgBB)
async function uploadToImgBB(file) {
    const formData = new FormData();
    formData.append('image', file);
    try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
        const data = await res.json();
        return data.success ? data.data.url : null;
    } catch { return null; }
}

// 1. KULLANICI: İtiraf Gönder -> [pending_posts] Koleksiyonu
confessForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = confessMessage.value.trim();
    const file = imageInput.files[0];
    if(!msg) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> SİNYAL GÖNDERİLİYOR...`;

    let imgUrl = "";
    if(file) {
        globalStatus.textContent = "Sistem: Görsel buluta aktarılıyor...";
        imgUrl = await uploadToImgBB(file);
    }

    globalStatus.textContent = "Sistem: Veri ağ kuyruğuna alınıyor...";
    
    // Doğrudan senin koleksiyon ismin: pending_posts
    db.collection('pending_posts').add({
        text: msg,
        imageUrl: imgUrl,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        globalStatus.innerHTML = "<span style='color:var(--orange-primary)'>Sistem: İtiraf onay kuyruğuna başarıyla iletildi.</span>";
        confessForm.reset();
        fileName.textContent = "Dosya seçilmedi";
    }).catch(() => {
        globalStatus.textContent = "Hata: Bağlantı hatası oluştu.";
    }).finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> GÖNDER`;
    });
});

// 2. AKIŞ: Onaylanmış İtirafları Canlı İzleme -> [approved_posts] Koleksiyonu
db.collection('approved_posts').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
    const feed = document.getElementById('uploadPostsFeed');
    feed.innerHTML = "";
    if(snapshot.empty) { feed.innerHTML = "<p class='soft-text'>Yayınlanmış veri akışı bulunmuyor.</p>"; return; }
    
    snapshot.forEach(doc => {
        const post = doc.data();
        const date = post.timestamp ? new Date(post.timestamp.seconds * 1000).toLocaleString() : "Şimdi";
        const card = document.createElement('div');
        card.className = "premium-card post-wrapper";
        card.innerHTML = `
            <div class="post-header"><span class="soft-text">// PAYLAŞIM: ${date}</span></div>
            <p class="post-body">${escapeHtml(post.text)}</p>
            ${post.imageUrl ? `<img src="${post.imageUrl}" class="post-img">` : ''}
        `;
        feed.appendChild(card);
    });
});

// 3. LİG SİSTEMİ: Kullanıcı Skorları -> [users] Koleksiyonu
db.collection('users').orderBy('score', 'desc').limit(10).onSnapshot(snapshot => {
    const container = document.getElementById('leaderboardContainer');
    container.innerHTML = "";
    let rank = 1;
    snapshot.forEach(doc => {
        const u = doc.data();
        container.innerHTML += `
            <tr>
                <td style="color:var(--orange-primary); font-weight:bold;">#${rank++}</td>
                <td>${escapeHtml(u.username || 'Anonim_Kullanici')}</td>
                <td style="color:var(--orange-primary)">${u.score || 0} PTS</td>
            </tr>
        `;
    });
});

// 4. ANKET MOTORU: Oylamalar -> [polls] Koleksiyonu
db.collection('polls').onSnapshot(snapshot => {
    const container = document.getElementById('pollsFeed');
    container.innerHTML = "";
    snapshot.forEach(doc => {
        const poll = doc.data();
        const total = (poll.votesOpt1 || 0) + (poll.votesOpt2 || 0) || 1;
        const p1 = Math.round(((poll.votesOpt1 || 0) / total) * 100);
        const p2 = Math.round(((poll.votesOpt2 || 0) / total) * 100);

        container.innerHTML += `
            <div class="premium-card">
                <h4 style="margin-bottom:15px; font-size:1.05rem;">${escapeHtml(poll.question)}</h4>
                <div class="poll-option-container">
                    <button class="poll-btn" onclick="registerVote('${doc.id}', 'opt1')">
                        <div class="poll-fill" style="width: ${p1}%"></div>
                        <div class="poll-content"><span>${escapeHtml(poll.opt1)}</span><span>%${p1}</span></div>
                    </button>
                    <button class="poll-btn" onclick="registerVote('${doc.id}', 'opt2')">
                        <div class="poll-fill" style="width: ${p2}%"></div>
                        <div class="poll-content"><span>${escapeHtml(poll.opt2)}</span><span>%${p2}</span></div>
                    </button>
                </div>
            </div>
        `;
    });
});

// 5. ADMİN PANEL KONTROLLERİ -> [admin_config] Koleksiyonu
function openAdminModal() { document.getElementById('adminModal').classList.add('active'); }
function closeAdminModal() { document.getElementById('adminModal').classList.remove('active'); }

function checkAdminAccess() {
    const pwd = document.getElementById('adminPassword').value;
    
    // admin_config üzerinden şifre kontrolü
    db.collection('admin_config').doc('system_config').get().then(doc => {
        if(doc.exists && doc.data().didogram_password === pwd) {
            isAdminAuthenticated = true;
            document.getElementById('adminAuthZone').style.display = 'none';
            document.getElementById('adminControlZone').style.display = 'block';
            syncPendingPosts();
        } else {
            document.getElementById('authError').textContent = "HATA: Yetkisiz Admin Girişi.";
        }
    });
}

// Onay Bekleyenleri Getir [pending_posts]
function syncPendingPosts() {
    db.collection('pending_posts').orderBy('timestamp', 'asc').onSnapshot(snapshot => {
        const container = document.getElementById('pendingPostsFeed');
        container.innerHTML = "";
        if(snapshot.empty) { container.innerHTML = "<p class='soft-text'>Onay bekleyen itiraf kuyruğu temiz.</p>"; return; }

        snapshot.forEach(doc => {
            const post = doc.data();
            const div = document.createElement('div');
            div.className = "admin-raw";
            div.innerHTML = `
                <p>${escapeHtml(post.text)}</p>
                ${post.imageUrl ? `<img src="${post.imageUrl}" style="width:120px; border-radius:6px; margin-top:10px;">` : ''}
                <div class="admin-actions">
                    <button class="btn-modern btn-orange" onclick="pushToUpload('${doc.id}')">ONAYLA [approved_posts]</button>
                    <button class="btn-modern btn-danger" onclick="deleteFromPending('${doc.id}')">REDDET</button>
                </div>
            `;
            container.appendChild(div);
        });
    });
}

// ADMİN ONAY: pending_posts -> approved_posts taşınma motoru
async function pushToUpload(docId) {
    if(!isAdminAuthenticated) return;
    const ref = db.collection('pending_posts').doc(docId);
    const snap = await ref.get();
    if(snap.exists) {
        const d = snap.data();
        
        // Tamamen senin belirttiğin isim: approved_posts
        await db.collection('approved_posts').add({
            text: d.text,
            imageUrl: d.imageUrl,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // İşlem bitince pending_posts'tan siler
        await ref.delete();
    }
}

// ADMİN RED: pending_posts'tan direkt siler
function deleteFromPending(docId) {
    if(!isAdminAuthenticated) return;
    db.collection('pending_posts').doc(docId).delete();
}

// XSS Güvenlik Filtresi (Yazıların Soft Kalması ve Bozulmaması İçin)
function escapeHtml(text) {
    if(!text) return "";
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
