function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function loadBoard() {
  try {
    const res = await fetch('/api/board');
    const posts = await res.json();
    const container = document.getElementById('board-list');

    if (posts.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>まだ投稿がありません</p></div>';
      return;
    }

    container.innerHTML = posts.map(p => `
      <div class="card board-item">
        <h3 class="card-title">${escapeHtml(p.title)}</h3>
        <div class="card-meta">${new Date(p.createdAt).toLocaleDateString('ja-JP')} | ${escapeHtml(p.authorName)}</div>
        <div class="card-content">${escapeHtml(p.content)}</div>
        <div class="board-actions">
          <button class="btn btn-secondary" style="font-size:12px;padding:6px 12px" onclick="deletePost('${p.id}', '${p.authorId}')">削除</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    document.getElementById('board-list').innerHTML = '<div class="empty-state"><p>読み込みエラー</p></div>';
  }
}

function showBoardForm() {
  const area = document.getElementById('board-form-area');
  if (currentUser && ['admin', 'writer'].includes(currentUser.role)) {
    area.innerHTML = `
      <div class="card" style="margin-bottom:30px">
        <h3 style="margin-bottom:16px">新しい投稿</h3>
        <div id="board-alert"></div>
        <form id="board-form">
          <div class="form-group">
            <label for="board-title">タイトル</label>
            <input type="text" id="board-title" required>
          </div>
          <div class="form-group">
            <label for="board-content">内容</label>
            <textarea id="board-content" required></textarea>
          </div>
          <button type="submit" class="btn btn-primary">投稿する</button>
        </form>
      </div>
    `;
    document.getElementById('board-form').addEventListener('submit', submitBoardPost);
  } else {
    area.innerHTML = '<div class="card" style="margin-bottom:30px"><p>投稿するには <a href="/login.html">ログイン</a> が必要です</p></div>';
  }
}

async function submitBoardPost(e) {
  e.preventDefault();
  const title = document.getElementById('board-title').value;
  const content = document.getElementById('board-content').value;
  const alertEl = document.getElementById('board-alert');

  try {
    const res = await fetch('/api/board', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });
    if (res.ok) {
      document.getElementById('board-title').value = '';
      document.getElementById('board-content').value = '';
      loadBoard();
  } else if (currentUser) {
    area.innerHTML = '<div class="card" style="margin-bottom:30px"><p>投稿する権限がありません</p></div>';
  } else {
      const data = await res.json();
      alertEl.innerHTML = `<div class="alert alert-error">${data.error}</div>`;
    }
  } catch (e) {
    alertEl.innerHTML = '<div class="alert alert-error">投稿に失敗しました</div>';
  }
}

async function deletePost(id, authorId) {
  if (!currentUser) return alert('ログインが必要です');
  if (currentUser.id !== authorId && currentUser.role !== 'admin') {
    return alert('削除権限がありません');
  }
  if (!confirm('この投稿を削除しますか？')) return;

  await fetch(`/api/board/${id}`, { method: 'DELETE' });
  loadBoard();
}

authReady.then(() => {
  showBoardForm();
  loadBoard();
});
