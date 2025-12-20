#!/bin/bash

# IGO Approval System - Automated Deployment Script
# Usage: ./scripts/deploy.sh [options]
# Options:
#   --project PROJECT_ID       GCP Project ID (required)
#   --region REGION            GCP Region (default: us-central1)
#   --memory MEMORY            Cloud Run Memory (default: 512Mi)
#   --build-only               Only build, don't deploy
#   --dry-run                  Show what would be deployed

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
REGION="us-central1"
MEMORY="512Mi"
SERVICE_NAME="igo-approval"
BUILD_ONLY=false
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --project)
      PROJECT_ID="$2"
      shift 2
      ;;
    --region)
      REGION="$2"
      shift 2
      ;;
    --memory)
      MEMORY="$2"
      shift 2
      ;;
    --build-only)
      BUILD_ONLY=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Validate required arguments
if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}Error: --project is required${NC}"
  echo "Usage: ./scripts/deploy.sh --project PROJECT_ID [options]"
  exit 1
fi

echo -e "${GREEN}=== IGO Approval System Deployment ===${NC}"
echo -e "Project: ${YELLOW}$PROJECT_ID${NC}"
echo -e "Region: ${YELLOW}$REGION${NC}"
echo -e "Memory: ${YELLOW}$MEMORY${NC}"
echo -e "Service: ${YELLOW}$SERVICE_NAME${NC}"

# Check prerequisites
echo -e "\n${GREEN}Checking prerequisites...${NC}"

if ! command -v gcloud &> /dev/null; then
  echo -e "${RED}Error: gcloud CLI not found${NC}"
  exit 1
fi

if ! command -v docker &> /dev/null; then
  echo -e "${RED}Error: Docker not found${NC}"
  exit 1
fi

# Set GCP project
gcloud config set project "$PROJECT_ID"

# Build Docker image
echo -e "\n${GREEN}Building Docker image...${NC}"

IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}[DRY RUN]${NC} docker build -t $IMAGE_NAME ."
else
  docker build -t "$IMAGE_NAME" .
  echo -e "${GREEN}Build complete${NC}"
fi

# Push to Container Registry
if [ "$BUILD_ONLY" = false ]; then
  echo -e "\n${GREEN}Pushing image to Container Registry...${NC}"
  
  if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}[DRY RUN]${NC} docker push $IMAGE_NAME"
  else
    docker push "$IMAGE_NAME"
    echo -e "${GREEN}Push complete${NC}"
  fi

  # Deploy to Cloud Run
  echo -e "\n${GREEN}Deploying to Cloud Run...${NC}"
  
  DEPLOY_CMD="gcloud run deploy $SERVICE_NAME \\
    --image $IMAGE_NAME \\
    --platform managed \\
    --region $REGION \\
    --allow-unauthenticated \\
    --memory $MEMORY \\
    --cpu 1 \\
    --set-env-vars NODE_ENV=production,PORT=8080 \\
    --max-instances 10 \\
    --min-instances 1"
  
  if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}[DRY RUN]${NC}"
    echo "$DEPLOY_CMD"
  else
    eval "$DEPLOY_CMD"
    echo -e "${GREEN}Deployment complete${NC}"
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')
    echo -e "\n${GREEN}Service URL: ${YELLOW}$SERVICE_URL${NC}"
  fi
else
  echo -e "${GREEN}Build-only mode - skipping deployment${NC}"
fi

echo -e "\n${GREEN}=== Deployment Script Complete ===${NC}"
