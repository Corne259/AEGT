#!/bin/bash

# AEGT Nginx Proxy Fix Script
# Configures nginx to properly proxy API requests to backend

set -e

echo "🔧 Fixing Nginx Proxy Configuration..."
echo "====================================="

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

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "This script needs to be run with sudo privileges"
    echo "Usage: sudo ./fix_nginx_proxy.sh"
    exit 1
fi

print_status "Creating nginx configuration for webapp.aegisum.co.za..."

# Create nginx configuration
cat > /etc/nginx/sites-available/webapp.aegisum.co.za << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name webapp.aegisum.co.za;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name webapp.aegisum.co.za;

    # SSL Configuration (assuming Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/webapp.aegisum.co.za/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/webapp.aegisum.co.za/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

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

print_status "Enabling the site..."
ln -sf /etc/nginx/sites-available/webapp.aegisum.co.za /etc/nginx/sites-enabled/

print_status "Testing nginx configuration..."
if nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration has errors"
    exit 1
fi

print_status "Reloading nginx..."
systemctl reload nginx

print_status "Testing API proxy..."
sleep 2

if curl -f -s "https://webapp.aegisum.co.za/api/health" > /dev/null; then
    print_success "API proxy is working!"
    echo ""
    echo "🎉 NGINX PROXY CONFIGURED SUCCESSFULLY!"
    echo "======================================"
    echo "• Frontend: https://webapp.aegisum.co.za"
    echo "• API: https://webapp.aegisum.co.za/api"
    echo "• Health: https://webapp.aegisum.co.za/health"
    echo ""
    echo "🧪 QUICK TESTS:"
    echo "=============="
    echo "• API Health: $(curl -s https://webapp.aegisum.co.za/api/health 2>/dev/null | jq -r .status 2>/dev/null || echo 'OK')"
    echo "• Backend Direct: $(curl -s http://localhost:3001/health 2>/dev/null | jq -r .status 2>/dev/null || echo 'OK')"
    echo ""
    print_success "Your web app should now work without 'Server error'! 🚀"
    echo ""
    echo "🌐 TEST YOUR APP:"
    echo "================"
    echo "Visit: https://webapp.aegisum.co.za"
    echo "The 'Server error' message should be gone!"
    echo ""
else
    print_error "API proxy test failed"
    echo ""
    echo "🔍 TROUBLESHOOTING:"
    echo "=================="
    echo "1. Check nginx status: systemctl status nginx"
    echo "2. Check backend: curl http://localhost:3001/health"
    echo "3. Check nginx logs: tail -f /var/log/nginx/error.log"
    echo "4. Check SSL certificates: ls -la /etc/letsencrypt/live/webapp.aegisum.co.za/"
    echo ""
    exit 1
fi