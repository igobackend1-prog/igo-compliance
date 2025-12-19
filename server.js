
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
// Increased limit to handle base64 payment screenshots
app.use(bodyParser.json({ limit: '50mb' }));

/**
 * CENTRALIZED DATABASE (In-Memory for current demo)
 * To integrate Google Cloud Firestore:
 * 1. Install firebase-admin
 * 2. Replace these arrays with db.collection('name').get() calls
 */
let db = {
  projects: [],
  vendors: [],
  payments: [],
  audit: []
};

// --- API Routes ---

// Projects
app.get('/api/projects', (req, res) => res.json(db.projects));
app.post('/api/projects', (req, res) => {
  db.projects.push(req.body);
  res.status(201).json(req.body);
});

// Vendors
app.get('/api/vendors', (req, res) => res.json(db.vendors));
app.post('/api/vendors', (req, res) => {
  db.vendors.push(req.body);
  res.status(201).json(req.body);
});

// Payments
app.get('/api/payments', (req, res) => res.json(db.payments));
app.post('/api/payments', (req, res) => {
  db.payments.unshift(req.body);
  res.status(201).json(req.body);
});

app.patch('/api/payments/:id', (req, res) => {
  const { id } = req.params;
  const update = req.body;
  db.payments = db.payments.map(p => p.id === id ? { ...p, ...update } : p);
  res.json({ success: true });
});

// Audit Logs
app.get('/api/audit', (req, res) => res.json(db.audit));
app.post('/api/audit', (req, res) => {
  db.audit.unshift(req.body);
  res.status(201).json(req.body);
});

// Health Check
app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => {
  console.log(`IGO COMPLIANCE Centralized Server running on port ${PORT}`);
});
