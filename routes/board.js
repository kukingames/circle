const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, generateId } = require('../database');

router.get('/', (req, res) => {
  const posts = readJSON('board.json');
  const users = readJSON('users.json');
  const enriched = posts.map(p => {
    const author = users.find(u => u.id === p.authorId);
    return { ...p, authorName: author ? author.displayName : '不明' };
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(enriched);
});

router.post('/', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'ログインが必要です' });
  }
  const { title, content } = req.body;
  const posts = readJSON('board.json');
  const post = {
    id: generateId(),
    title,
    content,
    authorId: req.session.userId,
    createdAt: new Date().toISOString()
  };
  posts.push(post);
  writeJSON('board.json', posts);
  res.json(post);
});

router.delete('/:id', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'ログインが必要です' });
  }
  const posts = readJSON('board.json');
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: '投稿が見つかりません' });
  if (post.authorId !== req.session.userId) {
    const users = readJSON('users.json');
    const user = users.find(u => u.id === req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: '権限がありません' });
    }
  }
  writeJSON('board.json', posts.filter(p => p.id !== req.params.id));
  res.json({ message: '削除しました' });
});

module.exports = router;
