#!/bin/bash

echo "🚀 AEGT Final Fix Deployment"
echo "============================"

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Rebuild frontend with new fixes
echo "🏗️ Rebuilding frontend..."
cd frontend
npm run build
cd ..

# Update permissions
echo "📁 Updating permissions..."
sudo chown -R daimond:daimond frontend/build/

# Restart backend
echo "🔄 Restarting backend..."
pm2 restart aegisum-backend

# Reload nginx
echo "🌐 Reloading nginx..."
sudo systemctl reload nginx

echo ""
echo "✅ Deployment completed!"
echo ""
echo "🔍 Testing the fixes..."

# Test API
echo "1. API Health:"
curl -s https://webapp.aegisum.co.za/health | jq .status

echo ""
echo "2. Bot Status:"
curl -s 'https://api.telegram.org/bot7820209188:AAEqvWuSJHjPlSnjVrS-xmiQIj0mvArL_8s/getMe' | jq .result.username

echo ""
echo "3. Initialize Test:"
curl -s -X POST https://webapp.aegisum.co.za/api/auth/initialize \
  -H "Content-Type: application/json" \
  -d '{"telegramId": 1651155083, "username": "test", "firstName": "Test", "languageCode": "en"}' | jq .success

echo ""
echo "🎉 FIXES APPLIED:"
echo "✅ Correct blue AEGT logo with white geometric shapes"
echo "✅ Fixed WebApp initialization with fallback mechanism"
echo "✅ Improved error handling for Telegram WebApp failures"
echo "✅ Reduced loading timeout for better user experience"
echo ""
echo "🎯 What should work now:"
echo "1. Bot commands: /start, /play, /stats, /help"
echo "2. WebApp should load past the loading screen"
echo "3. Correct logo should display"
echo "4. Mining interface should be accessible"
echo ""
echo "📱 Test the WebApp by clicking 'Launch Aegisum WebApp' in Telegram!"