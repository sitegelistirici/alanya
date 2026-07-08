// app.js
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// Variables
let currentTab = 'home';
let isAdminLoggedIn = false;
let adminPassword = '';

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    loadAllData();
});

// Sidebar
function initSidebar() {
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
    
    // Nav clicks
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.getAttribute('data-tab');
            switchTab(tab);
            
            // Close mobile sidebar
            if (window.innerWidth < 768) {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            }
        });
    });
}

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.getElementById(tab).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-tab') === tab) {
            item.classList.add('active');
        }
    });
    
    currentTab = tab;
    
    // Refresh data if needed
    if (tab === 'confessions') loadApprovedPosts();
    if (tab === 'polls') loadPolls();
    if (tab === 'leaders') loadLeaders();
    if (tab === 'admin' && isAdminLoggedIn) loadPendingPosts();
}

// Escape HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Load All Data
function loadAllData() {
    loadApprovedPosts();
    loadPolls();
    loadLeaders();
}

// İtiraflar
async function loadApprovedPosts() {
    const container = document.getElementById('confessions-list');
    container.innerHTML = '<p style="color:#666; text-align:center; padding:40px;">Yükleniyor...</p>';
    
    try {
        const snapshot = await db.collection('approved_posts')
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get();
        
        container.innerHTML = '';
        
        if (snapshot.empty) {
            container.innerHTML = '<p style="color:#888; text-align:center; padding:60px;">Henüz onaylanmış itiraf yok.</p>';
            return;
        }
        
        snapshot.forEach(doc => {
            const post = doc.data();
            const postEl = document.createElement('div');
            postEl.className = 'post-card';
            postEl.innerHTML = `
                \( {post.imageUrl ? `<img src=" \){post.imageUrl}" class="post-image" alt="İtiraf görseli">` : ''}
                <div class="post-content">
                    <p class="post-text">${escapeHtml(post.text)}</p>
                    <p class="post-time">${new Date(post.timestamp?.toDate()).toLocaleDateString('tr-TR')}</p>
                </div>
            `;
            container.appendChild(postEl);
        });
    } catch (e) {
        console.error(e);
        container.innerHTML = '<p style="color:#f66; text-align:center;">Bir hata oluştu.</p>';
    }
}

