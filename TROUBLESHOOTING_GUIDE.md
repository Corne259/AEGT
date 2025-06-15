# 🔧 AEGT Troubleshooting Guide

## 🚨 CRITICAL ISSUE IDENTIFIED

**The main problem causing the 500 errors and authentication failures is that PostgreSQL database is not installed/running on your server.**

---

## 🛠️ IMMEDIATE FIX REQUIRED

### Step 1: Install Database System
```bash
# SSH into your server
ssh daimond@your-server-ip
cd ~/AEGT

# Run the database setup script
sudo ./setup_database.sh
```

### Step 2: Run Database Migrations
```bash
# After database is installed, run migrations
cd backend
node src/database/migrate.js
```

### Step 3: Restart Backend Service
```bash
# Stop any existing processes
pm2 stop all
pm2 delete all

# Start the backend
pm2 start ecosystem.config.js

# Check status
pm2 status
pm2 logs aegisum-backend
```

---

## 🔍 DIAGNOSIS OF CURRENT ISSUES

### 1. Server Error (500 Internal Server Error)
**Cause**: PostgreSQL database not running
**Symptoms**: 
- `/api/auth/login` returns 500 error
- Backend logs show "ECONNREFUSED 127.0.0.1:5432"
- PM2 process may be running but server not responding

**Fix**: Install PostgreSQL using the setup script above

### 2. Wallet Login Failed
**Cause**: Backend authentication endpoints not accessible due to database connection failure
**Symptoms**:
- "Wallet login failed" error messages
- `/api/auth/wallet/challenge` returns 400/500 errors
- TonKeeper wallet connection fails

**Fix**: Same as above - database installation will resolve this

### 3. Authentication System Not Working
**Cause**: Database connection failure prevents user authentication
**Symptoms**:
- Both Telegram and Wallet login fail
- "Server error. Please try again later." messages
- No user sessions being created

**Fix**: Database installation and migration

---

## 📋 COMPLETE SYSTEM REQUIREMENTS

### Required Services:
1. **PostgreSQL** (Database) - ❌ MISSING
2. **Redis** (Session/Cache) - ❌ MISSING  
3. **Node.js** (Backend Runtime) - ✅ INSTALLED
4. **PM2** (Process Manager) - ✅ INSTALLED
5. **Nginx** (Web Server) - ✅ INSTALLED

### Required Packages:
```bash
# Install missing packages
sudo apt update
sudo apt install -y postgresql postgresql-contrib redis-server
```

---

## 🔧 STEP-BY-STEP RECOVERY PROCESS

### Phase 1: Database Setup (CRITICAL)
```bash
# 1. Install PostgreSQL and Redis
sudo ./setup_database.sh

# 2. Verify services are running
sudo systemctl status postgresql
sudo systemctl status redis-server

# 3. Test database connection
psql -h localhost -U aegisum_user -d aegisum -c "SELECT version();"
```

### Phase 2: Application Setup
```bash
# 1. Run database migrations
cd backend
node src/database/migrate.js

# 2. Install dependencies (if needed)
npm install

# 3. Test backend manually
node src/server.js
# Should show: "Server running on port 3001"
# Press Ctrl+C to stop
```

### Phase 3: Production Deployment
```bash
# 1. Start with PM2
pm2 start ecosystem.config.js

# 2. Check status
pm2 status
pm2 logs aegisum-backend

# 3. Test endpoints
curl http://localhost:3001/health
# Should return: {"status":"OK","timestamp":"..."}
```

### Phase 4: Frontend Verification
```bash
# 1. Rebuild frontend (if needed)
cd frontend
npm run build

# 2. Test the web application
# Visit: https://webapp.aegisum.co.za
# Should load without "Server error" messages
```

---

## 🧪 TESTING CHECKLIST

After completing the setup, verify these work:

### Backend API Tests:
```bash
# Health check
curl http://localhost:3001/health

# Auth endpoint (should return validation error, not 500)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"telegramId": 123}'

# Wallet challenge (should return validation error, not 500)
curl -X POST http://localhost:3001/api/auth/wallet/challenge \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "test"}'
```

### Frontend Tests:
1. ✅ Open https://webapp.aegisum.co.za
2. ✅ No "Server error" message should appear
3. ✅ Login page should load properly
4. ✅ Telegram login should attempt authentication (may fail due to test environment)
5. ✅ Wallet connect button should be clickable
6. ✅ Navigation tabs should be visible

---

## 🚨 COMMON ERROR MESSAGES & FIXES

### "ECONNREFUSED 127.0.0.1:5432"
**Problem**: PostgreSQL not running
**Fix**: `sudo systemctl start postgresql`

### "ECONNREFUSED 127.0.0.1:6379"  
**Problem**: Redis not running
**Fix**: `sudo systemctl start redis-server`

### "listen EADDRINUSE: address already in use 0.0.0.0:3001"
**Problem**: Another process using port 3001
**Fix**: 
```bash
# Find and kill the process
sudo fuser -k 3001/tcp
# Or restart PM2
pm2 restart aegisum-backend
```

### "permission denied, open '/home/daimond/AEGT/logs/...'"
**Problem**: Log file permissions
**Fix**: 
```bash
sudo chown -R daimond:daimond ~/AEGT/logs/
chmod 755 ~/AEGT/logs/
```

### "Database 'aegisum' does not exist"
**Problem**: Database not created
**Fix**: Run the database setup script

---

## 📞 SUPPORT COMMANDS

### Check Service Status:
```bash
# PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"

# Redis  
sudo systemctl status redis-server
redis-cli ping

# Backend
pm2 status
pm2 logs aegisum-backend --lines 50

# Nginx
sudo systemctl status nginx
```

### Restart All Services:
```bash
# Database services
sudo systemctl restart postgresql
sudo systemctl restart redis-server

# Application
pm2 restart aegisum-backend

# Web server
sudo systemctl restart nginx
```

### View Logs:
```bash
# Backend logs
pm2 logs aegisum-backend

# System logs
sudo journalctl -u postgresql -f
sudo journalctl -u redis-server -f
sudo journalctl -u nginx -f
```

---

## 🎯 EXPECTED RESULTS AFTER FIX

Once the database is properly installed and configured:

1. ✅ Backend starts without errors
2. ✅ Health endpoint returns 200 OK
3. ✅ Authentication endpoints return proper validation errors (not 500)
4. ✅ Frontend loads without "Server error" messages
5. ✅ Telegram login attempts authentication
6. ✅ Wallet connection works with TonKeeper
7. ✅ All navigation tabs are accessible
8. ✅ Mining, Upgrade, Frens, and Stats pages load properly

---

## 🚀 POST-SETUP VERIFICATION

After running the database setup script, test the complete flow:

```bash
# 1. Check all services
sudo systemctl status postgresql redis-server

# 2. Run migrations
cd ~/AEGT/backend && node src/database/migrate.js

# 3. Start backend
pm2 start ecosystem.config.js

# 4. Test API
curl http://localhost:3001/health

# 5. Test frontend
# Visit https://webapp.aegisum.co.za in browser
```

**Expected Result**: Full application functionality with working authentication, mining, upgrades, friends system, and statistics.

---

## 📧 NEED HELP?

If you continue to experience issues after following this guide:

1. **Check the logs**: `pm2 logs aegisum-backend`
2. **Verify database**: `psql -h localhost -U aegisum_user -d aegisum`
3. **Test manually**: `cd backend && node src/server.js`
4. **Check ports**: `sudo netstat -tlnp | grep -E '3001|5432|6379'`

The main issue is the missing database system - once PostgreSQL and Redis are installed and running, all the authentication and functionality issues should be resolved! 🎉