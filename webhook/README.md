# Present Webhook Server

Este servidor maneja webhooks de GitHub para implementar despliegue continuo en los ambientes de producción y staging de Present App.

## Características

- Verificación de firma de GitHub (SHA-1 y SHA-256)
- Sistema de reintentos automáticos para despliegues fallidos
- Backup automático de la base de datos antes de actualizaciones
- Rollback automático en caso de fallo durante el despliegue
- Verificación de servicios post-despliegue

## Requisitos

- Node.js >= 14.0.0
- Docker y docker-compose
- Git
- Permisos para ejecutar comandos sudo (para la instalación como servicio)

## Instalación rápida

```bash
# Instalar como servicio systemd
npm run install-service
```

## Instalación manual

1. Clonar el repositorio en `/opt/present-webhook` o cualquier directorio de su elección
2. Instalar dependencias: `npm install --production`
3. Crear archivo `.env` configurando:
   ```
   PORT=9000
   WEBHOOK_SECRET=tu_secreto_seguro
   NODE_ENV=production
   LOG_FILE=/var/log/webhook-server/webhook.log
   SERVER_ENVIRONMENT=production  # o staging
   ```
4. Crear directorio para logs: `sudo mkdir -p /var/log/webhook-server`
5. Configurar permisos: `sudo chown -R $(whoami):$(whoami) /var/log/webhook-server`
6. Iniciar el servidor: `npm start`

## Configuración como servicio systemd

Crear el archivo `/etc/systemd/system/present-webhook.service`:

```ini
[Unit]
Description=Present Webhook Server
After=network.target

[Service]
ExecStart=/usr/bin/node /opt/present-webhook/webhook-server.js
WorkingDirectory=/opt/present-webhook
Restart=always
User=<tu_usuario>
Environment=NODE_ENV=production
Environment=PORT=9000
Environment=WEBHOOK_SECRET=tu_secreto_seguro
Environment=LOG_FILE=/var/log/webhook-server/webhook.log
Environment=SERVER_ENVIRONMENT=production

[Install]
WantedBy=multi-user.target
```

Activar e iniciar el servicio:

```bash
sudo systemctl daemon-reload
sudo systemctl enable present-webhook.service
sudo systemctl start present-webhook.service
```

## Endpoints

- `POST /webhook`: Endpoint principal para recibir webhooks de GitHub
- `GET /health`: Endpoint para verificar el estado del servidor
- `GET /debug`: Endpoint para información de depuración

## Configuración en GitHub

1. Ve a tu repositorio en GitHub
2. Ve a Settings > Webhooks > Add webhook
3. Ingresa la URL (ej: `https://tu-servidor.com:9000/webhook`)
4. Establece el Content type como `application/json`
5. Ingresa tu secreto (el mismo configurado en `WEBHOOK_SECRET`)
6. Elige los eventos que deseas enviar (al menos 'Push')
7. Asegúrate de que el webhook esté activo

## Resolución de problemas

- **Logs**: Revisa los logs con `journalctl -u present-webhook.service` o en `/var/log/webhook-server/webhook.log`
- **Permisos**: Asegúrate que el usuario que ejecuta el servicio tenga permisos para comandos `docker` y `git`
- **Webhook no recibido**: Verifica la configuración en GitHub y asegúrate de que el servidor sea accesible desde Internet
- **Error de firma**: Verifica que el secreto configurado en GitHub coincida con el valor de `WEBHOOK_SECRET`

## Convivencia con los scripts existentes

Este webhook server está diseñado para trabajar junto con los scripts de despliegue existentes como `auto-deploy.sh`, `backup-mongodb.sh`, etc. No los reemplaza completamente, sino que proporciona una forma automatizada de ejecutarlos cuando se reciben cambios del repositorio.

## Seguridad

- Nunca expongas el servicio directamente a Internet sin un proxy inverso con SSL
- Configura un firewall para limitar el acceso solo a las IPs de GitHub
- Usa un secreto fuerte para la firma del webhook
- Ejecuta el servicio con un usuario con privilegios limitados 