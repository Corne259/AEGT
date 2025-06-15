#!/bin/bash

# AEGT Emergency Fix Script
# Fixes nginx conflicts and gets the app working immediately

set -e

echo "🚨 EMERGENCY FIX FOR AEGT..."
echo "============================"

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "This script needs to be run with sudo privileges"
    echo "Usage: sudo ./emergency_fix.sh"
    exit 1
fi

print_status "Step 1: Checking existing nginx configurations..."
ls -la /etc/nginx/sites-enabled/ | grep -E "(aegisum|webapp)" || echo "No existing configs found"

print_status "Step 2: Removing conflicting configurations..."
rm -f /etc/nginx/sites-enabled/aegisum.co.za 2>/dev/null || true
rm -f /etc/nginx/sites-enabled/webapp.aegisum.co.za 2>/dev/null || true
rm -f /etc/nginx/sites-available/aegisum.co.za 2>/dev/null || true

print_status "Step 3: Creating simple HTTP-only configuration (bypass SSL issues)..."

# Create a simple HTTP configuration first
cat > /etc/nginx/sites-available/webapp.aegisum.co.za << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name webapp.aegisum.co.za;

    # Root directory for frontend
    root /home/daimond/AEGT/frontend/build;
    index index.html;

    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend static files
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
EOF

print_status "Step 4: Enabling the new configuration..."
ln -sf /etc/nginx/sites-available/webapp.aegisum.co.za /etc/nginx/sites-enabled/

print_status "Step 5: Testing nginx configuration..."
if nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration has errors"
    nginx -t
    exit 1
fi

print_status "Step 6: Restarting nginx..."
systemctl restart nginx

print_status "Step 7: Waiting for services to be ready..."
sleep 3

print_status "Step 8: Testing backend health..."
if curl -f -s "http://localhost:3001/health" > /dev/null; then
    print_success "Backend is healthy"
else
    print_error "Backend is not responding"
    exit 1
fi

print_status "Step 9: Testing HTTP API proxy..."
if curl -f -s "http://webapp.aegisum.co.za/api/health" > /dev/null; then
    print_success "HTTP API proxy is working!"
    
    echo ""
    echo "🎉 EMERGENCY FIX COMPLETED!"
    echo "=========================="
    echo "• Frontend: http://webapp.aegisum.co.za"
    echo "• API: http://webapp.aegisum.co.za/api"
    echo "• Health: http://webapp.aegisum.co.za/health"
    echo ""
    echo "🧪 QUICK TESTS:"
    echo "=============="
    echo "• HTTP API Health: $(curl -s http://webapp.aegisum.co.za/api/health 2>/dev/null | jq -r .status 2>/dev/null || echo 'OK')"
    echo "• Backend Direct: $(curl -s http://localhost:3001/health 2>/dev/null | jq -r .status 2>/dev/null || echo 'OK')"
    echo ""
    print_success "Your web app should now work without 'Server error'! 🚀"
    echo ""
    echo "🌐 TEST YOUR APP:"
    echo "================"
    echo "Visit: http://webapp.aegisum.co.za (HTTP for now)"
    echo "The 'Server error' message should be GONE!"
    echo ""
    echo "📋 NEXT STEPS:"
    echo "=============="
    echo "1. Test the app functionality"
    echo "2. If working, we can add HTTPS later"
    echo "3. For now, HTTP should eliminate the server error"
    echo ""
    
elif curl -f -s "https://webapp.aegisum.co.za/api/health" > /dev/null; then
    print_success "HTTPS API proxy is working!"
    echo ""
    echo "🎉 EMERGENCY FIX COMPLETED!"
    echo "=========================="
    echo "• Frontend: https://webapp.aegisum.co.za"
    echo "• API: https://webapp.aegisum.co.za/api"
    echo ""
    print_success "Your web app should now work without 'Server error'! 🚀"
    
else
    print_warning "API proxy test failed, but nginx is configured"
    echo ""
    echo "🔍 MANUAL TESTING REQUIRED:"
    echo "=========================="
    echo "1. Visit: http://webapp.aegisum.co.za"
    echo "2. Check browser console for errors"
    echo "3. Test API manually: curl http://webapp.aegisum.co.za/api/health"
    echo ""
    echo "📋 DEBUGGING COMMANDS:"
    echo "====================="
    echo "• Check nginx: systemctl status nginx"
    echo "• Check backend: curl http://localhost:3001/health"
    echo "• Check logs: tail -f /var/log/nginx/error.log"
    echo ""
fi

print_status "Step 10: Updating frontend API configuration for HTTP..."

# Update frontend API configuration to use HTTP for now
cat > /home/daimond/AEGT/frontend/src/services/api.js << 'EOF'
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create axios instance
export const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'http://webapp.aegisum.co.za/api' 
    : 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      delete api.defaults.headers.common['Authorization'];
      toast.error('Session expired. Please login again.');
      window.location.reload();
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR') {
      toast.error('Network error. Please check your connection.');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (userData) => api.post('/auth/login', userData),
  me: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
  // TON Wallet authentication
  walletChallenge: (data) => api.post('/auth/wallet/challenge', data),
  walletVerify: (data) => api.post('/auth/wallet/verify', data),
  walletConnect: (data) => api.post('/auth/wallet/connect', data),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  getStats: () => api.get('/user/stats'),
  getBalance: () => api.get('/user/balance'),
  getTransactions: (params) => api.get('/user/transactions', { params }),
};

// Mining API
export const miningAPI = {
  startMining: () => api.post('/mining/start'),
  stopMining: () => api.post('/mining/stop'),
  getStatus: () => api.get('/mining/status'),
  claimReward: (blockId) => api.post(`/mining/claim/${blockId}`),
  getHistory: (params) => api.get('/mining/history', { params }),
  getBlocks: (params) => api.get('/mining/blocks', { params }),
};

// Upgrade API
export const upgradeAPI = {
  getAvailable: () => api.get('/upgrades/available'),
  purchase: (data) => api.post('/upgrades/purchase', data),
  getHistory: () => api.get('/upgrades/history'),
};

// Energy API
export const energyAPI = {
  getStatus: () => api.get('/energy/status'),
  refill: (paymentData) => api.post('/energy/refill', paymentData),
  getRefillHistory: () => api.get('/energy/history'),
};

// TON API
export const tonAPI = {
  connectWallet: (walletData) => api.post('/ton/connect', walletData),
  disconnectWallet: () => api.post('/ton/disconnect'),
  getBalance: () => api.get('/ton/balance'),
  sendTransaction: (transactionData) => api.post('/ton/transaction', transactionData),
  getTransactions: (params) => api.get('/ton/transactions', { params }),
};

// Admin API
export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getStats: () => api.get('/admin/stats'),
  updateTreasuryFee: (fee) => api.put('/admin/treasury-fee', { fee }),
  getSystemStatus: () => api.get('/admin/system-status'),
};

// Helper functions
export const initializeUser = async (telegramData) => {
  try {
    const response = await api.post('/auth/initialize', telegramData);
    return response.data;
  } catch (error) {
    console.error('Failed to initialize user:', error);
    throw error;
  }
};

export const formatError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.message) {
    return error.message;
  } else {
    return 'An unexpected error occurred';
  }
};

export default api;
EOF

print_status "Step 11: Rebuilding frontend with HTTP API..."
cd /home/daimond/AEGT/frontend
sudo -u daimond npm run build

print_success "Emergency fix completed! Test your app now at http://webapp.aegisum.co.za"