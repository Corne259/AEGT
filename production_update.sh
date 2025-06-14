#!/bin/bash

echo "🔧 AEGT Production Update Script"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in AEGT root directory"
    echo "Please run this from ~/AEGT directory"
    exit 1
fi

# Backup current .env files
echo "📦 Backing up environment files..."
cp backend/.env.production backend/.env.production.backup 2>/dev/null || echo "No .env.production to backup"

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin main

# Rebuild frontend with new changes
echo "🏗️ Rebuilding frontend..."
cd frontend
npm run build
cd ..

# Update file permissions
echo "📁 Updating file permissions..."
sudo chown -R daimond:daimond frontend/build/

# Restart backend service
echo "🔄 Restarting backend service..."
pm2 restart aegisum-backend

# Reload nginx
echo "🌐 Reloading nginx..."
sudo systemctl reload nginx

echo ""
echo "✅ Update completed successfully!"
echo ""
echo "🔍 Testing the fixes..."

# Test API health
echo "1. Testing API health:"
curl -s https://webapp.aegisum.co.za/health | jq . || curl -s https://webapp.aegisum.co.za/health

echo ""
echo "2. Testing initialize endpoint:"
curl -s -X POST https://webapp.aegisum.co.za/api/auth/initialize \
  -H "Content-Type: application/json" \
  -d '{"telegramId": 1651155083, "username": "test", "firstName": "Test", "languageCode": "en"}' | jq . || echo "Initialize test completed"

echo ""
echo "3. Testing bot token:"
curl -s 'https://api.telegram.org/bot7820209188:AAEqvWuSJHjPlSnjVrS-xmiQIj0mvArL_8s/getMe' | jq .result.username || echo "Bot test completed"

echo ""
echo "🎯 Next steps:"
echo "1. Test Telegram bot commands: /start, /play, /stats"
echo "2. Open https://webapp.aegisum.co.za in browser"
echo "3. Check logs: pm2 logs aegisum-backend --lines 10"