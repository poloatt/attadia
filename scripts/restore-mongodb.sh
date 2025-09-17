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

# Determinar el entorno
if [ "$2" = "staging" ]; then
    ENVIRONMENT="staging"
    MONGO_CONTAINER="mongodb-staging"
    MONGO_USER=${MONGO_USER:-"admin"}
    MONGO_PASSWORD=${MONGO_PASSWORD:-"MiContraseñaSegura123"}
    MONGO_DB=${MONGO_DB:-"present"}
else
    ENVIRONMENT="production"
    MONGO_CONTAINER="mongodb"
    MONGO_USER=${MONGO_USER:-"admin"}
    MONGO_PASSWORD=${MONGO_PASSWORD:-"MiContraseñaSegura123"}
    MONGO_DB=${MONGO_DB:-"present"}
fi

# Configuración
BACKUP_DIR="/data/backups/$ENVIRONMENT"

# Verificar si se proporcionó un archivo de backup
if [ -z "$1" ]; then
    echo -e "${YELLOW}No se especificó un archivo de backup. Mostrando backups disponibles:${NC}"
    ls -la $BACKUP_DIR/*.tar.gz 2>/dev/null || echo -e "${RED}No hay backups disponibles en $BACKUP_DIR${NC}"
    exit 1
fi

BACKUP_FILE="$1"

# Si el archivo no existe pero se proporcionó solo el nombre, buscar en el directorio de backups
if [ ! -f "$BACKUP_FILE" ] && [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    # Intentar encontrar el archivo con extensión .tar.gz
    if [ -f "$BACKUP_DIR/$BACKUP_FILE.tar.gz" ]; then
        BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE.tar.gz"
    else
        echo -e "${RED}Error: No se encontró el archivo de backup: $BACKUP_FILE${NC}"
        echo -e "${YELLOW}Backups disponibles:${NC}"
        ls -la $BACKUP_DIR/*.tar.gz 2>/dev/null || echo -e "${RED}No hay backups disponibles en $BACKUP_DIR${NC}"
        exit 1
    fi
elif [ ! -f "$BACKUP_FILE" ] && [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
fi

# Verificar si el contenedor de MongoDB está en ejecución
if ! docker ps | grep -q $MONGO_CONTAINER; then
    echo -e "${RED}Error: El contenedor $MONGO_CONTAINER no está en ejecución.${NC}"
    echo -e "${BLUE}Contenedores en ejecución:${NC}"
    docker ps
    exit 1
fi

echo -e "${BLUE}Iniciando restauración de MongoDB para entorno $ENVIRONMENT...${NC}"
echo -e "${BLUE}Contenedor: $MONGO_CONTAINER${NC}"
echo -e "${BLUE}Base de datos: $MONGO_DB${NC}"
echo -e "${BLUE}Archivo de backup: $BACKUP_FILE${NC}"

# Copiar el archivo de backup al contenedor
echo -e "${BLUE}Copiando archivo de backup al contenedor...${NC}"
if ! docker cp "$BACKUP_FILE" $MONGO_CONTAINER:/data/db/backup_temp.tar.gz; then
    echo -e "${RED}Error al copiar el archivo de backup al contenedor.${NC}"
    exit 1
fi

# Extraer el archivo de backup
echo -e "${BLUE}Extrayendo archivo de backup...${NC}"
if ! docker exec $MONGO_CONTAINER bash -c "cd /data/db && tar -xzf backup_temp.tar.gz"; then
    echo -e "${RED}Error al extraer el archivo de backup.${NC}"
    exit 1
fi

# Restaurar la base de datos
echo -e "${BLUE}Restaurando la base de datos...${NC}"
if ! docker exec $MONGO_CONTAINER mongorestore \
  --username $MONGO_USER \
  --password $MONGO_PASSWORD \
  --authenticationDatabase admin \
  --db $MONGO_DB \
  --drop \
  /data/db/backup_temp/$MONGO_DB; then
    
    echo -e "${RED}Error al restaurar la base de datos.${NC}"
    exit 1
fi

# Limpiar archivos temporales
echo -e "${BLUE}Limpiando archivos temporales...${NC}"
docker exec $MONGO_CONTAINER rm -rf /data/db/backup_temp /data/db/backup_temp.tar.gz

echo -e "${GREEN}Restauración completada exitosamente.${NC}"
echo -e "${BLUE}Fecha y hora: $(date)${NC}"
exit 0 