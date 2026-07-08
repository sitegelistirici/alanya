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

// Yan Menü Aç/Kapat Kontrolcüleri
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

// Sekmeler Arası Tam Geçiş (Tab Manager)
function switchTab(tabId) {
    document.querySelectorAll('.tab-layer').forEach(layer => layer.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    
    document.getElementById(`${tabId}Tab`).classList.add('active');
    
    // Aktif olan menü butonunu renklendir
    const targetItem = Array.from(document.querySelectorAll('.menu-item')).find(item => item.getAttribute('onclick').includes(tabId));
    if (targetItem) targetItem.classList.add('active');
    
    // Mobil uyum için menüyü kapat
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

// Dosya Seçim İzleyici
const imageInput = document.getElementById('imageInput');
const fileName = document.getElementById('fileName');
if(imageInput) {
    imageInput.addEventListener('change', (e) => {
        if(e.target.files.length > 0) fileName.textContent = e.target.files[0].name;
    });
}

// ImgBB Upload Servisi
async function uploadToImgBB(file) {
    const formData = new FormData();
    formData.append('image', file);
    try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
        const data = await res.json();
        return data.success ? data.data.url : null;
    } catch { return null; }
}

// 1. İTİRAF GÖNDER -> [pending_posts]
const confessForm = document.getElementById('confessForm');
confessForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('confessMessage').value.trim();
    const file = imageInput.files[0];
    const submitBtn = document.getElementById('submitBtn');
    const globalStatus = document.getElementById('globalStatus');

    submitBtn.disabled = true;
    submitBtn.textContent = "İŞLENİYOR...";

    let imgUrl = "";
    if(file) {
        globalStatus.textContent = "Görsel uzak sunucuya aktarılıyor...";
        imgUrl = await uploadToImgBB(file);
    }

    db.collection('pending_posts').add({
        text: msg,
        imageUrl: imgUrl,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        globalStatus.innerHTML = "<span style='color:var(--orange)'>Başarılı: İtiraf admin onay odasına iletildi.</span>";
        confessForm.reset();
        fileName.textContent = "Dosya taranmadı";
    }).catch(() => {
        globalStatus.textContent = "Hata: Sunucu hatası.";
    }).finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = "AĞA SIZDIR";
    });
});

// 2. ONAYLANAN AKIŞ -> [approved_posts]
db.collection('approved_posts').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
    const feed = document.getElementById('uploadPostsFeed');
    feed.innerHTML = "";
    if(snapshot.empty) { feed.innerHTML = "<p class='soft-text'>Yayınlanmış hiçbir itiraf bulunamadı.</p>"; return; }
    
    snapshot.forEach(doc => {
        const post = doc.data();
        const date = post.timestamp ? new Date(post.timestamp.seconds * 1000).toLocaleString() : "Yeni";
        const card = document.createElement('div');
        card.className = "premium-card post-wrapper";
        card.innerHTML = `
            <div class="post-header"><span>// TIMELOG: ${date}</span></div>
            <p class="post-body">${escapeHtml(post.text)}</p>
            ${post.imageUrl ? `<img src="${post.imageUrl}" class="post-img">` : ''}
        `;
        feed.appendChild(card);
    });
});

// 3. SKOR LİSTESİ -> [users]
db.collection('users').orderBy('score', 'desc').limit(10).onSnapshot(snapshot => {
    const container = document.getElementById('leaderboardContainer');
    container.innerHTML = "";
    let rank = 1;
    snapshot.forEach(doc => {
        const u = doc.data();
        container.innerHTML += `
            <tr>
                <td style="color:var(--orange); font-weight:bold;">#${rank++}</td>
                <td>${escapeHtml(u.username || 'Anonim')}</td>
                <td style="color:var(--orange)">${u.score || 0} PTS</td>
            </tr>
        `;
    });
});

// 4. ANKET ALANI -> [polls]
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
                <h4 style="margin-bottom:15px;">${escapeHtml(poll.question)}</h4>
                <button class="poll-btn" onclick="addVote('${doc.id}', 'opt1')">
                    <div class="poll-fill" style="width: ${p1}%"></div>
                    <div class="poll-content"><span>${escapeHtml(poll.opt1)}</span><span>%${p1}</span></div>
                </button>
                <button class="poll-btn" onclick="addVote('${doc.id}', 'opt2')">
                    <div class="poll-fill" style="width: ${p2}%"></div>
                    <div class="poll-content"><span>${escapeHtml(poll.opt2)}</span><span>%${p2}</span></div>
                </button>
            </div>
        `;
    });
});

// 5. ADMİN GİRİŞ KONTROLÜ -> [admin_config]
function checkAdminAccess() {
    const pwd = document.getElementById('adminPassword').value;
    db.collection('admin_config').doc('system_config').get().then(doc => {
        if(doc.exists && doc.data().didogram_password === pwd) {
            isAdminAuthenticated = true;
            document.getElementById('adminAuthZone').style.display = 'none';
            document.getElementById('adminControlZone').style.display = 'block';
            syncAdminPendingFeed();
        } else {
            document.getElementById('authError').textContent = "Erişim Reddedildi: Geçersiz Yönetici Şifresi.";
        }
    });
}

function syncAdminPendingFeed() {
    db.collection('pending_posts').orderBy('timestamp', 'asc').onSnapshot(snapshot => {
        const container = document.getElementById('pendingPostsFeed');
        container.innerHTML = "";
        if(snapshot.empty) { container.innerHTML = "<p class='soft-text'>Şu an onay bekleyen herhangi bir itiraf yok.</p>"; return; }

        snapshot.forEach(doc => {
            const post = doc.data();
            const div = document.createElement('div');
            div.className = "admin-raw";
            div.innerHTML = `
                <p>${escapeHtml(post.text)}</p>
                ${post.imageUrl ? `<img src="${post.imageUrl}" style="width:100px; margin-top:10px; display:block; border-radius:6px;">` : ''}
                <div class="admin-actions">
                    <button class="btn-modern btn-orange" onclick="adminApprove('${doc.id}')">KABUL ET</button>
                    <button class="btn-modern btn-danger" onclick="adminReject('${doc.id}')">REDDET</button>
                </div>
            `;
            container.appendChild(div);
        });
    });
}

async function adminApprove(docId) {
    if(!isAdminAuthenticated) return;
    const ref = db.collection('pending_posts').doc(docId);
    const snap = await ref.get();
    if(snap.exists) {
        const d = snap.data();
        await db.collection('approved_posts').add({
            text: d.text,
            imageUrl: d.imageUrl,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        await ref.delete();
    }
}

function adminReject(docId) {
    if(!isAdminAuthenticated) return;
    db.collection('pending_posts').doc(docId).delete();
}

function escapeHtml(text) {
    if(!text) return "";
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
