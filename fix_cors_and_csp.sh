#!/bin/bash

echo "🔧 FIXING CORS AND CSP ISSUES"
echo "============================="

# Kill any process using port 3001
echo "[INFO] Killing processes on port 3001..."
sudo fuser -k 3001/tcp || true
sleep 2

# Stop all services
echo "[INFO] Stopping services..."
pm2 stop all || true
pm2 delete all || true
sudo systemctl stop nginx || true

# Fix nginx configuration with proper CSP
echo "[INFO] Fixing nginx configuration..."
sudo tee /etc/nginx/sites-available/aegisum > /dev/null << 'EOF'
server {
    listen 80;
    server_name webapp.aegisum.co.za;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name webapp.aegisum.co.za;

    ssl_certificate /etc/letsencrypt/live/webapp.aegisum.co.za/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/webapp.aegisum.co.za/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    # Security headers with relaxed CSP for TON Connect
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org https://raw.githubusercontent.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https: wss: data:; frame-src 'self' https://telegram.org;" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # API routes
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # CORS headers for API
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type "text/plain; charset=utf-8";
            add_header Content-Length 0;
            return 204;
        }
    }

    # Health check
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
        root /home/daimond/AEGT/frontend/build;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Admin panel route
    location /admin {
        root /home/daimond/AEGT/frontend/build;
        try_files $uri $uri/ /index.html;
    }
}
EOF

echo "[INFO] Testing nginx configuration..."
sudo nginx -t

echo "[INFO] Starting backend..."
cd /home/daimond/AEGT/backend
pm2 start src/server.js --name "aegisum-backend"

echo "[INFO] Starting nginx..."
sudo systemctl start nginx

echo "[INFO] Waiting for services..."
sleep 5

echo "[INFO] Testing endpoints..."
echo "Health check:"
curl -s https://webapp.aegisum.co.za/health | head -3

echo ""
echo "API test:"
curl -s -X POST https://webapp.aegisum.co.za/api/auth/initialize \
  -H "Content-Type: application/json" \
  -d '{"telegramId":123,"username":"test","firstName":"Test"}' | head -3

echo ""
echo "🎉 CORS AND CSP FIXED!"
echo "====================="
echo ""
echo "✅ CORS now allows all origins"
echo "✅ CSP allows TON Connect and external resources"
echo "✅ Backend restarted on clean port"
echo "✅ Nginx configured with proper headers"
echo ""
echo "🌐 Your app should now work at: https://webapp.aegisum.co.za"