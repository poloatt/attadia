#!/bin/bash

# Colores para los mensajes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

# Verificar si se está ejecutando como root o con sudo
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${YELLOW}Advertencia: Este script podría requerir permisos elevados para crear directorios y archivos.${NC}"
fi

# Obtener la ruta absoluta del directorio del script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$( dirname "$SCRIPT_DIR" )"

# Determinar el entorno
if [ "$2" = "staging" ]; then
    ENVIRONMENT="staging"
    MONGO_CONTAINER="mongodb"
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

# Verificar si el contenedor de MongoDB está en ejecución
if ! docker ps | grep -q $MONGO_CONTAINER; then
    echo -e "${RED}Error: El contenedor $MONGO_CONTAINER no está en ejecución.${NC}"
    echo -e "${BLUE}Contenedores en ejecución:${NC}"
    docker ps
    exit 1
fi

# Crear directorio de backup si no existe
echo -e "${BLUE}Creando directorio de backup: $BACKUP_DIR${NC}"
if ! mkdir -p "$BACKUP_DIR"; then
    echo -e "${RED}Error: No se pudo crear el directorio de backup: $BACKUP_DIR${NC}"
    echo -e "${YELLOW}Intentando crear con sudo...${NC}"
    sudo mkdir -p "$BACKUP_DIR"
    sudo chown -R $(whoami):$(whoami) "$BACKUP_DIR"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        echo -e "${RED}Error: No se pudo crear el directorio de backup incluso con sudo.${NC}"
        exit 1
    fi
fi

# Determinar nombre del backup
if [ -n "$1" ]; then
    BACKUP_NAME="$1"
else
    BACKUP_NAME="${ENVIRONMENT}_backup_$TIMESTAMP"
fi

echo -e "${BLUE}Iniciando backup de MongoDB para entorno $ENVIRONMENT...${NC}"
echo -e "${BLUE}Contenedor: $MONGO_CONTAINER${NC}"
echo -e "${BLUE}Base de datos: $MONGO_DB${NC}"
echo -e "${BLUE}Nombre del backup: $BACKUP_NAME${NC}"

# Crear backup
echo -e "${BLUE}Ejecutando mongodump...${NC}"
if ! docker exec $MONGO_CONTAINER mongodump \
  --username $MONGO_USER \
  --password $MONGO_PASSWORD \
  --authenticationDatabase admin \
  --db $MONGO_DB \
  --out /data/db/backup_temp; then
    
    echo -e "${RED}Error al crear el backup de MongoDB${NC}"
    echo -e "${BLUE}Verificando estado del contenedor...${NC}"
    docker inspect --format='{{.State.Status}}' $MONGO_CONTAINER
    echo -e "${BLUE}Verificando logs del contenedor...${NC}"
    docker logs --tail 20 $MONGO_CONTAINER
    exit 1
fi

# Verificar si el backup se realizó correctamente
echo -e "${BLUE}Verificando si el backup se realizó correctamente...${NC}"
if ! docker exec $MONGO_CONTAINER ls -la /data/db/backup_temp/$MONGO_DB; then
    echo -e "${RED}Error: No se encontraron archivos de backup en el contenedor.${NC}"
    exit 1
fi

# Comprimir backup
echo -e "${BLUE}Comprimiendo backup...${NC}"
if ! docker exec $MONGO_CONTAINER bash -c "cd /data/db && tar -czf backup_temp.tar.gz backup_temp"; then
    echo -e "${RED}Error al comprimir el backup.${NC}"
    exit 1
fi

# Copiar el archivo comprimido fuera del contenedor
echo -e "${BLUE}Copiando archivo comprimido fuera del contenedor...${NC}"
if ! docker cp $MONGO_CONTAINER:/data/db/backup_temp.tar.gz $BACKUP_DIR/$BACKUP_NAME.tar.gz; then
    echo -e "${RED}Error al copiar el archivo de backup desde el contenedor.${NC}"
    echo -e "${YELLOW}Verificando permisos del directorio $BACKUP_DIR...${NC}"
    ls -la $BACKUP_DIR
    exit 1
fi

# Verificar que el archivo se copió correctamente
if [ ! -f "$BACKUP_DIR/$BACKUP_NAME.tar.gz" ]; then
    echo -e "${RED}Error: El archivo de backup no se copió correctamente.${NC}"
    exit 1
fi

# Limpiar archivos temporales
echo -e "${BLUE}Limpiando archivos temporales...${NC}"
docker exec $MONGO_CONTAINER rm -rf /data/db/backup_temp /data/db/backup_temp.tar.gz

# Mantener solo los últimos 7 backups
echo -e "${BLUE}Manteniendo solo los últimos 7 backups de $ENVIRONMENT...${NC}"
cd $BACKUP_DIR
if [ -n "$(ls -A *.tar.gz 2>/dev/null)" ]; then
    ls -t *.tar.gz | tail -n +8 | xargs -r rm
else
    echo -e "${YELLOW}No hay backups antiguos para eliminar.${NC}"
fi

echo -e "${GREEN}Backup completado exitosamente: $BACKUP_DIR/$BACKUP_NAME.tar.gz${NC}"
echo -e "${BLUE}Tamaño del backup: $(du -h $BACKUP_DIR/$BACKUP_NAME.tar.gz | cut -f1)${NC}"
echo -e "${BLUE}Fecha y hora: $(date)${NC}"
exit 0 