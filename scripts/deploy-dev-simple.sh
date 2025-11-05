#!/bin/bash

# Simple Git-based deployment to dev VPS
# Usage: ./scripts/deploy-dev-simple.sh

set -e

VPS_HOST="72.61.166.22"
VPS_USER="root"
DEV_PATH="/opt/fortiflow/dev"

echo "🔧 Deploying to Dev Environment on VPS..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Deploy via SSH
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
set -e

echo "📍 Current directory: /opt/fortiflow/dev"
cd /opt/fortiflow/dev

echo "📥 Pulling latest changes from GitHub..."
git fetch origin
git pull origin main

echo "📦 Current version:"
cat version.json | grep version | head -1

echo ""
echo "🔄 Restarting Docker services..."
cd backend
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up -d --build

echo ""
echo "⏳ Waiting for services to start (10s)..."
sleep 10

echo ""
echo "🏥 Running health check..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Dev backend is healthy!"
else
    echo "❌ Health check failed!"
    echo "📋 Last 20 lines of logs:"
    docker compose -f docker-compose.dev.yml logs --tail=20 backend_dev
    exit 1
fi

echo ""
echo "📊 Service status:"
docker compose -f docker-compose.dev.yml ps

echo ""
echo "📋 Recent logs:"
docker compose -f docker-compose.dev.yml logs --tail=10 backend_dev

ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Dev deployment complete!"
echo ""
echo "📍 API: http://72.61.166.22:3001"
echo "📚 Docs: http://72.61.166.22:3001/docs"
echo "🏥 Health: http://72.61.166.22:3001/health"
