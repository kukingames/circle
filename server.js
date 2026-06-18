const express = require('express');
const path = require('path');
const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/board');
const membersRoutes = require('./routes/members');
const reportsRoutes = require('./routes/reports');
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function cookieSession(req, res, next) {
  const cookieName = 'vs_session';
  req.session = {};
  if (req.headers.cookie) {
    const match = req.headers.cookie.split(';').find(c => c.trim().startsWith(cookieName + '='));
    if (match) {
      req.session.userId = decodeURIComponent(match.split('=')[1]);
    }
  }
  req.session.destroy = function() { req.session = {}; };
  next();
}

app.use(cookieSession);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/board', boardRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/admin', adminRoutes);

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`VORTEX STRIKE server running at http://localhost:${PORT}`);
});
