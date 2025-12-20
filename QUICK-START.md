# Quick Start: Deploy IGO Approval System

## 🚀 5-Step Deployment Checklist

Follow these 5 steps to get your system live in production. Estimated time: **30-45 minutes**

---

## ✅ STEP 1: Review DEPLOYMENT.md (5 minutes)

**What:** Read the comprehensive deployment guide
**Why:** Understand architecture, prerequisites, and best practices

```bash
# Open and review
cat DEPLOYMENT.md
```

**Key sections to review:**
- Architecture Overview
- Prerequisites
- Firestore Setup (Collections structure)
- Security Checklist

---

## ✅ STEP 2: Configure GCP Project & Firestore (10-15 minutes)

### 2.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **Create Project**
3. Enter project name: `igo-approval-prod`
4. Click **Create**

### 2.2 Enable Required APIs

```bash
# Using gcloud CLI (recommended)
gcloud config set project YOUR_PROJECT_ID

# Enable Cloud Run
gcloud services enable run.googleapis.com

# Enable Firestore
gcloud services enable firestore.googleapis.com

# Enable Container Registry
gcloud services enable containerregistry.googleapis.com

# Enable Cloud Build
gcloud services enable cloudbuild.googleapis.com
```

**Or manually in Console:**
1. Search "Cloud Run" → Enable
2. Search "Firestore" → Enable
3. Search "Container Registry" → Enable

### 2.3 Create Firestore Database

1. Go to **Firestore** in Cloud Console
2. Click **Create Database**
3. Choose:
   - **Location:** `us-central1` (or your region)
   - **Mode:** Start in **Production mode**
4. Click **Create**

### 2.4 Create Service Account

```bash
# Create service account
gcloud iam service-accounts create igo-approval-sa \
  --display-name="IGO Approval Service Account"

# Grant Firestore permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member=serviceAccount:igo-approval-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/datastore.user

# Grant Cloud Run permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member=serviceAccount:igo-approval-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/run.developer
```

**Verify:**
```bash
gcloud iam service-accounts list | grep igo-approval
```

---

## ✅ STEP 3: Test Locally (10 minutes)

### 3.1 Install Dependencies

```bash
# Clone repository (if not already done)
git clone https://github.com/igobackend1-prog/igo-approvals.git
cd igo-approvals

# Install npm dependencies
npm install
```

### 3.2 Create Local Environment File

```bash
# Copy example to local
cp .env.example .env.local

# Edit .env.local
vim .env.local  # or nano, or your preferred editor
```

**Add these settings:**
```env
VITE_API_BASE=/api
VITE_ENVIRONMENT=development
PORT=8080
NODE_ENV=development
```

### 3.3 Run Development Server

```bash
# Start dev server
npm run dev
```

**Expected output:**
```
  VITE v6.2.0  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### 3.4 Test the Application

1. Open browser: `http://localhost:5173`
2. Verify UI loads (you should see the approval dashboard)
3. Check browser console for errors (F12)

### 3.5 Build for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

**Expected output:**
```
  ➜  Local:   http://localhost:4173/
```

**Stop servers:** Press `Ctrl+C`

---

## ✅ STEP 4: Deploy to Cloud Run (5-10 minutes)

### 4.1 Set Project ID

```bash
# Set your GCP project ID
export PROJECT_ID="your-gcp-project-id"

# Verify it's set
echo $PROJECT_ID
```

### 4.2 Make Deploy Script Executable

```bash
# Add execute permission to deploy script
chmod +x scripts/deploy.sh
```

### 4.3 Run Deployment

```bash
# Deploy to Cloud Run
./scripts/deploy.sh --project $PROJECT_ID --region us-central1 --memory 512Mi
```

**What happens:**
1. Builds Docker image locally
2. Pushes to Google Container Registry
3. Deploys to Cloud Run
4. Returns service URL

**Expected output:**
```
=== IGO Approval System Deployment ===
Project: your-gcp-project-id
Region: us-central1
Memory: 512Mi
Service: igo-approval

Checking prerequisites...
Building Docker image...
Pushing image to Container Registry...
Deploying to Cloud Run...

Service URL: https://igo-approval-xxxxx-uc.a.run.app
```

### 4.4 Verify Deployment

