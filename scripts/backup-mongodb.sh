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
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Crear directorio de backup si no existe
mkdir -p "$BACKUP_DIR"

# Determinar nombre del backup
if [ -n "$1" ]; then
    BACKUP_NAME="$1"
else
    BACKUP_NAME="${ENVIRONMENT}_backup_$TIMESTAMP"
fi

echo -e "${BLUE}Iniciando backup de MongoDB para entorno $ENVIRONMENT...${NC}"

# Crear backup
docker exec $MONGO_CONTAINER mongodump \
  --username $MONGO_USER \
  --password $MONGO_PASSWORD \
  --authenticationDatabase admin \
  --db $MONGO_DB \
  --out /data/db/backup_temp

# Verificar si el backup se realizó correctamente
if [ $? -ne 0 ]; then
    echo -e "${RED}Error al crear el backup de MongoDB${NC}"
    exit 1
fi

# Comprimir backup
echo -e "${BLUE}Comprimiendo backup...${NC}"
docker exec $MONGO_CONTAINER bash -c "cd /data/db && tar -czf backup_temp.tar.gz backup_temp"

# Copiar el archivo comprimido fuera del contenedor
docker cp $MONGO_CONTAINER:/data/db/backup_temp.tar.gz $BACKUP_DIR/$BACKUP_NAME.tar.gz

# Limpiar archivos temporales
echo -e "${BLUE}Limpiando archivos temporales...${NC}"
docker exec $MONGO_CONTAINER rm -rf /data/db/backup_temp /data/db/backup_temp.tar.gz

# Mantener solo los últimos 7 backups
echo -e "${BLUE}Manteniendo solo los últimos 7 backups de $ENVIRONMENT...${NC}"
cd $BACKUP_DIR
ls -t *.tar.gz | tail -n +8 | xargs -r rm

echo -e "${GREEN}Backup completado: $BACKUP_DIR/$BACKUP_NAME.tar.gz${NC}"
exit 0 