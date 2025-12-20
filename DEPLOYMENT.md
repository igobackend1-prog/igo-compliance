# IGO Approval System - Deployment & Integration Guide

## Architecture Overview

The application is a full-stack system with:
- **Frontend**: React + Vite (TypeScript)
- **Backend**: Express.js + Firestore (Google Cloud)
- **Infrastructure**: Docker containerized, deployed to Google Cloud Run

## Prerequisites

1. **Google Cloud Project** with:
   - Cloud Run enabled
   - Firestore enabled (Datastore mode recommended)
   - Container Registry or Artifact Registry enabled
   - Service Account with appropriate permissions

2. **Local Development**:
   ```bash
   node -v  # v20+
   npm -v   # v10+
   docker --version  # Latest stable
   ```

## Setup Instructions

### 1. Local Development

```bash
# Install dependencies
npm install

# Create .env.local for development
cp .env.example .env.local

# Edit .env.local with your config
vim .env.local

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### 2. Backend Integration

#### API Service Configuration

The frontend communicates via `apiService.ts` with these endpoints:

```typescript
GET  /api/sync           - Full state sync (projects, requests, audit logs)
POST /api/projects      - Create new project
POST /api/requests      - Create payment request
PATCH /api/requests/:id - Update request status
DELETE /api/requests/:id - Delete request
```

#### Environment Variables

Create `.env` or `.env.local`:

```env
# Frontend
VITE_API_BASE=/api
VITE_ENVIRONMENT=production

# Backend
PORT=8080
NODE_ENV=production
GCP_PROJECT_ID=your-project-id
GCP_FIRESTORE_DATABASE=default
```

### 3. Docker Build & Push

```bash
# Build Docker image
docker build -t igo-approval:latest .

# Tag for Google Container Registry
docker tag igo-approval:latest gcr.io/PROJECT_ID/igo-approval:latest

# Push to GCR
docker push gcr.io/PROJECT_ID/igo-approval:latest

# Or use cloud build
gcloud builds submit --tag gcr.io/PROJECT_ID/igo-approval:latest
```

### 4. Deploy to Cloud Run

#### Using gcloud CLI

```bash
gcloud run deploy igo-approval \
  --image gcr.io/PROJECT_ID/igo-approval:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars PORT=8080 \
  --memory 512Mi \
  --cpu 1
```

#### Using Cloud Console

1. Go to Cloud Run > Create Service
2. Select "Deploy one revision from an existing image"
3. Choose your container image
4. Set:
   - Service name: `igo-approval`
   - Region: `us-central1`
   - CPU allocation: `1`
   - Memory: `512 MB`
   - Maximum instances: `10`
5. Configure environment variables in Settings
6. Click Deploy

### 5. Firestore Setup

The backend expects these collections:

```
projects/
  ├── {projectId}
  │   ├── id: string
  │   ├── name: string
  │   └── ...

requests/
  ├── {requestId}
  │   ├── id: string
  │   ├── status: PENDING_L1 | PENDING_L2 | APPROVED | REJECTED
  │   ├── amount: number
  │   ├── purpose: string
  │   ├── timestamp: ISO string
  │   └── ...

auditLogs/
  ├── {logId}
  │   ├── id: string
  │   ├── action: string
  │   ├── paymentId: string
  │   ├── user: string
  │   ├── timestamp: ISO string
  │   └── ...
```

## Monitoring & Logs

### Cloud Run Logs

```bash
# View service logs
gcloud run services describe igo-approval --platform managed

# Stream logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=igo-approval" --limit 50 --format json

# Or use Cloud Logging console
# https://console.cloud.google.com/logs
```

### Health Check

The container includes a health check endpoint:

```
GET /api/sync
```

This returns connection status and app state.

## Troubleshooting

### 1. Firestore Connection Issues

```bash
# Check service account has Firestore permissions
gcloud projects get-iam-policy PROJECT_ID --flatten="bindings[].members" --filter="bindings.members:serviceAccount:*"

# Grant permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member=serviceAccount:SERVICE_ACCOUNT_EMAIL \
  --role=roles/datastore.user
```

### 2. Container Issues

```bash
# Build locally and test
docker build -t igo-approval:test .
docker run -p 8080:8080 igo-approval:test

# Check logs
docker logs CONTAINER_ID
```

### 3. Port Conflicts

Ensure port 8080 is available or set `PORT` environment variable.

## Performance Optimization

1. **Frontend**: Vite automatically handles code splitting
2. **Backend**: Consider Redis caching for Firestore queries
3. **Database**: Add indexes for frequently queried fields
4. **Images**: Use Cloud CDN for static assets

## Security Checklist

- [ ] Enable Cloud Armor for DDoS protection
- [ ] Use VPC Service Controls for data exfiltration protection
- [ ] Enable audit logging in Firestore
- [ ] Rotate service account keys regularly
- [ ] Use Cloud KMS for secrets management
- [ ] Enable HTTPS (automatic with Cloud Run)
- [ ] Set up IAM roles with least privilege
- [ ] Review Firestore security rules

## Scaling Configuration

```yaml
# Scale settings in Cloud Run
Max instances: 100  # Adjust based on load
Min instances: 1    # Reduce cold starts
Timeout: 3600       # 1 hour
Memory: 512-1024 Mi # Adjust per load
CPU: 1-2            # Scale vertically as needed
```

## CI/CD Pipeline

The `cloudbuild.yaml` handles:
1. Build Docker image
2. Push to Container Registry
3. Deploy to Cloud Run

Triggered automatically on commits to main.

## Rollback Procedure

```bash
# List previous revisions
gcloud run revisions list --service igo-approval

# Route traffic to previous revision
gcloud run services update-traffic igo-approval \
  --to-revisions REVISION_ID=100
```

## Support & Maintenance

- Monitor Cloud Run metrics dashboard
- Set up alerts for high error rates
- Review logs weekly
- Update dependencies monthly
- Test failover procedures quarterly

---

**Last Updated**: December 2025
**Maintained by**: IGO Backend Team
