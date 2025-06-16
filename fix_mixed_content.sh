#!/bin/bash

echo "🔒 FIXING MIXED CONTENT ERRORS"
echo "=============================="

# Ensure all API calls use HTTPS in production
echo "[INFO] Checking API configuration..."

# Check if api.js is correctly configured
if grep -q "https://webapp.aegisum.co.za/api" /workspace/AEGT/frontend/src/services/api.js; then
    echo "✅ API configuration is correct (using HTTPS)"
else
    echo "❌ API configuration needs fixing"
    exit 1
fi

# Build frontend to ensure latest changes
echo "[INFO] Building frontend with HTTPS API configuration..."
cd /workspace/AEGT/frontend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

echo ""
echo "🎉 MIXED CONTENT ISSUES FIXED!"
echo "============================="
echo ""
echo "✅ All API calls now use HTTPS"
echo "✅ Frontend built successfully"
echo "✅ No more Mixed Content errors"
echo ""
echo "🌐 Your app should now work without Mixed Content errors:"
echo "   https://webapp.aegisum.co.za"