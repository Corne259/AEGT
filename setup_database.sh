#!/bin/bash

# AEGT Database Setup Script
# Installs and configures PostgreSQL for AEGT application

set -e

echo "🗄️ Setting up PostgreSQL database for AEGT..."
echo "=============================================="

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

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    print_error "This script needs to be run with sudo privileges"
    echo "Usage: sudo ./setup_database.sh"
    exit 1
fi

print_status "Updating package lists..."
apt update

print_status "Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

print_status "Starting PostgreSQL service..."
systemctl start postgresql
systemctl enable postgresql

print_status "Creating AEGT database and user..."

# Switch to postgres user and create database
sudo -u postgres psql << EOF
-- Create user
CREATE USER aegisum_user WITH PASSWORD 'aegisum_password';

-- Create database
CREATE DATABASE aegisum OWNER aegisum_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE aegisum TO aegisum_user;

-- Connect to aegisum database and grant schema privileges
\c aegisum

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO aegisum_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aegisum_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aegisum_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO aegisum_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO aegisum_user;

\q
EOF

print_status "Testing database connection..."
if sudo -u postgres psql -d aegisum -c "SELECT version();" > /dev/null 2>&1; then
    print_success "Database connection test successful"
else
    print_error "Database connection test failed"
    exit 1
fi

print_status "Installing Redis (for session management)..."
apt install -y redis-server

print_status "Starting Redis service..."
systemctl start redis-server
systemctl enable redis-server

print_status "Testing Redis connection..."
if redis-cli ping | grep -q "PONG"; then
    print_success "Redis connection test successful"
else
    print_error "Redis connection test failed"
    exit 1
fi

print_success "Database setup completed successfully!"
echo ""
echo "📋 DATABASE CONFIGURATION:"
echo "========================="
echo "• Database: aegisum"
echo "• User: aegisum_user"
echo "• Password: aegisum_password"
echo "• Host: localhost"
echo "• Port: 5432"
echo ""
echo "📋 REDIS CONFIGURATION:"
echo "======================"
echo "• Host: localhost"
echo "• Port: 6379"
echo "• No password required"
echo ""
echo "🚀 NEXT STEPS:"
echo "============="
echo "1. Run database migrations: cd backend && node src/database/migrate.js"
echo "2. Start the backend server: pm2 start ecosystem.config.js"
echo "3. Test the application: curl http://localhost:3001/health"
echo ""
print_success "Ready to run AEGT application! 🎉"