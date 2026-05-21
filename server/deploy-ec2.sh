#!/usr/bin/env bash

# Deploy server on EC2 (run this ON the EC2 instance)
set -e

APP_NAME="auto-showroom-api"

echo "🚀 Deploying Server on EC2"
echo ""

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run migrations if any
if [ -f "migrations/run.sh" ]; then
    echo "🔄 Running migrations..."
    ./migrations/run.sh
fi

# Restart with PM2
echo "🔄 Restarting server..."
if pm2 list | grep -q "$APP_NAME"; then
    pm2 restart "$APP_NAME"
else
    echo "⚠️  App not running, starting new instance..."
    pm2 start server/index.js --name "$APP_NAME"
    pm2 save
fi

echo ""
echo "✅ Server deployed successfully!"
echo ""
echo "📊 Status:"
pm2 status

echo ""
echo "📝 View logs:"
echo "   pm2 logs $APP_NAME"
echo ""
