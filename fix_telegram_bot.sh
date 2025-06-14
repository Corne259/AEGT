#!/bin/bash

echo "🤖 Fixing Telegram Bot Token Issue"
echo "=================================="

# Check current bot token in server.js
echo "📋 Current bot token in server.js:"
grep -n "TELEGRAM_BOT_TOKEN\|7820209188" backend/src/server.js

echo ""
echo "🔄 Restarting PM2 with environment update..."

# Set the environment variable and restart
export TELEGRAM_BOT_TOKEN="7820209188:AAEqvWuSJHjPlSnjVrS-xmiQIj0mvArL_8s"
pm2 restart aegisum-backend --update-env

echo ""
echo "⏳ Waiting 5 seconds for bot to initialize..."
sleep 5

echo ""
echo "🧪 Testing bot functionality..."

# Test bot API
echo "1. Testing bot getMe:"
curl -s 'https://api.telegram.org/bot7820209188:AAEqvWuSJHjPlSnjVrS-xmiQIj0mvArL_8s/getMe' | jq .result.username

# Check for recent bot errors
echo ""
echo "2. Checking recent logs for bot errors:"
pm2 logs aegisum-backend --lines 5 | grep -i "telegram\|bot\|polling" | tail -3

echo ""
echo "✅ Bot fix completed!"
echo ""
echo "🎯 Next steps:"
echo "1. Test bot commands in Telegram: /start"
echo "2. If still getting 404s, the bot might need a few minutes to update"
echo "3. Check logs: pm2 logs aegisum-backend --lines 10"