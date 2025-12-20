# Backend API Integration Guide

## Overview

The IGO Approval System uses a RESTful API architecture with a React frontend consuming an Express.js backend powered by Google Firestore.

## API Endpoints

### Base URL
```
Production: https://igo-approval-<region>.run.app
Local Dev: http://localhost:8080
```

### 1. Sync State (GET /api/sync)

Retrieve complete application state including all projects, payment requests, and audit logs.

**Request:**
```bash
curl -X GET http://localhost:8080/api/sync
```

**Response:**
```json
{
  "projects": [
    {
      "id": "proj-001",
      "name": "Project Alpha",
      "description": "...",
      "status": "active"
    }
  ],
  "requests": [
    {
      "id": "req-001",
      "projectId": "proj-001",
      "amount": 50000,
      "purpose": "Office supplies",
      "status": "PENDING_L1",
      "raisedBy": "user@example.com",
      "raisedByRole": "REQUESTER",
      "raisedByDepartment": "IT",
      "timestamp": "2025-12-20T10:30:00Z"
    }
  ],
  "auditLogs": [
    {
      "id": "LOG-1702991400000",
      "action": "INITIATED: Office supplies",
      "paymentId": "req-001",
      "user": "user@example.com",
      "role": "REQUESTER",
      "department": "IT",
      "timestamp": "2025-12-20T10:30:00Z"
    }
  ]
}
```

### 2. Create Project (POST /api/projects)

Create a new project in the system.

**Request:**
```bash
curl -X POST http://localhost:8080/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "id": "proj-002",
    "name": "Project Beta",
    "description": "Q1 2025 Initiative",
    "budget": 100000,
    "status": "active",
    "owner": "manager@example.com"
  }'
```

**Response:**
```json
{
  "id": "proj-002",
  "name": "Project Beta",
  "description": "Q1 2025 Initiative",
  "budget": 100000,
  "status": "active",
  "owner": "manager@example.com"
}
```

### 3. Create Payment Request (POST /api/requests)

Initiate a new payment request for approval.

**Request:**
```bash
curl -X POST http://localhost:8080/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "id": "req-002",
    "projectId": "proj-002",
    "amount": 75000,
    "purpose": "Equipment purchase",
    "vendor": "TechSupply Co.",
    "invoiceNumber": "INV-2025-001",
    "costCenter": "CC-IT-001",
    "raisedBy": "requester@example.com",
    "raisedByRole": "REQUESTER",
    "raisedByDepartment": "IT",
    "timestamp": "2025-12-20T11:00:00Z",
    "status": "PENDING_L1"
  }'
```

**Response:**
```json
{
  "id": "req-002",
  "projectId": "proj-002",
  "amount": 75000,
  "purpose": "Equipment purchase",
  "status": "PENDING_L1",
  "timestamp": "2025-12-20T11:00:00Z"
}
```

Auto-generated Audit Log:
```json
{
  "id": "LOG-1702991400001",
  "action": "INITIATED: Equipment purchase",
  "paymentId": "req-002",
  "user": "requester@example.com",
  "role": "REQUESTER",
  "timestamp": "2025-12-20T11:00:00Z"
}
```

### 4. Update Request Status (PATCH /api/requests/:id)

Update the status of a payment request (approve, reject, escalate, etc.).

**Request:**
```bash
curl -X PATCH http://localhost:8080/api/requests/req-002 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PENDING_L2",
    "approvedBy": "l1-approver@example.com",
    "approverRole": "L1_APPROVER",
    "comments": "Forward to L2 for final approval"
  }'
```

**Response:**
```json
{
  "id": "req-002",
  "status": "PENDING_L2",
  "approvedBy": "l1-approver@example.com",
  "approverRole": "L1_APPROVER",
  "comments": "Forward to L2 for final approval"
}
```

Auto-generated Audit Log:
```json
{
  "id": "LOG-1702991400002",
  "action": "STATUS_UPDATE: PENDING_L2",
  "paymentId": "req-002",
  "user": "SYSTEM",
  "role": "SYSTEM",
  "timestamp": "2025-12-20T11:15:00Z"
}
```

### 5. Delete Payment Request (DELETE /api/requests/:id)

Delete/cancel a payment request from the system.

**Request:**
```bash
curl -X DELETE http://localhost:8080/api/requests/req-002
```

**Response:**
```
204 No Content
```

## Request Status Workflow

```
PENDING_L1
    ↓
  APPROVED_L1 or REJECTED_L1
    ↓
PENDING_L2
    ↓
  APPROVED_L2 or REJECTED_L2
    ↓
Pending Thresholds
    ↓
APPROVED or REJECTED or CUTOFF
```

