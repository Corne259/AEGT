#!/bin/bash

# Create database and user first
echo "🔧 Creating database and user..."

# Create user and database
sudo -u postgres psql -c "CREATE USER aegisum_user WITH PASSWORD 'your_secure_password';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "CREATE DATABASE aegisum_db OWNER aegisum_user;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE aegisum_db TO aegisum_user;"
sudo -u postgres psql -c "ALTER USER aegisum_user CREATEDB;"

echo "✅ Database setup completed!"
echo "Now run: sudo ./final_complete_fix.sh"