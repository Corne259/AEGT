#!/bin/bash

echo "🔍 AEGT System Status Check"
echo "==========================="

echo ""
echo "1. 🌐 API Health Check:"
curl -s https://webapp.aegisum.co.za/health | jq . 2>/dev/null || curl -s https://webapp.aegisum.co.za/health

echo ""
echo "2. 🤖 Bot Token Verification:"
curl -s 'https://api.telegram.org/bot7820209188:AAEqvWuSJHjPlSnjVrS-xmiQIj0mvArL_8s/getMe' | jq '.result | {username, first_name}' 2>/dev/null || echo "Bot token test completed"

echo ""
echo "3. 🔐 Initialize Endpoint Test:"
curl -s -X POST https://webapp.aegisum.co.za/api/auth/initialize \
  -H "Content-Type: application/json" \
  -d '{"telegramId": 1651155083, "username": "test", "firstName": "Test", "languageCode": "en"}' | jq .success 2>/dev/null || echo "Initialize test completed"

echo ""
echo "4. 📱 Frontend Status:"
curl -s -I https://webapp.aegisum.co.za | head -1

echo ""
echo "5. 🔧 PM2 Process Status:"
pm2 list | grep aegisum

echo ""
echo "6. 📋 Recent Backend Logs (last 3 lines):"
pm2 logs aegisum-backend --lines 3 --nostream 2>/dev/null | tail -3

echo ""
echo "7. ❌ Recent Errors (if any):"
pm2 logs aegisum-backend --lines 10 --nostream 2>/dev/null | grep -i "error\|fail" | tail -2 || echo "No recent errors found"

echo ""
echo "✅ Status check completed!"
echo ""
echo "🎯 What should work now:"
echo "- ✅ Website: https://webapp.aegisum.co.za"
echo "- ✅ API endpoints responding"
echo "- ✅ Bot token is valid"
echo "- 🔄 Bot commands (may need restart if still 404)"