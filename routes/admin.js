const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcryptjs');
const { readJSON, writeJSON, generateId } = require('../database');

function isAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'ログインが必要です' });
  }
  const users = readJSON('users.json');
  const user = users.find(u => u.id === req.session.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: '管理者権限がありません' });
  }
  req.adminUser = user;
  next();
}

router.get('/page', isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'admin.html'));
});

router.get('/users', isAdmin, (req, res) => {
  const users = readJSON('users.json');
  const members = users.map(u => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt
  }));
  res.json(members);
});

router.post('/users', isAdmin, (req, res) => {
  const { username, email, password, displayName, role } = req.body;
  const users = readJSON('users.json');

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'ユーザー名、メールアドレス、パスワードは必須です' });
  }
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'このメールアドレスは既に使用されています' });
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
    role: ['admin', 'member', 'writer'].includes(role) ? role : 'member',
    createdAt: new Date().toISOString()
  };

  users.push(user);
  writeJSON('users.json', users);
  res.json({ user: { id: user.id, username: user.username, displayName: user.displayName, email: user.email, role: user.role } });
});

router.put('/users/:id/role', isAdmin, (req, res) => {
  const { role } = req.body;
  if (!['admin', 'member', 'writer'].includes(role)) {
    return res.status(400).json({ error: '無効な役割です' });
  }
  const users = readJSON('users.json');
  const userIndex = users.findIndex(u => u.id === req.params.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'ユーザーが見つかりません' });
  }
  users[userIndex].role = role;
  writeJSON('users.json', users);
  res.json({ message: '役割を更新しました' });
});

router.delete('/users/:id', isAdmin, (req, res) => {
  if (req.params.id === req.session.userId) {
    return res.status(400).json({ error: '自分自身を削除することはできません' });
  }
  const users = readJSON('users.json');
  const filtered = users.filter(u => u.id !== req.params.id);
  if (filtered.length === users.length) {
    return res.status(404).json({ error: 'ユーザーが見つかりません' });
  }
  writeJSON('users.json', filtered);
  res.json({ message: 'ユーザーを削除しました' });
});

router.get('/contacts', isAdmin, (req, res) => {
  const contacts = readJSON('contacts.json');
  res.json(contacts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

router.delete('/contacts/:id', isAdmin, (req, res) => {
  const contacts = readJSON('contacts.json');
  const filtered = contacts.filter(c => c.id !== req.params.id);
  if (filtered.length === contacts.length) {
    return res.status(404).json({ error: 'お問い合わせが見つかりません' });
  }
  writeJSON('contacts.json', filtered);
  res.json({ message: 'お問い合わせを削除しました' });
});

router.get('/stats', isAdmin, (req, res) => {
  const users = readJSON('users.json');
  const posts = readJSON('board.json');
  const reports = readJSON('reports.json');
  const contacts = readJSON('contacts.json');
  res.json({
    totalUsers: users.length,
    totalPosts: posts.length,
    totalReports: reports.length,
    totalContacts: contacts.length
  });
});

module.exports = router;
