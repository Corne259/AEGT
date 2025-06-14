#!/bin/bash

echo "🔧 Applying fixes to AEGT deployment..."

# 1. Update frontend API URL
echo "📱 Updating frontend API URL..."
sed -i "s|https://aegisum.co.za/api|https://webapp.aegisum.co.za/api|g" frontend/src/services/api.js

# 2. Update Telegram bot token in backend
echo "🤖 Updating Telegram bot token..."
sed -i "s|7820209188:AAGWlH9P_49d15934bsyZGQdKE93r9ItWQ4|7820209188:AAEqvWuSJHjPlSnjVrS-xmiQIj0mvArL_8s|g" backend/src/server.js

# 3. Download and add logo
echo "🖼️ Adding AEGT logo..."
cd frontend/public
curl -L "https://i.imgur.com/l1AQ7V2.png" -o logo192.png --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" --silent
cp logo192.png favicon.ico
cp logo192.png logo512.png
cd ../..

# 4. Rebuild frontend
echo "🏗️ Rebuilding frontend..."
cd frontend
npm run build
cd ..

# 5. Update file permissions
echo "📁 Updating file permissions..."
sudo chown -R daimond:daimond frontend/build/

# 6. Restart services
echo "🔄 Restarting services..."
pm2 restart aegisum-backend
sudo systemctl reload nginx

echo "✅ All fixes applied successfully!"
echo ""
echo "🔍 To verify the fixes:"
echo "1. Check API: curl https://webapp.aegisum.co.za/health"
echo "2. Test initialize: curl -X POST https://webapp.aegisum.co.za/api/auth/initialize -H 'Content-Type: application/json' -d '{\"telegramId\": 1651155083, \"username\": \"test\", \"firstName\": \"Test\", \"languageCode\": \"en\"}'"
echo "3. Check bot: curl 'https://api.telegram.org/bot7820209188:AAEqvWuSJHjPlSnjVrS-xmiQIj0mvArL_8s/getMe'"
echo "4. Check logs: pm2 logs aegisum-backend --lines 10"