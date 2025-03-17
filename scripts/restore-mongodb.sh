#!/bin/bash

# Colores para los mensajes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Determinar el entorno
if [ "$2" = "staging" ]; then
    ENVIRONMENT="staging"
    MONGO_CONTAINER="mongodb-staging"
    MONGO_USER=${MONGO_USER:-"admin"}
    MONGO_PASSWORD=${MONGO_PASSWORD:-"MiContraseñaSegura123"}
    MONGO_DB=${MONGO_DB:-"present"}
else
    ENVIRONMENT="production"
    MONGO_CONTAINER="mongodb-prod"
    MONGO_USER=${MONGO_USER:-"admin"}
    MONGO_PASSWORD=${MONGO_PASSWORD:-"MiContraseñaSegura123"}
    MONGO_DB=${MONGO_DB:-"present"}
fi

# Configuración
BACKUP_DIR="/data/backups/$ENVIRONMENT"

# Verificar si se proporcionó un archivo
if [ -z "$1" ]; then
    echo -e "${RED}Error: Debes especificar el archivo de backup a restaurar${NC}"
    echo "Uso: $0 nombre_del_backup.tar.gz [staging|production]"
    echo -e "${BLUE}Backups disponibles para $ENVIRONMENT:${NC}"
    ls -1 $BACKUP_DIR/*.tar.gz 2>/dev/null || echo "No hay backups disponibles"
    exit 1
fi

BACKUP_FILE="$BACKUP_DIR/$1"

# Verificar si el archivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: El archivo $BACKUP_FILE no existe${NC}"
    exit 1
fi

echo -e "${BLUE}Preparando restauración para entorno $ENVIRONMENT...${NC}"

# Copiar el archivo de backup al contenedor
echo -e "${BLUE}Copiando archivo de backup al contenedor...${NC}"
docker cp "$BACKUP_FILE" $MONGO_CONTAINER:/data/db/backup_temp.tar.gz

# Extraer backup dentro del contenedor
echo -e "${BLUE}Extrayendo backup...${NC}"
docker exec $MONGO_CONTAINER bash -c "mkdir -p /data/db/restore_temp && tar -xzf /data/db/backup_temp.tar.gz -C /data/db/restore_temp"

# Restaurar base de datos
echo -e "${BLUE}Restaurando base de datos $MONGO_DB en $ENVIRONMENT...${NC}"
docker exec $MONGO_CONTAINER mongorestore \
    --username "$MONGO_USER" \
    --password "$MONGO_PASSWORD" \
    --authenticationDatabase admin \
    --db $MONGO_DB \
    --drop \
    /data/db/restore_temp/backup_temp/$MONGO_DB

# Verificar si la restauración fue exitosa
if [ $? -ne 0 ]; then
    echo -e "${RED}Error al restaurar la base de datos${NC}"
    # Limpiar
    docker exec $MONGO_CONTAINER rm -rf /data/db/backup_temp.tar.gz /data/db/restore_temp
    exit 1
fi

# Limpiar
echo -e "${BLUE}Limpiando archivos temporales...${NC}"
docker exec $MONGO_CONTAINER rm -rf /data/db/backup_temp.tar.gz /data/db/restore_temp

echo -e "${GREEN}¡Restauración completada exitosamente para entorno $ENVIRONMENT!${NC}"
exit 0 