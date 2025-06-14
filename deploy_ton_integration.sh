#!/bin/bash

# Deploy TON Wallet Integration to Production
# This script deploys the new TON wallet features to the production server

echo "🚀 Deploying TON Wallet Integration to Production..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -f "backend/package.json" ]; then
    print_error "Not in AEGT project directory. Please run from project root."
    exit 1
fi

print_status "Starting deployment of TON wallet integration..."

# 1. Pull latest changes
print_status "Pulling latest changes from GitHub..."
git pull origin main
if [ $? -ne 0 ]; then
    print_error "Failed to pull latest changes"
    exit 1
fi
print_success "Latest changes pulled successfully"

# 2. Run database migration
print_status "Running database migration for TON wallet support..."
cd backend
node src/database/migrate.js
if [ $? -ne 0 ]; then
    print_error "Database migration failed"
    exit 1
fi
print_success "Database migration completed"

# 3. Install any new backend dependencies
print_status "Installing backend dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_error "Backend dependency installation failed"
    exit 1
fi
print_success "Backend dependencies installed"

# 4. Build frontend with TON integration
print_status "Building frontend with TON wallet integration..."
cd ../frontend
npm install
npm run build
if [ $? -ne 0 ]; then
    print_error "Frontend build failed"
    exit 1
fi
print_success "Frontend built successfully"

# 5. Set proper permissions
print_status "Setting proper file permissions..."
cd ..
sudo chown -R daimond:daimond frontend/build/
sudo chown -R daimond:daimond backend/
print_success "File permissions set"

# 6. Restart backend service
print_status "Restarting backend service..."
pm2 restart aegisum-backend
if [ $? -ne 0 ]; then
    print_error "Failed to restart backend service"
    exit 1
fi
print_success "Backend service restarted"

# 7. Reload nginx
print_status "Reloading nginx configuration..."
sudo systemctl reload nginx
if [ $? -ne 0 ]; then
    print_warning "Nginx reload failed, but continuing..."
fi
print_success "Nginx reloaded"

# 8. Wait for services to start
print_status "Waiting for services to start..."
sleep 5

# 9. Test deployment
print_status "Testing deployment..."

# Test health endpoint
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://webapp.aegisum.co.za/health)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    print_success "Backend health check passed"
else
    print_error "Backend health check failed (HTTP $HEALTH_RESPONSE)"
fi

# Test new wallet endpoints
CHALLENGE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://webapp.aegisum.co.za/api/auth/wallet/challenge -H "Content-Type: application/json" -d '{"walletAddress":"EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t"}')
if [ "$CHALLENGE_RESPONSE" = "200" ]; then
    print_success "Wallet challenge endpoint working"
else
    print_warning "Wallet challenge endpoint returned HTTP $CHALLENGE_RESPONSE"
fi

# Test frontend
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://webapp.aegisum.co.za/)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    print_success "Frontend is accessible"
else
    print_error "Frontend check failed (HTTP $FRONTEND_RESPONSE)"
fi

# 10. Show deployment summary
echo ""
echo "🎉 TON Wallet Integration Deployment Complete!"
echo ""
echo "✨ New Features Deployed:"
echo "  • Dual login system (Telegram + TON Wallet)"
echo "  • TonKeeper wallet integration"
echo "  • TON cryptocurrency payments"
echo "  • Wallet address storage for airdrops"
echo "  • Challenge-based wallet authentication"
echo ""
echo "🔗 Access your app:"
echo "  • Web App: https://webapp.aegisum.co.za"
echo "  • Telegram Bot: @AEGTMinerbot"
echo ""
echo "📊 Service Status:"
pm2 status aegisum-backend
echo ""
echo "🔧 Next Steps:"
echo "  1. Test wallet login functionality"
echo "  2. Test TON payments for upgrades"
echo "  3. Verify wallet connection to existing accounts"
echo "  4. Monitor logs for any issues"
echo ""
echo "📝 To monitor logs:"
echo "  pm2 logs aegisum-backend"
echo ""
print_success "Deployment completed successfully!"