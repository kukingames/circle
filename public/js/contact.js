function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.getElementById('contact-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const subject = document.getElementById('subject').value;
  const message = document.getElementById('message').value;
  const alertEl = document.getElementById('alert');

  try {
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message })
    });
    const data = await res.json();
    if (res.ok) {
      alertEl.innerHTML = '<div class="alert alert-success">お問い合わせを受け付けました</div>';
      document.getElementById('contact-form').reset();
    } else {
      alertEl.innerHTML = `<div class="alert alert-error">${data.error}</div>`;
    }
  } catch (e) {
    alertEl.innerHTML = '<div class="alert alert-error">送信に失敗しました</div>';
  }
});
