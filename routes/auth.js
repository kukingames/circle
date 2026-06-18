const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { readJSON, writeJSON, generateId } = require('../database');

router.post('/register', (req, res) => {
  const { username, email, password, displayName } = req.body;
  const users = readJSON('users.json');

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'このメールアドレスは既に登録されています' });
  }
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'このユーザー名は既に使用されています' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const user = {
    id: generateId(),
    username,
    email,
    password: hash,
    displayName: displayName || username,
    role: 'member',
    createdAt: new Date().toISOString()
  };

  users.push(user);
  writeJSON('users.json', users);

  req.session.userId = user.id;
  res.cookie('vs_session', user.id, {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
  });
  res.json({ user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const users = readJSON('users.json');
  const user = users.find(u => u.email === email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
  }

  req.session.userId = user.id;
  res.cookie('vs_session', user.id, {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
  });
  res.json({ user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role } });
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.clearCookie('vs_session');
  res.json({ message: 'ログアウトしました' });
});

router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: '未ログイン' });
  }
  const users = readJSON('users.json');
  const user = users.find(u => u.id === req.session.userId);
  if (!user) {
    return res.status(401).json({ error: 'ユーザーが見つかりません' });
  }
  res.json({ user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role, email: user.email } });
});

router.put('/profile', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'ログインが必要です' });
  }
  const { displayName, email, currentPassword, newPassword } = req.body;
  const users = readJSON('users.json');
  const userIndex = users.findIndex(u => u.id === req.session.userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'ユーザーが見つかりません' });
  }

  if (email && email !== users[userIndex].email) {
    if (users.find(u => u.email === email && u.id !== req.session.userId)) {
      return res.status(400).json({ error: 'このメールアドレスは既に使用されています' });
    }
    users[userIndex].email = email;
  }

  if (displayName) {
    users[userIndex].displayName = displayName;
  }

  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({ error: '現在のパスワードを入力してください' });
    }
    if (!bcrypt.compareSync(currentPassword, users[userIndex].password)) {
      return res.status(400).json({ error: '現在のパスワードが正しくありません' });
    }
    users[userIndex].password = bcrypt.hashSync(newPassword, 10);
  }

  writeJSON('users.json', users);
  res.json({ user: { id: users[userIndex].id, username: users[userIndex].username, displayName: users[userIndex].displayName, role: users[userIndex].role } });
});

module.exports = router;
