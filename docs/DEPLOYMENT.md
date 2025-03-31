# Guía de Despliegue - Present App

Este documento describe el proceso de despliegue para los entornos de staging y producción de Present App.

## Requisitos previos

Para desplegar la aplicación, necesitarás:

- Una VM con Debian/Ubuntu
- Acceso SSH a la VM
- Permisos de sudo en la VM
- Git instalado en la VM

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
- Creará los directorios necesarios
- Configurará el servicio de webhook

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
   - URL: `http://tu-ip-o-dominio:9000/webhook`
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

## Backups de la base de datos

### Crear un backup:

```bash
# Para staging
./scripts/backup-mongodb.sh nombre_del_backup staging

# Para producción
./scripts/backup-mongodb.sh nombre_del_backup production
```

Los backups se guardan en `data/backups/mongodb/[staging|production]/` con el formato `[entorno]_backup_YYYYMMDD_HHMMSS.tar.gz` si no se especifica un nombre.

### Restaurar un backup:

```bash
# Para staging
./scripts/restore-mongodb.sh data/backups/mongodb/staging/nombre_del_backup.tar.gz staging

# Para producción
./scripts/restore-mongodb.sh data/backups/mongodb/production/nombre_del_backup.tar.gz production
```

También puedes especificar solo el nombre del archivo y el script buscará en el directorio correspondiente:

```bash
./scripts/restore-mongodb.sh nombre_del_backup staging
```

## Verificación del despliegue

Para verificar que todo está funcionando correctamente:

```bash
# Verificar contenedores en ejecución
docker ps

# Verificar logs del backend
docker logs backend-staging  # o backend-prod para producción

# Verificar logs del webhook
sudo journalctl -u present-webhook.service -f
```

## Solución de problemas

### El webhook no recibe eventos

1. Verifica que el servicio esté en ejecución:
   ```bash
   sudo systemctl status present-webhook.service
   ```

2. Verifica que el puerto esté abierto:
   ```bash
   sudo ufw status
   ```

3. Si el firewall está activo, permite el puerto:
   ```bash
   sudo ufw allow 9000/tcp
   ```

### Los contenedores no se inician

1. Verifica los logs de Docker:
   ```bash
   docker-compose -f docker-compose.staging.yml logs
   ```

2. Intenta reconstruir los contenedores:
   ```bash
   docker-compose -f docker-compose.staging.yml down
   docker-compose -f docker-compose.staging.yml up -d --build
   ```

### Problemas con la configuración de Nginx

1. Si el contenedor `frontend-staging` se reinicia continuamente, verifica los logs:
   ```bash
   docker logs frontend-staging
   ```

2. Si aparece el error "unknown directive" en nginx.conf, revisa la estructura del archivo:
   ```bash
   # Estructura correcta debe comenzar con:
   worker_processes auto;
   events { worker_connections 1024; }
   http {
     # Resto de la configuración
   }
   ```

3. Para corregir problemas con el archivo nginx.conf:
   ```bash
   # Crear un nuevo archivo con la configuración correcta
   echo "worker_processes auto;
   events { worker_connections 1024; }
   http {
       include /etc/nginx/mime.types;
       default_type application/octet-stream;
       # Resto de la configuración del servidor
   }" > nginx.conf.fix
   
   # Reemplazar el archivo existente
   cp nginx.conf.fix frontend/nginx.conf
   
   # Reconstruir y reiniciar el contenedor
   docker-compose -f docker-compose.staging.yml down
   docker-compose -f docker-compose.staging.yml build frontend
   docker-compose -f docker-compose.staging.yml up -d
   ```

4. Para problemas con Nginx del sistema (no el contenedor):
   ```bash
   # Revisar configuración
   sudo nginx -t
   
   # Ver logs de errores
   sudo journalctl -xeu nginx.service
   
   # Configurar correctamente nombres de upstream
   # Nota: usar localhost:puerto en lugar de nombres de contenedores
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