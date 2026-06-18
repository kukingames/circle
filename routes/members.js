const express = require('express');
const router = express.Router();
const { readJSON } = require('../database');

router.get('/', (req, res) => {
  const users = readJSON('users.json');
  const members = users.map(u => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    role: u.role,
    createdAt: u.createdAt
  }));
  res.json(members);
});

router.get('/:id', (req, res) => {
  const users = readJSON('users.json');
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'メンバーが見つかりません' });
  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt
  });
});

module.exports = router;
