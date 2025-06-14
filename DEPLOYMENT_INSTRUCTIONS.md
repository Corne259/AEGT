# 🚀 AEGT Deployment Instructions

## What Was Fixed

✅ **Frontend API URL** - Changed from `aegisum.co.za` to `webapp.aegisum.co.za`  
✅ **Telegram Bot Token** - Updated to correct token  
✅ **AEGT Logo** - Added proper logo files  
✅ **API Validation** - Fixed auth/initialize endpoint  

## 📋 Steps to Deploy on Production Server

### 1. Pull the Latest Changes
```bash
cd ~/AEGT
git pull origin main
```

### 2. Run the Update Script
```bash
./production_update.sh
```

**That's it!** The script will:
- Pull latest changes
- Rebuild frontend
- Restart backend
- Test all endpoints
- Show you the results

## 🔍 Manual Steps (if needed)

If the script doesn't work, run these manually:

```bash
# 1. Pull changes
cd ~/AEGT
git pull origin main

# 2. Rebuild frontend
cd frontend
npm run build
cd ..

# 3. Fix permissions
sudo chown -R daimond:daimond frontend/build/

# 4. Restart services
pm2 restart aegisum-backend
sudo systemctl reload nginx
```

## ✅ Testing

After deployment, test these:

1. **Website**: Visit `https://webapp.aegisum.co.za`
2. **API Health**: `curl https://webapp.aegisum.co.za/health`
3. **Bot Commands**: Message `@AEGTMinerbot` with `/start`

## 🔧 What Should Work Now

- ✅ Website loads without "Failed to initialize" error
- ✅ Telegram bot commands respond properly  
- ✅ AEGT logo displays correctly
- ✅ API endpoints work correctly

## 🆘 If Something Goes Wrong

Check the logs:
```bash
pm2 logs aegisum-backend --lines 20
```

The main issues were:
1. Frontend calling wrong API URL
2. Backend using wrong bot token
3. Missing logo files

All of these are now fixed! 🎉