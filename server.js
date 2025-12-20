
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Firestore } = require('@google-cloud/firestore');

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Firestore
// It will automatically use the Service Account credentials if running on Cloud Run
const firestore = new Firestore();

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Helper to get all documents from a collection
async function getCollectionData(collectionName) {
  const snapshot = await firestore.collection(collectionName).get();
  const data = [];
  snapshot.forEach(doc => data.push(doc.data()));
  return data;
}

app.get('/api/sync', async (req, res) => {
  try {
    const projects = await getCollectionData('projects');
    const requests = await getCollectionData('requests');
    const auditLogs = await getCollectionData('auditLogs');
    
    // Sort requests by timestamp descending
    requests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    auditLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ projects, requests, auditLogs });
  } catch (error) {
    console.error('Sync Error:', error);
    res.status(500).json({ error: 'Failed to sync with Firestore' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const project = req.body;
    await firestore.collection('projects').doc(project.id).set(project);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Firestore write failed' });
  }
});

app.post('/api/requests', async (req, res) => {
  try {
    const request = req.body;
    await firestore.collection('requests').doc(request.id).set(request);
    
    const log = {
      id: `LOG-${Date.now()}`,
      action: `INITIATED: ${request.purpose}`,
      paymentId: request.id,
      user: request.raisedBy,
      role: request.raisedByRole,
      department: request.raisedByDepartment,
      timestamp: new Date().toISOString()
    };
    await firestore.collection('auditLogs').doc(log.id).set(log);
    
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: 'Firestore write failed' });
  }
});

app.patch('/api/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    await firestore.collection('requests').doc(id).update(updateData);
    
    const log = {
      id: `LOG-${Date.now()}`,
      action: `STATUS_UPDATE: ${updateData.status}`,
      paymentId: id,
      user: 'SYSTEM',
      role: 'SYSTEM',
      timestamp: new Date().toISOString()
    };
    await firestore.collection('auditLogs').doc(log.id).set(log);
    
    res.json({ id, ...updateData });
  } catch (error) {
    res.status(500).json({ error: 'Firestore update failed' });
  }
});

app.delete('/api/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await firestore.collection('requests').doc(id).delete();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Firestore delete failed' });
  }
});

app.use(express.static(path.join(__dirname)));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

app.listen(PORT, () => console.log(`IGO GATEWAY (CLOUD ENABLED): PORT ${PORT}`));
