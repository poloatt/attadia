#!/bin/bash

# Variables
PROJECT_ID="present-webapp-449410"
ZONE="southamerica-west1-c"
VM_NAME="foco-prod"

# Colores para los mensajes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== SCRIPT DE DESPLIEGUE A VM EXISTENTE ===${NC}"

# Verificar si docker-compose.prod.yml existe
if [ ! -f "./docker-compose.prod.yml" ]; then
    echo -e "${RED}Error: No se encontró el archivo docker-compose.prod.yml${NC}"
    exit 1
fi

# Conectar a la VM y crear estructura de directorios
echo -e "${BLUE}Conectando a la VM y creando estructura de directorios...${NC}"
gcloud compute ssh --zone "$ZONE" "$VM_NAME" --project "$PROJECT_ID" -- "mkdir -p ~/present/backend ~/present/frontend ~/present/config/nginx/conf.d ~/present/config/ssl/nginx/ssl ~/present/scripts"

# Crear directorios de backup
echo -e "${BLUE}Creando directorios de backup...${NC}"
gcloud compute ssh --zone "$ZONE" "$VM_NAME" --project "$PROJECT_ID" -- "sudo mkdir -p /data/backups/production && sudo chown -R \$(whoami):\$(whoami) /data/backups"

# Copiar docker-compose.prod.yml a la VM
echo -e "${BLUE}Copiando docker-compose.prod.yml a la VM...${NC}"
gcloud compute scp ./docker-compose.prod.yml "$VM_NAME:~/present/docker-compose.yml" --zone "$ZONE" --project "$PROJECT_ID"

# Verificar si hay archivos de configuración adicionales para copiar
if [ -d "./config/nginx/conf.d" ]; then
    echo -e "${BLUE}Copiando configuración de Nginx...${NC}"
    gcloud compute scp --recurse ./config/nginx/conf.d/production.conf "$VM_NAME:~/present/config/nginx/conf.d/default.conf" --zone "$ZONE" --project "$PROJECT_ID"
fi

if [ -d "./config/ssl/nginx/ssl" ]; then
    echo -e "${BLUE}Copiando certificados SSL...${NC}"
    gcloud compute scp --recurse ./config/ssl/nginx/ssl/ "$VM_NAME:~/present/config/ssl/nginx/ssl/" --zone "$ZONE" --project "$PROJECT_ID"
fi

if [ -f "./backend/.env.prod" ]; then
    echo -e "${BLUE}Copiando archivo .env.prod para backend...${NC}"
    gcloud compute scp ./backend/.env.prod "$VM_NAME:~/present/backend/.env.prod" --zone "$ZONE" --project "$PROJECT_ID"
fi

if [ -f "./frontend/.env.prod" ]; then
    echo -e "${BLUE}Copiando archivo .env.prod para frontend...${NC}"
    gcloud compute scp ./frontend/.env.prod "$VM_NAME:~/present/frontend/.env.prod" --zone "$ZONE" --project "$PROJECT_ID"
fi

# Copiar scripts
echo -e "${BLUE}Copiando scripts...${NC}"
gcloud compute scp --recurse ./scripts/ "$VM_NAME:~/present/scripts/" --zone "$ZONE" --project "$PROJECT_ID"

# Ejecutar docker-compose en la VM
echo -e "${BLUE}Iniciando servicios en la VM...${NC}"
gcloud compute ssh --zone "$ZONE" "$VM_NAME" --project "$PROJECT_ID" -- "cd ~/present && docker-compose up -d"

echo -e "${GREEN}¡Despliegue completado!${NC}"
echo -e "${BLUE}Para verificar el estado de los servicios, ejecute:${NC}"
echo "gcloud compute ssh --zone \"$ZONE\" \"$VM_NAME\" --project \"$PROJECT_ID\" -- \"cd ~/present && docker-compose ps\"" 