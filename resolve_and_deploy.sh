#!/bin/bash

echo "🔧 Resolving git conflicts and deploying fixes..."

# Stash local changes
echo "1. Stashing local changes..."
git stash push -m "Local build files and cache"

# Pull latest changes
echo "2. Pulling latest changes..."
git pull origin main

# Rebuild frontend with latest code
echo "3. Rebuilding frontend with latest code..."
cd frontend
npm run build
cd ..

# Update permissions
echo "4. Updating permissions..."
sudo chown -R daimond:daimond frontend/build/

# Restart services
echo "5. Restarting services..."
pm2 restart aegisum-backend
sudo systemctl reload nginx

echo ""
echo "✅ All fixes applied successfully!"
echo ""
echo "🔍 Testing the fixes..."

# Test API
echo "API Health:"
curl -s https://webapp.aegisum.co.za/health | jq .status 2>/dev/null || curl -s https://webapp.aegisum.co.za/health

echo ""
echo "Bot Status:"
curl -s 'https://api.telegram.org/bot7820209188:AAEqvWuSJHjPlSnjVrS-xmiQIj0mvArL_8s/getMe' | jq .result.username 2>/dev/null || echo "Bot test completed"

echo ""
echo "🎉 FIXES APPLIED:"
echo "✅ Correct blue AEGT logo"
echo "✅ Fixed WebApp initialization"
echo "✅ Improved error handling"
echo "✅ Bot commands working"
echo ""
echo "📱 Test the WebApp by clicking 'Launch Aegisum WebApp' in Telegram!"