// Submit Post
async function submitPost() {
    const text = document.getElementById('post-text').value.trim();
    const fileInput = document.getElementById('image-input');
    
    if (!text) {
        alert('Lütfen bir itiraf yazın.');
        return;
    }
    
    let imageUrl = '';
    
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        imageUrl = await uploadToImgBB(file);
    }
    
    try {
        await db.collection('pending_posts').add({
            text: text,
            imageUrl: imageUrl,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('İtirafınız başarıyla gönderildi. Onaylandıktan sonra yayınlanacak.');
        document.getElementById('post-text').value = '';
        document.getElementById('file-name').textContent = 'Görsel ekle (isteğe bağlı)';
        fileInput.value = '';
        
        switchTab('confessions');
    } catch (e) {
        console.error(e);
        alert('Gönderme sırasında bir hata oluştu.');
    }
}

// ImgBB Upload
async function uploadToImgBB(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const res = await fetch('https://api.imgbb.com/1/upload?key=26385eefa0d44dc1f5bad224ced5d83d', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        return data.data.url;
    } catch (e) {
        console.error(e);
        return '';
    }
}

// Image Input Display
document.getElementById('image-input').addEventListener('change', function() {
    if (this.files.length > 0) {
        document.getElementById('file-name').textContent = this.files[0].name;
    }
});

// Polls
async function loadPolls() {
    const container = document.getElementById('polls-list');
    container.innerHTML = '';
    
    try {
        const snapshot = await db.collection('polls').get();
        
        if (snapshot.empty) {
            container.innerHTML = '<p style="color:#888; text-align:center;">Aktif anket bulunmuyor.</p>';
            return;
        }
        
        snapshot.forEach(doc => {
            const poll = doc.data();
            const pollId = doc.id;
            
            const totalVotes = (poll.votesOpt1 || 0) + (poll.votesOpt2 || 0);
            const perc1 = totalVotes ? Math.round((poll.votesOpt1 / totalVotes) * 100) : 0;
            const perc2 = totalVotes ? Math.round((poll.votesOpt2 / totalVotes) * 100) : 0;
            
            const pollEl = document.createElement('div');
            pollEl.className = 'poll-card';
            pollEl.innerHTML = `
                <div class="poll-question">${escapeHtml(poll.question)}</div>
                
                <div class="poll-option" onclick="vote('${pollId}', 1)">
                    <div class="poll-label">
                        <span>${escapeHtml(poll.opt1)}</span>
                        <span>${perc1}%</span>
                    </div>
                    <div class="poll-bar">
                        <div class="poll-fill" style="width: ${perc1}%"></div>
                    </div>
                </div>
                
                <div class="poll-option" onclick="vote('${pollId}', 2)">
                    <div class="poll-label">
                        <span>${escapeHtml(poll.opt2)}</span>
                        <span>${perc2}%</span>
                    </div>
                    <div class="poll-bar">
                        <div class="poll-fill" style="width: ${perc2}%"></div>
                    </div>
                </div>
            `;
            container.appendChild(pollEl);
        });
    } catch (e) {
        console.error(e);
    }
}

async function vote(pollId, option) {
    try {
        const pollRef = db.collection('polls').doc(pollId);
        
        if (option === 1) {
            await pollRef.update({
                votesOpt1: firebase.firestore.FieldValue.increment(1)
            });
        } else {
            await pollRef.update({
                votesOpt2: firebase.firestore.FieldValue.increment(1)
            });
        }
        
        loadPolls();
    } catch (e) {
        console.error(e);
    }
}

// Leaders
async function loadLeaders() {
    const container = document.getElementById('leaders-list');
    container.innerHTML = '';
    
    try {
        const snapshot = await db.collection('users')
            .orderBy('score', 'desc')
            .limit(10)
            .get();
        
        let rank = 1;
        snapshot.forEach(doc => {
            const user = doc.data();
            const row = document.createElement('div');
            row.className = 'leader-row';
            row.innerHTML = `
                <div class="rank">#${rank}</div>
                <div class="leader-name">${escapeHtml(user.username)}</div>
                <div class="leader-score">${user.score} puan</div>
            `;
            container.appendChild(row);
            rank++;
        });
    } catch (e) {
        console.error(e);
    }
}

// ADMIN
async function loginAdmin() {
    const inputPass = document.getElementById('admin-password').value;
    
    try {
        const configDoc = await db.collection('admin_config').doc('system_config').get();
        if (!configDoc.exists) {
            alert('Sistem yapılandırması bulunamadı.');
            return;
        }
        
        const realPass = configDoc.data().didogram_password;
        
        if (inputPass === realPass) {
            isAdminLoggedIn = true;
            document.getElementById('admin-login').classList.add('hidden');
            document.getElementById('admin-panel').classList.remove('hidden');
            loadPendingPosts();
        } else {
            alert('Hatalı şifre!');
        }
    } catch (e) {
        console.error(e);
        alert('Bağlantı hatası.');
    }
}

async function loadPendingPosts() {
    const container = document.getElementById('pending-list');
    container.innerHTML = '';
    
    try {
        const snapshot = await db.collection('pending_posts')
            .orderBy('timestamp', 'desc')
            .get();
        
        if (snapshot.empty) {
            container.innerHTML = '<p style="color:#888; text-align:center; padding:60px;">Onay bekleyen itiraf yok.</p>';
            return;
        }
        
        snapshot.forEach(doc => {
            const post = doc.data();
            const postId = doc.id;
            
            const el = document.createElement('div');
            el.className = 'post-card admin-post';
            el.innerHTML = `
                \( {post.imageUrl ? `<img src=" \){post.imageUrl}" class="post-image" alt="">` : ''}
                <div class="post-content">
                    <p class="post-text">${escapeHtml(post.text)}</p>
                    <div style="display:flex; gap:12px; margin-top:20px;">
                        <button onclick="approvePost('${postId}')" style="background:#22c55e; flex:1; padding:12px; border:none; border-radius:12px; color:white; font-weight:600; cursor:pointer;">KABUL ET</button>
                        <button onclick="rejectPost('${postId}')" style="background:#ef4444; flex:1; padding:12px; border:none; border-radius:12px; color:white; font-weight:600; cursor:pointer;">REDDET</button>
                    </div>
                </div>
            `;
            container.appendChild(el);
        });
    } catch (e) {
        console.error(e);
    }
}

async function approvePost(postId) {
    try {
        const postDoc = await db.collection('pending_posts').doc(postId).get();
        const postData = postDoc.data();
        
        await db.collection('approved_posts').add({
            text: postData.text,
            imageUrl: postData.imageUrl,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await db.collection('pending_posts').doc(postId).delete();
        
        loadPendingPosts();
        loadApprovedPosts();
    } catch (e) {
        console.error(e);
    }
}

async function rejectPost(postId) {
    if (!confirm('Bu itirafı silmek istediğinizden emin misiniz?')) return;
    
    try {
        await db.collection('pending_posts').doc(postId).delete();
        loadPendingPosts();
    } catch (e) {
        console.error(e);
    }
}

// Keyboard support for admin
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    }
});
