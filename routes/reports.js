const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, generateId } = require('../database');

router.get('/', (req, res) => {
  const reports = readJSON('reports.json');
  const users = readJSON('users.json');
  const enriched = reports.map(r => {
    const author = users.find(u => u.id === r.authorId);
    return { ...r, authorName: author ? author.displayName : '不明' };
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(enriched);
});

router.get('/:id', (req, res) => {
  const reports = readJSON('reports.json');
  const users = readJSON('users.json');
  const report = reports.find(r => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: '活動報告が見つかりません' });
  const author = users.find(u => u.id === report.authorId);
  res.json({ ...report, authorName: author ? author.displayName : '不明' });
});

router.post('/', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'ログインが必要です' });
  }
  const users = readJSON('users.json');
  const user = users.find(u => u.id === req.session.userId);
  if (!user || !['admin', 'writer'].includes(user.role)) {
    return res.status(403).json({ error: '投稿する権限がありません' });
  }
  const { title, content, imageUrl, activityDate } = req.body;
  const reports = readJSON('reports.json');
  const report = {
    id: generateId(),
    title,
    content,
    imageUrl: imageUrl || '',
    activityDate: activityDate || new Date().toISOString().split('T')[0],
    authorId: req.session.userId,
    createdAt: new Date().toISOString()
  };
  reports.push(report);
  writeJSON('reports.json', reports);
  res.json(report);
});

router.delete('/:id', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'ログインが必要です' });
  }
  const reports = readJSON('reports.json');
  const report = reports.find(r => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: '活動報告が見つかりません' });
  if (report.authorId !== req.session.userId) {
    const users = readJSON('users.json');
    const user = users.find(u => u.id === req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: '権限がありません' });
    }
  }
  writeJSON('reports.json', reports.filter(r => r.id !== req.params.id));
  res.json({ message: '削除しました' });
});

module.exports = router;
