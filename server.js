
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

/**
 * MASTER ORGANIZATIONAL STATE
 * In-memory global synchronization object.
 */
let db = {
  projects: [],
  vendors: [],
  requests: [],
  auditLogs: []
};

// API ENDPOINTS
app.get('/api/sync', (req, res) => {
  res.json(db);
});

app.post('/api/projects', (req, res) => {
  db.projects.push(req.body);
  res.status(201).json(req.body);
});

app.post('/api/vendors', (req, res) => {
  db.vendors.push(req.body);
  res.status(201).json(req.body);
});

app.post('/api/requests', (req, res) => {
  db.requests.unshift(req.body);
  const log = {
    id: `LOG-${Date.now()}`,
    action: `Payment Request Initiated: ${req.body.purpose}`,
    paymentId: req.body.id,
    user: req.body.raisedBy,
    role: 'BACKEND',
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);
  res.status(201).json(req.body);
});

app.patch('/api/requests/:id', (req, res) => {
  const { id } = req.params;
  const index = db.requests.findIndex(r => r.id === id);
  if (index !== -1) {
    db.requests[index] = { ...db.requests[index], ...req.body };
    res.json(db.requests[index]);
  } else {
    res.status(404).json({ error: 'Request not found' });
  }
});

// SERVE STATIC FILES
app.use(express.static(path.join(__dirname)));

// ALWAYS SERVE INDEX.HTML FOR NON-API ROUTES
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`
  IGO COMPLIANCE: CLOUD GATEWAY ACTIVE
  Project: gen-lang-client-0829363952
  Port: ${PORT}
  ---------------------------------------
  `);
});
