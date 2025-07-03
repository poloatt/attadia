# Guía de Despliegue - Present App

Este documento describe el proceso de despliegue para los entornos de staging y producción de Present App.

## Requisitos previos

Para desplegar la aplicación, necesitarás:

- Una VM con Debian/Ubuntu
- Acceso SSH a la VM
- Permisos de sudo en la VM
- Git instalado en la VM
- Certbot instalado para certificados SSL

## Configuración inicial de la VM

1. Clona el repositorio en la VM:

```bash
git clone https://github.com/poloatt/present.git ~/present
cd ~/present
```

2. Ejecuta el script de configuración de la VM:

```bash
chmod +x scripts/setup-vm.sh
./scripts/setup-vm.sh
```

Este script instalará:
- Node.js (para el servidor webhook)
- Docker y Docker Compose
- Certbot para certificados SSL
- Creará los directorios necesarios
- Configurará el servicio de webhook

## Configuración de SSL

1. Detén todos los servicios que puedan estar usando los puertos 80/443:
```bash
docker-compose -f docker-compose.prod.yml down
```

2. Genera los certificados SSL:
```bash
sudo certbot certonly --standalone -d present.attadia.com -d admin.attadia.com
```

3. Copia los certificados al directorio del proyecto:
```bash
sudo cp /etc/letsencrypt/live/present.attadia.com/fullchain.pem /home/poloatt/present/ssl/nginx/ssl/
sudo cp /etc/letsencrypt/live/present.attadia.com/privkey.pem /home/poloatt/present/ssl/nginx/ssl/
sudo chown -R poloatt:poloatt /home/poloatt/present/ssl/nginx/ssl/
```

4. Configura la renovación automática:
```bash
chmod +x ssl/renew_certs.sh
```

## Configuración del Webhook

1. Edita el archivo de servicio para configurar el secreto del webhook:

```bash
sudo nano /etc/systemd/system/present-webhook.service
```

2. Cambia el valor de `WEBHOOK_SECRET` por un valor seguro.

3. Reinicia el servicio:

```bash
sudo systemctl daemon-reload
sudo systemctl restart present-webhook.service
```

4. Configura el mismo secreto en GitHub:
   - Ve a tu repositorio en GitHub
   - Ve a Settings > Webhooks > Add webhook
   - URL: `https://admin.attadia.com/webhook`
   - Content type: `application/json`
   - Secret: El mismo valor que configuraste en el servicio
   - Eventos: Selecciona "Just the push event"

## Despliegue manual

Si necesitas realizar un despliegue manual:

### Para Staging:

```bash
cd ~/present
./scripts/auto-deploy.sh staging
```

### Para Producción:

```bash
cd ~/present
./scripts/auto-deploy.sh production
```

## Backups

### Backup de la base de datos:

```bash
# Para staging
./scripts/backup-mongodb.sh nombre_del_backup staging

# Para producción
./scripts/backup-mongodb.sh nombre_del_backup production
```

### Backup de certificados SSL:

```bash
# Crear backup
sudo cp -r /etc/letsencrypt/live/present.attadia.com/* /home/poloatt/present/ssl/ssl_backup/

# Restaurar backup
sudo cp /home/poloatt/present/ssl/ssl_backup/* /etc/letsencrypt/live/present.attadia.com/
```

## Verificación del despliegue

Para verificar que todo está funcionando correctamente:

```bash
# Verificar contenedores
docker ps

# Verificar logs del backend
docker logs backend-prod

# Verificar logs del frontend
docker logs frontend-prod

# Verificar certificados SSL
sudo certbot certificates

# Verificar configuración de nginx
docker exec frontend-prod nginx -t

# Probar conectividad HTTPS
curl -k https://present.attadia.com/health
```

## Solución de problemas

### Problemas con SSL

1. Verifica que los certificados existan y tengan los permisos correctos:
```bash
ls -l /home/poloatt/present/ssl/nginx/ssl/
sudo chown -R poloatt:poloatt /home/poloatt/present/ssl/nginx/ssl/
sudo chmod 644 /home/poloatt/present/ssl/nginx/ssl/*.pem
```

2. Renueva los certificados manualmente:
```bash
cd /home/poloatt/present
./ssl/renew_certs.sh
```

### Problemas con el webhook

1. Verifica el estado del servicio:
```bash
sudo systemctl status present-webhook.service
```

2. Revisa los logs:
```bash
sudo journalctl -u present-webhook.service -f
```

### Problemas con los contenedores

1. Reinicia los contenedores:
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

2. Verifica los logs:
```bash
docker-compose -f docker-compose.prod.yml logs
```

## Migración de Staging a Producción

Cuando estés listo para migrar de staging a producción:

1. Fusiona los cambios de la rama `staging` a `main` en GitHub.
2. El webhook detectará el cambio y desplegará automáticamente en producción.
3. Alternativamente, puedes ejecutar manualmente:
   ```bash
   cd ~/present
   git checkout main
   git pull
   ./scripts/auto-deploy.sh production
   ```

## Gestión de Certificados SSL

Los certificados SSL son esenciales para proporcionar una conexión segura a la aplicación. A continuación se detallan los pasos para gestionar estos certificados:

### Generación de certificados autofirmados

Para entornos de desarrollo o pruebas, puedes usar certificados autofirmados:

```bash
# Para staging
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/staging-key.pem \
    -out /etc/nginx/ssl/staging-cert.pem \
    -subj "/CN=staging.present.attadia.com" \
    -addext "subjectAltName = DNS:staging.present.attadia.com,DNS:api.staging.present.attadia.com"

# Para producción
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/production-key.pem \
    -out /etc/nginx/ssl/production-cert.pem \
    -subj "/CN=present.attadia.com" \
    -addext "subjectAltName = DNS:present.attadia.com,DNS:admin.attadia.com"
```

Configura los permisos adecuados:
```bash
sudo chown root:root /etc/nginx/ssl/*.pem
sudo chmod 600 /etc/nginx/ssl/*-key.pem
sudo chmod 644 /etc/nginx/ssl/*-cert.pem
```

### Uso de Let's Encrypt (recomendado para producción)

Para producción, recomendamos usar certificados de Let's Encrypt:

1. Instala Certbot:
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

2. Genera los certificados:
```bash
# Para staging
sudo certbot --nginx -d staging.present.attadia.com -d api.staging.present.attadia.com

# Para producción
sudo certbot --nginx -d present.attadia.com -d admin.attadia.com
```

3. Configura la renovación automática:
```bash
sudo systemctl status certbot.timer  # Verifica que el timer esté activo
```

### Solución de problemas con certificados

Si encuentras problemas con los certificados SSL, consulta la guía de solución de problemas en [TROUBLESHOOTING.md](./TROUBLESHOOTING.md). 