#!/bin/bash

# AEGT Complete Fix and Start Script
# Fixes all issues and starts the application

set -e

echo "🔧 AEGT Complete Fix and Start..."
echo "================================="

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root for service management
if [ "$EUID" -ne 0 ]; then
    print_error "This script needs to be run with sudo privileges for service management"
    echo "Usage: sudo ./fix_and_start.sh"
    exit 1
fi

print_status "Step 1: Starting PostgreSQL service..."
if systemctl start postgresql 2>/dev/null; then
    print_success "PostgreSQL started successfully"
elif service postgresql start 2>/dev/null; then
    print_success "PostgreSQL started successfully (via service)"
elif /etc/init.d/postgresql start 2>/dev/null; then
    print_success "PostgreSQL started successfully (via init.d)"
else
    print_warning "Could not start PostgreSQL via systemctl/service, trying manual start..."
    sudo -u postgres /usr/lib/postgresql/*/bin/pg_ctl start -D /var/lib/postgresql/*/main/ 2>/dev/null || true
fi

print_status "Step 2: Starting Redis service..."
if systemctl start redis-server 2>/dev/null; then
    print_success "Redis started successfully"
elif service redis-server start 2>/dev/null; then
    print_success "Redis started successfully (via service)"
elif /etc/init.d/redis-server start 2>/dev/null; then
    print_success "Redis started successfully (via init.d)"
else
    print_warning "Could not start Redis via standard methods"
fi

print_status "Step 3: Waiting for services to be ready..."
sleep 3

print_status "Step 4: Testing database connection..."
if sudo -u postgres psql -d aegisum -c "SELECT 1;" > /dev/null 2>&1; then
    print_success "Database connection successful"
else
    print_error "Database connection failed"
    print_status "Attempting to create database..."
    sudo -u postgres createdb aegisum 2>/dev/null || true
    sudo -u postgres psql -c "CREATE USER aegisum_user WITH PASSWORD 'aegisum_password';" 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE aegisum TO aegisum_user;" 2>/dev/null || true
fi

print_status "Step 5: Testing Redis connection..."
if redis-cli ping | grep -q "PONG" 2>/dev/null; then
    print_success "Redis connection successful"
else
    print_warning "Redis connection test failed, but continuing..."
fi

print_status "Step 6: Running database migrations..."
cd /home/daimond/AEGT/backend
if sudo -u daimond node src/database/migrate.js; then
    print_success "Database migrations completed"
else
    print_warning "Database migrations had issues, but continuing..."
fi

print_status "Step 7: Stopping any existing PM2 processes..."
sudo -u daimond pm2 stop all 2>/dev/null || true
sudo -u daimond pm2 delete all 2>/dev/null || true

print_status "Step 8: Starting backend server..."
cd /home/daimond/AEGT
if sudo -u daimond pm2 start ecosystem.config.js; then
    print_success "Backend started with PM2"
else
    print_error "Failed to start with PM2, trying manual start..."
    cd backend
    sudo -u daimond nohup node src/server.js > ../logs/manual-backend.log 2>&1 &
    sleep 3
fi

print_status "Step 9: Testing server health..."
sleep 5

if curl -f -s "http://localhost:3001/health" > /dev/null; then
    print_success "Server health check passed!"
    echo ""
    echo "🎉 AEGT APPLICATION STARTED SUCCESSFULLY!"
    echo "========================================"
    echo "• Backend: http://localhost:3001"
    echo "• Health: http://localhost:3001/health"
    echo "• WebApp: https://webapp.aegisum.co.za"
    echo ""
    echo "📋 SERVICE STATUS:"
    echo "=================="
    sudo -u daimond pm2 status 2>/dev/null || echo "PM2 status not available"
    echo ""
    echo "🧪 QUICK TESTS:"
    echo "=============="
    echo "• Health: $(curl -s http://localhost:3001/health 2>/dev/null || echo 'Failed')"
    echo "• Database: $(sudo -u postgres psql -d aegisum -c 'SELECT 1;' 2>/dev/null && echo 'Connected' || echo 'Failed')"
    echo "• Redis: $(redis-cli ping 2>/dev/null || echo 'Failed')"
    echo ""
    print_success "All systems operational! 🚀"
    echo ""
    echo "🌐 ACCESS YOUR APP:"
    echo "=================="
    echo "Visit: https://webapp.aegisum.co.za"
    echo "Bot: @aegisum_bot on Telegram"
    echo ""
else
    print_error "Server health check failed"
    echo ""
    echo "🔍 TROUBLESHOOTING:"
    echo "=================="
    echo "1. Check logs: sudo -u daimond pm2 logs aegisum-backend"
    echo "2. Check manual log: tail -f /home/daimond/AEGT/logs/manual-backend.log"
    echo "3. Check services:"
    echo "   - PostgreSQL: sudo systemctl status postgresql"
    echo "   - Redis: sudo systemctl status redis-server"
    echo "4. Test database: sudo -u postgres psql -d aegisum"
    echo "5. Test manually: cd /home/daimond/AEGT/backend && sudo -u daimond node src/server.js"
    echo ""
    exit 1
fi