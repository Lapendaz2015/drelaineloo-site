require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const sendEnquiry = require('./api/send-enquiry');

const app = express();
const PORT = process.env.PORT || 3008;
const ROOT = __dirname;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Remove trailing slashes (vercel trailingSlash: false)
app.use((req, res, next) => {
  if (req.path !== '/' && req.path.endsWith('/')) {
    const clean = req.path.slice(0, -1);
    return res.redirect(301, clean + (req.url.slice(req.path.length) || ''));
  }
  next();
});

// Permanent redirects from vercel.json
app.get('/home', (req, res) => res.redirect(301, '/'));

// Redirect any *.html path to the clean URL
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    const clean = req.path.slice(0, -5) || '/';
    return res.redirect(301, clean);
  }
  next();
});

// API
app.post('/api/send-enquiry', sendEnquiry);

// Root
app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));

// Clean URLs: /about_me → about_me.html
app.use((req, res, next) => {
  if (path.extname(req.path)) return next();
  const htmlFile = path.join(ROOT, req.path + '.html');
  if (fs.existsSync(htmlFile)) return res.sendFile(htmlFile);
  next();
});

// Static assets (css, js, images, etc.)
app.use(express.static(ROOT, { index: false }));

app.use((req, res) => res.status(404).sendFile(path.join(ROOT, 'index.html')));

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
