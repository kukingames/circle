const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, generateId } = require('../database');

router.post('/', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: '必須項目を入力してください' });
  }
  const contacts = readJSON('contacts.json');
  const contact = {
    id: generateId(),
    name,
    email,
    subject: subject || '',
    message,
    createdAt: new Date().toISOString()
  };
  contacts.push(contact);
  writeJSON('contacts.json', contacts);
  res.json({ message: 'お問い合わせを受け付けました' });
});

router.get('/', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'ログインが必要です' });
  }
  const contacts = readJSON('contacts.json');
  res.json(contacts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

module.exports = router;
