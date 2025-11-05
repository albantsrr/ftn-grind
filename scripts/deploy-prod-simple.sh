#!/bin/bash

# Simple Git-based deployment to production VPS
# Usage: ./scripts/deploy-prod-simple.sh

set -e

VPS_HOST="72.61.166.22"
VPS_USER="root"
PROD_PATH="/opt/fortiflow/prod"

echo "🚀 Deploying to Production VPS..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Deploy via SSH
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
set -e

echo "📍 Current directory: /opt/fortiflow/prod"
cd /opt/fortiflow/prod

echo "📥 Pulling latest changes from GitHub..."
git fetch origin
git pull origin main

echo "📦 Current version:"
cat version.json | grep version | head -1

echo ""
echo "🔄 Restarting Docker services..."
cd backend
docker compose down
docker compose up -d --build

echo ""
echo "⏳ Waiting for services to start (10s)..."
sleep 10

echo ""
echo "🏥 Running health check..."
if curl -f http://localhost:80/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy!"
else
    echo "❌ Health check failed!"
    echo "📋 Last 20 lines of logs:"
    docker compose logs --tail=20 backend
    exit 1
fi

echo ""
echo "📊 Service status:"
docker compose ps

echo ""
echo "📋 Recent logs:"
docker compose logs --tail=10 backend

ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Production deployment complete!"
echo ""
echo "📍 API: http://72.61.166.22"
echo "📚 Docs: http://72.61.166.22/docs"
echo "🏥 Health: http://72.61.166.22/health"
