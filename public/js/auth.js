let currentUser = null;
let _authResolve;
const authReady = new Promise(resolve => { _authResolve = resolve; });

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
    }
  } catch (e) {}
  updateAuthNav();
  _authResolve();
}

function updateAuthNav() {
  const navEl = document.getElementById('auth-nav');
  if (!navEl) return;

  if (currentUser) {
    const adminLink = currentUser.role === 'admin'
      ? '<a href="/api/admin/page">管理者ページ</a>'
      : '';
    navEl.innerHTML = `
      <div class="user-menu">
        <button class="user-menu-toggle" onclick="toggleUserMenu()">
          <span>${escapeHtml(currentUser.displayName)}</span>
          <span style="opacity:0.6">▼</span>
        </button>
        <div class="user-dropdown" id="user-dropdown">
          <a href="/mypage.html">マイページ</a>
          ${adminLink}
          <hr>
          <button onclick="logout()">ログアウト</button>
        </div>
      </div>
    `;
  } else {
    navEl.innerHTML = '<a href="/login.html" class="btn btn-primary" style="padding:8px 20px;font-size:14px">ログイン</a>';
  }
}

function toggleUserMenu() {
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown) dropdown.classList.toggle('show');
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  window.location.href = '/';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('user-dropdown');
  const toggle = document.querySelector('.user-menu-toggle');
  if (dropdown && !toggle?.contains(e.target)) {
    dropdown.classList.remove('show');
  }
});

checkAuth();
