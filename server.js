
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

/**
 * PRODUCTION FILE SERVING
 * This section ensures that index.html is served for all frontend routes.
 * This is the critical fix for "404 File Not Found" errors.
 */
app.use(express.static(path.join(__dirname, '.')));

// API Placeholder (Real data is handled by Firestore via apiService.ts)
app.get('/api/health', (req, res) => res.json({ status: 'CLOUDRUN_ACTIVE' }));

// The "Catch-All" handler: for any request that doesn't match an API or static file,
// send back index.html. This enables React Router/SPA functionality.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`IGO COMPLIANCE: Cloud Native Gateway active on port ${PORT}`);
});
