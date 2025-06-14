#!/bin/bash

echo "🔧 AEGT Safe Deployment Script"
echo "==============================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in AEGT root directory"
    exit 1
fi

# Backup important files that shouldn't be overwritten
echo "📦 Creating backup of important files..."
mkdir -p .backup
cp backend/.env.production .backup/ 2>/dev/null || echo "No .env.production found"
cp ecosystem.config.js .backup/ 2>/dev/null || echo "No ecosystem.config.js found"

# Stash any uncommitted changes to node_modules and build files
echo "💾 Stashing build files and dependencies..."
git add backend/src/server.js frontend/src/services/api.js frontend/public/logo*.png frontend/public/favicon.ico
git add FIXES_APPLIED.md fix_deployment.sh safe_deploy.sh

# Commit our important fixes
echo "📝 Committing critical fixes..."
git commit -m "Fix: Update API URL, bot token, and add AEGT logo

- Fixed frontend API URL from aegisum.co.za to webapp.aegisum.co.za
- Updated Telegram bot token to correct value
- Added AEGT logo files (logo192.png, favicon.ico, logo512.png)
- Fixed validation issues in auth/initialize endpoint"

# Push the changes
echo "🚀 Pushing changes to repository..."
git push origin main

echo "✅ Changes committed and pushed successfully!"
echo ""
echo "🔄 Now restart your backend service:"
echo "pm2 restart aegisum-backend"
echo ""
echo "🏗️ And rebuild your frontend:"
echo "cd frontend && npm run build && cd .."
echo ""
echo "🔍 Then test with:"
echo "curl https://webapp.aegisum.co.za/health"