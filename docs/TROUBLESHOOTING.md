# Guía de Solución de Problemas - Present App

Este documento proporciona soluciones para problemas comunes que pueden ocurrir en los entornos de staging y producción.

## Problemas con Certificados SSL

### Error: NET::ERR_CERT_COMMON_NAME_INVALID

Este error ocurre cuando el nombre de dominio al que intentas acceder no está incluido en el certificado SSL.

**Solución:**
1. Genera un nuevo certificado autofirmado que incluya todos los subdominios necesarios:

```bash
# Crear certificados autofirmados para staging
sudo mkdir -p /tmp/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /tmp/ssl/staging-key.pem \
    -out /tmp/ssl/staging-cert.pem \
    -subj "/CN=staging.present.attadia.com" \
    -addext "subjectAltName = DNS:staging.present.attadia.com,DNS:api.staging.present.attadia.com"

# Copiar a la ubicación de Nginx
sudo cp /tmp/ssl/staging-cert.pem /tmp/ssl/staging-key.pem /etc/nginx/ssl/
sudo chown root:root /etc/nginx/ssl/staging-*.pem
sudo chmod 600 /etc/nginx/ssl/staging-key.pem
sudo chmod 644 /etc/nginx/ssl/staging-cert.pem
```

2. Actualiza la configuración de Nginx para usar estos certificados:

```bash
sudo cp /etc/nginx/sites-available/staging.conf /etc/nginx/sites-available/staging.conf.bak
sudo sed -i 's|ssl_certificate /etc/nginx/ssl/fullchain.pem;|ssl_certificate /etc/nginx/ssl/staging-cert.pem;|g' /etc/nginx/sites-available/staging.conf
sudo sed -i 's|ssl_certificate_key /etc/nginx/ssl/privkey.pem;|ssl_certificate_key /etc/nginx/ssl/staging-key.pem;|g' /etc/nginx/sites-available/staging.conf
sudo systemctl restart nginx
```

3. Para una solución permanente, considera obtener un certificado válido de Let's Encrypt.

## Problemas con el Contenedor Frontend

### Error: "unknown directive "<<<<<<<" in /etc/nginx/nginx.conf"

Este error indica conflictos de Git no resueltos en el archivo nginx.conf.

**Solución:**

1. Edita el archivo nginx.conf para eliminar los marcadores de conflicto (<<<<<<< HEAD, =======, >>>>>>> branch):

```bash
# Crear una versión limpia del archivo
cat > frontend/nginx.conf << 'EOL'
worker_processes auto;
events { worker_connections 1024; }
http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Configuración para el frontend
        location / {
            try_files $uri $uri/ /index.html;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }

        # Proxy inverso para la API (usar backend-staging o backend-prod según el entorno)
        location /api/ {
            proxy_pass http://backend-prod:5000/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 90s;
        }

        # Configuración para archivos estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, no-transform";
        }

        # Health check endpoint
        location /health {
            access_log off;
            add_header Content-Type text/plain;
            return 200 "OK";
        }
    }
}
EOL
```

2. Reconstruye y reinicia el contenedor:

```bash
# Para producción
docker-compose -f docker-compose.production.yml down frontend-prod
docker-compose -f docker-compose.production.yml build frontend
docker-compose -f docker-compose.production.yml up -d

# Para staging
docker-compose -f docker-compose.staging.yml down frontend-staging
docker-compose -f docker-compose.staging.yml build frontend
docker-compose -f docker-compose.staging.yml up -d
```

## Problemas con el Webhook

### El webhook no responde o no despliega automáticamente

**Solución:**

1. Verifica el estado del servicio:
```bash
sudo systemctl status present-webhook.service
```

2. Revisa los logs:
```bash
sudo journalctl -u present-webhook.service -f
```

3. Si es necesario, reinicia el servicio:
```bash
sudo systemctl restart present-webhook.service
```

4. Verifica la configuración del secret:
```bash
sudo nano /etc/systemd/system/present-webhook.service
```

## Problemas con la API (Backend)

### Error: "502 Bad Gateway" al acceder a endpoints de la API

**Causas comunes:**
1. El contenedor backend no está funcionando
2. Problema de configuración del proxy en Nginx
3. La aplicación backend tiene un error interno

**Solución:**

1. Verifica el estado del contenedor:
```bash
docker ps | grep backend
```

2. Revisa los logs del backend:
```bash
docker logs backend-prod  # o backend-staging para staging
```

3. Prueba la conectividad dentro del servidor:
```bash
curl localhost:5000/api/health
```

4. Verifica la configuración del proxy en nginx.conf:
```bash
# Asegúrate de que el nombre del backend sea correcto:
# Para producción: backend-prod
# Para staging: backend-staging
``` 