```bash
# Check service status
gcloud run services list --platform managed

# Get service URL
SERVICE_URL=$(gcloud run services describe igo-approval --platform managed --region us-central1 --format 'value(status.url)')
echo $SERVICE_URL

# Test the API
curl $SERVICE_URL/api/sync
```

---

## ✅ STEP 5: Update Frontend API Configuration (2 minutes)

### 5.1 Get Production URL

```bash
# Get your Cloud Run service URL
SERVICE_URL=$(gcloud run services describe igo-approval --platform managed --region us-central1 --format 'value(status.url)')
echo "Your production URL: $SERVICE_URL"
```

### 5.2 Update apiService.ts

**File:** `apiService.ts` (Line 5)

**Current:**
```typescript
const API_BASE = '/api';
```

**Update to:**
```typescript
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://igo-approval-xxxxx-uc.a.run.app/api'
  : '/api';
```

Replace `https://igo-approval-xxxxx-uc.a.run.app` with your actual URL from Step 5.1

### 5.3 Commit Changes

```bash
# Commit the API configuration update
git add apiService.ts
git commit -m "chore: Update production API endpoint"
git push origin main
```

### 5.4 Redeploy (Optional)

If you want the latest code deployed:

```bash
./scripts/deploy.sh --project $PROJECT_ID
```

---

## 📊 Monitor Your Deployment

### View Logs

```bash
# Stream real-time logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=igo-approval" \
  --limit 50 \
  --follow

# Or use Cloud Console:
# https://console.cloud.google.com/run?project=YOUR_PROJECT_ID
```

### Check Health

```bash
# Health check endpoint
curl https://igo-approval-xxxxx-uc.a.run.app/api/sync

# Should return JSON with projects, requests, auditLogs
```

### View Metrics

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click `igo-approval` service
3. View:
   - **Metrics:** CPU, Memory, Requests
   - **Logs:** Real-time activity
   - **Revisions:** Deployment history

---

## 🔧 Troubleshooting

### Issue: Firestore Connection Error

```
Error: Firestore write failed
```

**Solution:**
```bash
# Check service account permissions
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:*igo-approval*"

# Grant permissions if needed
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:igo-approval-sa@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/datastore.user
```

### Issue: Container Build Fails

```bash
# Build locally to debug
docker build -t igo-approval:test .

# Check Dockerfile syntax
docker run -it igo-approval:test /bin/sh
```

### Issue: Slow Cold Start

**Solution:** Set minimum instances in Cloud Run
```bash
gcloud run services update igo-approval \
  --platform managed \
  --region us-central1 \
  --min-instances 1
```

---

## 📋 Post-Deployment Checklist

Once deployed, verify everything works:

- [ ] Service URL returns 200 status code
- [ ] `/api/sync` endpoint returns valid JSON
- [ ] Frontend loads without errors
- [ ] Can create test project via API
- [ ] Logs show no errors in Cloud Console
- [ ] Firestore collections are created
- [ ] Auto-generated audit logs appear
- [ ] Health check passes

---

## 🎯 Next Steps

1. **Configure SSL/TLS:** ✅ Automatic with Cloud Run
2. **Set up monitoring alerts:** See DEPLOYMENT.md → Security Checklist
3. **Enable IAM roles:** Restrict access based on roles
4. **Configure environment variables:** Add API keys, secrets via Cloud Console
5. **Enable audit logging:** Track all Firestore operations

---

## 📚 Additional Resources

- **Full Documentation:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **API Reference:** [API-INTEGRATION.md](./scripts/API-INTEGRATION.md)
- **Google Cloud Run Docs:** https://cloud.google.com/run/docs
- **Firestore Docs:** https://cloud.google.com/firestore/docs

---

## ❓ Need Help?

**Check logs first:**
```bash
gcloud logging read --project=$PROJECT_ID --limit=100
```

**Common commands:**
```bash
# View all deployments
gcloud run services list --platform managed

# Get service details
gcloud run services describe igo-approval --platform managed --region us-central1

# Delete service (if needed)
gcloud run services delete igo-approval --platform managed --region us-central1
```

---

**Status:** ✅ Ready for Production  
**Last Updated:** December 2025  
**Estimated Deployment Time:** 30-45 minutes
