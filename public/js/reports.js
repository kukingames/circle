function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function loadReports() {
  try {
    const res = await fetch('/api/reports');
    const reports = await res.json();
    const container = document.getElementById('report-list');

    if (reports.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>まだ活動報告がありません</p></div>';
      return;
    }

    container.innerHTML = reports.map(r => `
      <div class="card">
        <h3 class="card-title">${escapeHtml(r.title)}</h3>
        <div class="card-meta">${new Date(r.activityDate || r.createdAt).toLocaleDateString('ja-JP')} | ${escapeHtml(r.authorName)}</div>
        <div class="card-content">${escapeHtml(r.content).substring(0, 200)}...</div>
        <a href="/report-detail.html?id=${r.id}" class="btn btn-secondary" style="margin-top:12px">続きを読む</a>
      </div>
    `).join('');
  } catch (e) {
    document.getElementById('report-list').innerHTML = '<div class="empty-state"><p>読み込みエラー</p></div>';
  }
}

function showReportForm() {
  const area = document.getElementById('report-form-area');
  if (currentUser && ['admin', 'writer'].includes(currentUser.role)) {
    area.innerHTML = `
      <div class="card" style="margin-bottom:30px">
        <h3 style="margin-bottom:16px">新しい活動報告</h3>
        <div id="report-alert"></div>
        <form id="report-form">
          <div class="form-group">
            <label for="report-date">活動日</label>
            <input type="date" id="report-date" required>
          </div>
          <div class="form-group">
            <label for="report-title">タイトル</label>
            <input type="text" id="report-title" required>
          </div>
          <div class="form-group">
            <label for="report-content">内容</label>
            <textarea id="report-content" required></textarea>
          </div>
          <button type="submit" class="btn btn-primary">投稿する</button>
        </form>
      </div>
    `;
    document.getElementById('report-date').valueAsDate = new Date();
    document.getElementById('report-form').addEventListener('submit', submitReport);
  } else if (currentUser) {
    area.innerHTML = '<div class="card" style="margin-bottom:30px"><p>投稿する権限がありません</p></div>';
  } else {
    area.innerHTML = '<div class="card" style="margin-bottom:30px"><p>投稿するには <a href="/login.html">ログイン</a> が必要です</p></div>';
  }
}

async function submitReport(e) {
  e.preventDefault();
  const date = document.getElementById('report-date').value;
  const title = document.getElementById('report-title').value;
  const content = document.getElementById('report-content').value;
  const alertEl = document.getElementById('report-alert');

  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, activityDate: date })
    });
    if (res.ok) {
      document.getElementById('report-date').valueAsDate = new Date();
      document.getElementById('report-title').value = '';
      document.getElementById('report-content').value = '';
      loadReports();
    } else {
      const data = await res.json();
      alertEl.innerHTML = `<div class="alert alert-error">${data.error}</div>`;
    }
  } catch (e) {
    alertEl.innerHTML = '<div class="alert alert-error">投稿に失敗しました</div>';
  }
}

authReady.then(() => {
  showReportForm();
  loadReports();
});
