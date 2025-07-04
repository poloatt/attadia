# Configuración para API subdomain
# Redirección de HTTP a HTTPS
server {
    listen 80;
    server_name api.admin.attadia.com;

    # Ruta para la validación de Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirección a HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# Servidor HTTPS para la API
server {
    listen 443 ssl;
    server_name api.admin.attadia.com;

    ssl_certificate /etc/nginx/ssl/present-cert.pem;
    ssl_certificate_key /etc/nginx/ssl/present-key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # API - proxy al backend en puerto 5000
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90s;
        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
        
        # Headers adicionales para debugging
        add_header X-Backend-Server "backend-5000" always;
        add_header X-Request-ID $request_id always;
    }

    # Health check
    location /health {
        access_log off;
        return 200 'healthy\n';
        add_header Content-Type text/plain;
    }
    
    # Endpoint específico para verificar que la API funciona
    location /api/health {
        proxy_pass http://localhost:5000/api/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Logging específico para debugging
    access_log /var/log/nginx/api.admin.attadia.com.access.log;
    error_log /var/log/nginx/api.admin.attadia.com.error.log;
} 