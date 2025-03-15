#!/bin/bash

# Colores para los mensajes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Variables de MongoDB (asegúrate de configurar estas variables)
MONGO_USER="admin"
MONGO_PASSWORD="password"

# Verificar si se proporcionó un archivo
if [ -z "$1" ]; then
    echo -e "${RED}Error: Debes especificar el archivo de backup a restaurar${NC}"
    echo "Uso: $0 nombre_del_backup.tar.gz"
    echo -e "${BLUE}Backups disponibles:${NC}"
    ls -1 /data/backups/*.tar.gz 2>/dev/null
    exit 1
fi

BACKUP_FILE="/data/backups/$1"

# Verificar si el archivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: El archivo $BACKUP_FILE no existe${NC}"
    exit 1
fi

echo -e "${BLUE}Preparando restauración...${NC}"

# Crear directorio temporal
TEMP_DIR="/data/mongodb/temp_restore"
sudo rm -rf "$TEMP_DIR"
sudo mkdir -p "$TEMP_DIR"
sudo chown -R 1001:1001 "$TEMP_DIR"

# Extraer backup
echo -e "${BLUE}Extrayendo backup...${NC}"
cd "$TEMP_DIR"
sudo tar xzf "$BACKUP_FILE"

# Restaurar base de datos
echo -e "${BLUE}Restaurando base de datos...${NC}"
sudo docker exec mongodb-prod mongorestore \
    --username "$MONGO_USER" \
    --password "$MONGO_PASSWORD" \
    --authenticationDatabase admin \
    --db present \
    --drop \
    /data/db/temp_restore/present

# Limpiar
echo -e "${BLUE}Limpiando archivos temporales...${NC}"
sudo rm -rf "$TEMP_DIR"

echo -e "${GREEN}¡Restauración completada!${NC}" 