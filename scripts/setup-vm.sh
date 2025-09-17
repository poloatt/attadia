#!/bin/bash

# Colores para los mensajes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

# Obtener la ruta absoluta del directorio del script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$( dirname "$SCRIPT_DIR" )"

echo -e "${BLUE}Iniciando configuración de la VM para Present App...${NC}"
echo -e "${BLUE}Directorio del proyecto: $PROJECT_DIR${NC}"

# Actualizar repositorios
echo -e "${BLUE}Actualizando repositorios...${NC}"
sudo apt update

# Instalar dependencias básicas
echo -e "${BLUE}Instalando dependencias básicas...${NC}"
sudo apt install -y curl wget git build-essential

# Instalar Node.js (versión LTS)
echo -e "${BLUE}Instalando Node.js...${NC}"
if ! command -v nodejs &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    echo -e "${GREEN}Node.js instalado correctamente:${NC}"
    nodejs --version
    npm --version
else
    echo -e "${YELLOW}Node.js ya está instalado:${NC}"
    nodejs --version
    npm --version
fi

# Instalar Docker si no está instalado
echo -e "${BLUE}Verificando instalación de Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${BLUE}Instalando Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo -e "${YELLOW}Se agregó el usuario actual al grupo docker. Es posible que necesites cerrar sesión y volver a iniciarla.${NC}"
else
    echo -e "${GREEN}Docker ya está instalado.${NC}"
    docker --version
fi

# Instalar Docker Compose si no está instalado
echo -e "${BLUE}Verificando instalación de Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo -e "${BLUE}Instalando Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}Docker Compose instalado correctamente:${NC}"
    docker-compose --version
else
    echo -e "${GREEN}Docker Compose ya está instalado.${NC}"
    docker-compose --version
fi

# Crear directorios necesarios
echo -e "${BLUE}Creando directorios necesarios...${NC}"
sudo mkdir -p /data/backups/staging
sudo mkdir -p /data/backups/production
sudo mkdir -p /var/log/webhook-server
sudo chown -R $USER:$USER /data/backups
sudo chown -R $USER:$USER /var/log/webhook-server
touch /var/log/webhook-server/webhook-server.log
sudo chown -R $USER:$USER /var/log/webhook-server/webhook-server.log

# Configurar el servicio de webhook
echo -e "${BLUE}Configurando el servicio de webhook...${NC}"
sudo cp "$PROJECT_DIR/scripts/present-webhook.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable present-webhook.service
sudo systemctl restart present-webhook.service
echo -e "${GREEN}Servicio de webhook configurado y activado.${NC}"

# Hacer ejecutables los scripts
echo -e "${BLUE}Haciendo ejecutables los scripts...${NC}"
chmod +x "$PROJECT_DIR/scripts/"*.sh
chmod +x "$PROJECT_DIR/scripts/"*.js

echo -e "${GREEN}¡Configuración completada con éxito!${NC}"
echo -e "${BLUE}Recuerda configurar el secreto del webhook en /etc/systemd/system/present-webhook.service${NC}"
echo -e "${BLUE}y reiniciar el servicio con: sudo systemctl restart present-webhook.service${NC}" 