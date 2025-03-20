#!/bin/bash

# Colores para los mensajes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

# Determinar ruta actual
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="/opt/present-webhook"
SERVICE_FILE="/etc/systemd/system/present-webhook.service"

echo -e "${BLUE}Instalando el servidor de webhook para Present App...${NC}"

# Crear directorio para el webhook
echo -e "${BLUE}Creando directorios necesarios...${NC}"
sudo mkdir -p "$TARGET_DIR"
sudo mkdir -p "/var/log/webhook-server"
sudo mkdir -p "/data/backups/production"
sudo mkdir -p "/data/backups/staging"

# Copiar archivos
echo -e "${BLUE}Copiando archivos...${NC}"
sudo cp -r "$SCRIPT_DIR"/* "$TARGET_DIR/"
sudo chmod +x "$TARGET_DIR/deploy.sh"

# Instalar dependencias de Node.js
echo -e "${BLUE}Instalando dependencias de Node.js...${NC}"
cd "$TARGET_DIR" && sudo npm install --production

# Crear archivo de servicio systemd
echo -e "${BLUE}Creando servicio systemd...${NC}"
cat > /tmp/present-webhook.service << EOL
[Unit]
Description=Present Webhook Server
After=network.target

[Service]
ExecStart=/usr/bin/node /opt/present-webhook/webhook-server.js
WorkingDirectory=/opt/present-webhook
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=present-webhook
Environment=NODE_ENV=production
Environment=PORT=9000
Environment=WEBHOOK_SECRET=ProductionSecret_ATTADIA99
Environment=LOG_FILE=/var/log/webhook-server/webhook.log
# Cambia la siguiente variable según el entorno (staging/production)
Environment=SERVER_ENVIRONMENT=production

[Install]
WantedBy=multi-user.target
EOL

sudo mv /tmp/present-webhook.service "$SERVICE_FILE"

# Configurar permisos
echo -e "${BLUE}Configurando permisos...${NC}"
sudo chown -R "$(whoami):$(whoami)" "/var/log/webhook-server"
sudo chown -R "$(whoami):$(whoami)" "/data/backups"
sudo chown -R "$(whoami):$(whoami)" "$TARGET_DIR"

# Iniciar y habilitar el servicio
echo -e "${BLUE}Iniciando el servicio...${NC}"
sudo systemctl daemon-reload
sudo systemctl enable present-webhook.service
sudo systemctl start present-webhook.service

echo -e "${GREEN}¡Instalación completada!${NC}"
echo -e "${BLUE}Estado del servicio:${NC}"
sudo systemctl status present-webhook.service --no-pager

echo -e "${YELLOW}IMPORTANTE: Recuerda editar el archivo de servicio para configurar variables de entorno personalizadas:${NC}"
echo -e "${YELLOW}sudo nano $SERVICE_FILE${NC}"
echo -e "${YELLOW}Después de editar, ejecuta: sudo systemctl daemon-reload && sudo systemctl restart present-webhook.service${NC}"
echo -e "${BLUE}Para verificar los logs: tail -f /var/log/webhook-server/webhook.log${NC}" 