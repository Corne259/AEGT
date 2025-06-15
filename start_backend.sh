#!/bin/bash

# AEGT Backend Startup Script
# Starts the backend server with proper configuration

set -e

echo "🚀 Starting AEGT Backend Server..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "ecosystem.config.js" ]; then
    print_error "ecosystem.config.js not found. Please run this script from the AEGT root directory."
    exit 1
fi

print_status "Stopping any existing backend processes..."
pm2 stop aegisum-backend 2>/dev/null || true
pm2 delete aegisum-backend 2>/dev/null || true

print_status "Starting backend with PM2..."
pm2 start ecosystem.config.js

print_status "Waiting for server to start..."
sleep 3

print_status "Checking server status..."
pm2 status

print_status "Testing health endpoint..."
if curl -f -s "http://localhost:3001/health" > /dev/null; then
    print_success "Backend server is running and healthy!"
    echo ""
    echo "🎉 BACKEND STARTED SUCCESSFULLY!"
    echo "==============================="
    echo "• Server: http://localhost:3001"
    echo "• Health: http://localhost:3001/health"
    echo "• API: http://localhost:3001/api"
    echo ""
    echo "📋 NEXT STEPS:"
    echo "============="
    echo "1. Test the web app: https://webapp.aegisum.co.za"
    echo "2. Check logs: pm2 logs aegisum-backend"
    echo "3. Monitor status: pm2 status"
    echo ""
    print_success "All systems operational! 🚀"
else
    print_error "Backend server is not responding to health checks"
    echo ""
    echo "🔍 TROUBLESHOOTING:"
    echo "=================="
    echo "1. Check PM2 logs: pm2 logs aegisum-backend"
    echo "2. Check server status: pm2 status"
    echo "3. Test manually: cd backend && node src/server.js"
    echo ""
    exit 1
fi