### Status Definitions

- **PENDING_L1**: Awaiting Level 1 Approver review
- **APPROVED_L1**: Approved by Level 1, moving to Level 2
- **REJECTED_L1**: Rejected at Level 1 (terminal)
- **PENDING_L2**: Awaiting Level 2 Approver review
- **APPROVED_L2**: Approved by Level 2, ready for payment
- **REJECTED_L2**: Rejected at Level 2 (terminal)
- **PENDING_CUTOFF**: Above amount threshold, requires director approval
- **APPROVED**: Final approval granted, ready for payment
- **REJECTED**: Request rejected (terminal)
- **CUTOFF**: Request exceeds maximum allowable amount (terminal)

## Frontend Integration (apiService.ts)

The frontend API service handles:

```typescript
// Initialize connection
const state = await api.getFullState();

// Create project
await api.createProject({
  id: 'proj-123',
  name: 'New Project'
});

// Create payment request
await api.createRequest({
  id: 'req-123',
  amount: 50000,
  purpose: 'Office supplies'
});

// Update status
await api.updateRequestStatus('req-123', 'PENDING_L2', {
  approvedBy: 'approver@example.com'
});

// Delete request
await api.deleteRequest('req-123');

// Check connection
const isConnected = api.getCloudStatus();
```

## Error Handling

All endpoints follow standard HTTP status codes:

- **200**: Success
- **201**: Created
- **204**: No Content (successful deletion)
- **400**: Bad Request (malformed data)
- **500**: Server Error (Firestore connection issue)

**Error Response:**
```json
{
  "error": "Firestore write failed"
}
```

## Firestore Data Model

### Collections Structure

```
Firestore Database
├── projects/ (Collection)
│   ├── proj-001 (Document)
│   │   ├── id: string
│   │   ├── name: string
│   │   ├── description: string
│   │   ├── budget: number
│   │   ├── status: "active" | "inactive"
│   │   └── owner: string
│
├── requests/ (Collection)
│   ├── req-001 (Document)
│   │   ├── id: string
│   │   ├── projectId: string
│   │   ├── amount: number
│   │   ├── purpose: string
│   │   ├── vendor: string
│   │   ├── invoiceNumber: string
│   │   ├── costCenter: string
│   │   ├── raisedBy: string
│   │   ├── raisedByRole: string (REQUESTER, L1_APPROVER, L2_APPROVER, DIRECTOR)
│   │   ├── raisedByDepartment: string
│   │   ├── status: string (See Status Workflow)
│   │   ├── timestamp: ISO 8601 string
│   │   └── comments: string (optional)
│
└── auditLogs/ (Collection)
    ├── LOG-1702991400000 (Document)
    │   ├── id: string (LOG-{timestamp})
    │   ├── action: string
    │   ├── paymentId: string
    │   ├── user: string
    │   ├── role: string
    │   ├── department: string (optional)
    │   └── timestamp: ISO 8601 string
```

## Testing the API

### Using cURL

```bash
# Test connection
curl -X GET http://localhost:8080/api/sync

# Create test project
curl -X POST http://localhost:8080/api/projects \
  -H "Content-Type: application/json" \
  -d '{"id": "test-proj", "name": "Test Project"}'
```

### Using Postman

1. Import the API collection
2. Set environment variable: `base_url = http://localhost:8080`
3. Run requests from the collection

### Using Thunder Client (VS Code)

1. Install Thunder Client extension
2. Create new request with:
   - Method: GET
   - URL: `http://localhost:8080/api/sync`
3. Send and view response

## Performance Considerations

1. **Sync Endpoint**: Returns all data, use with caution at scale
2. **Firestore Queries**: Add indexes for frequently filtered fields
3. **Batch Operations**: Not currently implemented, consider for bulk updates
4. **Caching**: Frontend caches state, refresh manually when needed

## Rate Limiting

Not currently implemented. Consider adding for production:
- 100 requests per minute per IP
- 1000 requests per minute per authenticated user

## Authentication

Currently open (unauthenticated). For production, implement:

```typescript
// Example: Add Bearer token support
const token = localStorage.getItem('auth_token');
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};
```

## Monitoring & Debugging

### Enable Debug Logs

Set environment variable:
```bash
DEBUG=igo:* npm run dev
```

### View Firestore Activity

Google Cloud Console → Firestore → Monitoring

---

**API Version**: 1.0  
**Last Updated**: December 2025
