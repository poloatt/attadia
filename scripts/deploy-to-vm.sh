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
gcloud compute ssh --zone "$ZONE" "$VM_NAME" --project "$PROJECT_ID" -- "mkdir -p ~/present-prod/backend ~/present-prod/frontend ~/present-prod/nginx/conf.d ~/present-prod/ssl/nginx/ssl ~/present-prod/mongodb_backup"

# Copiar docker-compose.prod.yml a la VM
echo -e "${BLUE}Copiando docker-compose.prod.yml a la VM...${NC}"
gcloud compute scp ./docker-compose.prod.yml "$VM_NAME:~/present-prod/docker-compose.yml" --zone "$ZONE" --project "$PROJECT_ID"

# Verificar si hay archivos de configuración adicionales para copiar
if [ -d "./nginx/conf.d" ]; then
    echo -e "${BLUE}Copiando configuración de Nginx...${NC}"
    gcloud compute scp --recurse ./nginx/conf.d/production.conf "$VM_NAME:~/present-prod/nginx/conf.d/default.conf" --zone "$ZONE" --project "$PROJECT_ID"
fi

if [ -d "./ssl/nginx/ssl" ]; then
    echo -e "${BLUE}Copiando certificados SSL...${NC}"
    gcloud compute scp --recurse ./ssl/nginx/ssl/ "$VM_NAME:~/present-prod/ssl/nginx/ssl/" --zone "$ZONE" --project "$PROJECT_ID"
fi

if [ -f "./backend/.env.prod" ]; then
    echo -e "${BLUE}Copiando archivo .env.prod para backend...${NC}"
    gcloud compute scp ./backend/.env.prod "$VM_NAME:~/present-prod/backend/.env.prod" --zone "$ZONE" --project "$PROJECT_ID"
fi

if [ -f "./frontend/.env.prod" ]; then
    echo -e "${BLUE}Copiando archivo .env.prod para frontend...${NC}"
    gcloud compute scp ./frontend/.env.prod "$VM_NAME:~/present-prod/frontend/.env.prod" --zone "$ZONE" --project "$PROJECT_ID"
fi

# Copiar scripts
echo -e "${BLUE}Copiando scripts...${NC}"
gcloud compute ssh --zone "$ZONE" "$VM_NAME" --project "$PROJECT_ID" -- "mkdir -p ~/present-prod/scripts"
gcloud compute scp --recurse ./scripts/ "$VM_NAME:~/present-prod/scripts/" --zone "$ZONE" --project "$PROJECT_ID"

# Ejecutar docker-compose en la VM
echo -e "${BLUE}Iniciando servicios en la VM...${NC}"
gcloud compute ssh --zone "$ZONE" "$VM_NAME" --project "$PROJECT_ID" -- "cd ~/present-prod && sudo docker-compose up -d"

echo -e "${GREEN}¡Despliegue completado!${NC}"
echo -e "${BLUE}Para verificar el estado de los servicios, ejecute:${NC}"
echo "gcloud compute ssh --zone \"$ZONE\" \"$VM_NAME\" --project \"$PROJECT_ID\" -- \"cd ~/present-prod && sudo docker-compose ps\"" 