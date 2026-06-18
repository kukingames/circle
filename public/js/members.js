function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function loadMembers() {
  try {
    const res = await fetch('/api/members');
    const members = await res.json();
    const container = document.getElementById('member-list');

    if (members.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>メンバーがまだいません</p></div>';
      return;
    }

    container.innerHTML = members.map(m => `
      <div class="member-card">
        <div class="member-avatar">${escapeHtml(m.displayName.charAt(0))}</div>
        <div class="member-name">${escapeHtml(m.displayName)}</div>
        <div class="member-role">${m.role === 'admin' ? '管理者' : 'メンバー'}</div>
      </div>
    `).join('');
  } catch (e) {
    document.getElementById('member-list').innerHTML = '<div class="empty-state"><p>読み込みエラー</p></div>';
  }
}

loadMembers();
