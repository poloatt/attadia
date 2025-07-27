# Configuración para API subdomain
# Redirección de HTTP a HTTPS
server {
    listen 80;
    server_name api.admin.attadia.com;

    # Redirect all HTTP traffic to HTTPS
    return 301 https://$server_name$request_uri;
}

# Servidor HTTPS para la API
server {
    listen 443 ssl http2;
    server_name api.admin.attadia.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.admin.attadia.com/fullchain.pem;
    ssl_private_key /etc/letsencrypt/live/api.admin.attadia.com/privkey.pem;

    # SSL Settings (recomendaciones de seguridad)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # CORS headers para API
    add_header Access-Control-Allow-Origin "https://admin.attadia.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, User-Agent, DNT, Cache-Control, X-Mx-ReqToken, Keep-Alive, X-Requested-With, If-Modified-Since" always;
    add_header Access-Control-Allow-Credentials "true" always;

    # Handle preflight requests
    location ~ ^/api {
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://admin.attadia.com";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, User-Agent, DNT, Cache-Control, X-Mx-ReqToken, Keep-Alive, X-Requested-With, If-Modified-Since";
            add_header Access-Control-Allow-Credentials "true";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }

        # Proxy pass to backend
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;

        # Additional headers for debugging
        add_header X-Debug-Proxy "api.admin.attadia.com -> localhost:5000" always;
        add_header X-Debug-Method "$request_method" always;
    }

    # Logs específicos para este subdominio
    access_log /var/log/nginx/api.admin.attadia.com.access.log;
    error_log /var/log/nginx/api.admin.attadia.com.error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
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