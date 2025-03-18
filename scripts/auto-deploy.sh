#!/bin/bash

# Colores para los mensajes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

# Determinar el entorno basado en el parámetro o la rama actual
if [ -n "$1" ]; then
    ENVIRONMENT="$1"
else
    # Obtener la rama actual
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    
    if [ "$CURRENT_BRANCH" = "staging" ]; then
        ENVIRONMENT="staging"
    elif [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ] || [ "$CURRENT_BRANCH" = "production" ]; then
        ENVIRONMENT="production"
    else
        echo -e "${RED}Error: Rama no reconocida para despliegue automático: $CURRENT_BRANCH${NC}"
        echo -e "Ramas válidas: staging, main, master, production"
        echo -e "O especifica el entorno como parámetro: $0 [staging|production]"
        exit 1
    fi
fi

# Configuración según el entorno
if [ "$ENVIRONMENT" = "staging" ]; then
    PROJECT_DIR="/home/poloatt/present"
    BACKUP_DIR="/data/backups/staging"
    LOG_FILE="$BACKUP_DIR/deploy-staging.log"
    BRANCH="staging"
    COMPOSE_FILE="docker-compose.staging.yml"
    MONGODB_CONTAINER="mongodb-staging"
    BACKEND_CONTAINER="backend-staging"
    FRONTEND_CONTAINER="frontend-staging"
    API_URL="https://api.staging.present.attadia.com"
    FRONTEND_URL="https://staging.present.attadia.com"
    # Definir variables MongoDB según .env.staging
    MONGO_USER="admin"
    MONGO_PASSWORD="MiContraseñaSegura123"
    MONGO_DB="present"
else
    PROJECT_DIR="/home/poloatt/present"
    BACKUP_DIR="/data/backups/production"
    LOG_FILE="$BACKUP_DIR/deploy-production.log"
    BRANCH="production"
    COMPOSE_FILE="docker-compose.prod.yml"
    MONGODB_CONTAINER="mongodb"
    BACKEND_CONTAINER="backend"
    FRONTEND_CONTAINER="frontend"
    API_URL="https://api.present.attadia.com"
    FRONTEND_URL="https://present.attadia.com"
    # Definir variables MongoDB según lo que se usará en producción
    MONGO_USER="admin"
    MONGO_PASSWORD="MiContraseñaSegura123" 
    MONGO_DB="present"
fi

# Variables globales para el rollback
LAST_BACKUP_NAME=""
OLD_GIT_HASH=""

# Crear directorio de backup si no existe
mkdir -p "$BACKUP_DIR"

# Función para logging
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=== Iniciando proceso de actualización para entorno: $ENVIRONMENT ==="

# Función para hacer backup antes de actualizar
backup_before_update() {
    log "${BLUE}Realizando backup de seguridad antes de actualizar...${NC}"
    BACKUP_NAME="${ENVIRONMENT}_pre_update_$(date +%Y%m%d_%H%M%S)"
    
    # Ejecutar backup
    if ! $PROJECT_DIR/scripts/backup-mongodb.sh "$BACKUP_NAME" "$ENVIRONMENT"; then
        log "${RED}Error al realizar el backup. Abortando actualización.${NC}"
        return 1
    fi
    
    # Guardar el nombre del backup para posible rollback
    LAST_BACKUP_NAME="$BACKUP_NAME.tar.gz"
    log "${GREEN}Backup completado: $BACKUP_NAME${NC}"
    return 0
}

# Función para actualizar el código
update_code() {
    log "${BLUE}Actualizando código desde el repositorio para rama $BRANCH...${NC}"
    cd $PROJECT_DIR
    
    # Guardar el hash actual para comparar después y para posible rollback
    OLD_GIT_HASH=$(git rev-parse HEAD)
    
    # Pull de los cambios
    if ! git pull origin $BRANCH; then
        log "${RED}Error al hacer pull del repositorio desde rama $BRANCH${NC}"
        return 1
    fi
    
    NEW_GIT_HASH=$(git rev-parse HEAD)
    
    # Si no hay cambios, no necesitamos reconstruir
    if [ "$OLD_GIT_HASH" = "$NEW_GIT_HASH" ]; then
        log "${BLUE}No hay cambios nuevos que aplicar en rama $BRANCH${NC}"
        return 2
    fi
    
    log "${GREEN}Código actualizado correctamente desde rama $BRANCH${NC}"
    return 0
}

# Función para reconstruir y reiniciar contenedores
rebuild_containers() {
    log "${BLUE}Reconstruyendo y reiniciando contenedores para $ENVIRONMENT...${NC}"
    
    # Reconstruir contenedores
    if ! docker compose -f $PROJECT_DIR/$COMPOSE_FILE up -d --build; then
        log "${RED}Error al reconstruir los contenedores para $ENVIRONMENT${NC}"
        return 1
    fi
    
    log "${GREEN}Contenedores de $ENVIRONMENT actualizados correctamente${NC}"
    return 0
}

# Función para verificar el estado de los servicios
check_services() {
    log "${BLUE}Verificando estado de los servicios de $ENVIRONMENT...${NC}"
    sleep 20 # Dar más tiempo a que los servicios se inicien
    
    # Verificar MongoDB
    if ! docker exec $MONGODB_CONTAINER mongosh --eval "db.runCommand({ ping: 1 })" > /dev/null; then
        log "${RED}Error: MongoDB ($MONGODB_CONTAINER) no responde${NC}"
        return 1
    fi
    
    # Verificar contenedores simplemente comprobando que estén en ejecución
    if ! docker ps | grep -q $BACKEND_CONTAINER; then
        log "${RED}Error: El contenedor del Backend ($BACKEND_CONTAINER) no está en ejecución${NC}"
        return 1
    fi
    
    if ! docker ps | grep -q $FRONTEND_CONTAINER; then
        log "${RED}Error: El contenedor del Frontend ($FRONTEND_CONTAINER) no está en ejecución${NC}"
        return 1
    fi
    
    # Verificación simplificada
    log "${BLUE}Verificando datos de usuarios...${NC}"
    USER_COUNT=$(docker exec $MONGODB_CONTAINER mongosh --quiet --eval "db.getSiblingDB('$MONGO_DB').usuarios.countDocuments({})" | tr -d '\r')
    
    if [ -z "$USER_COUNT" ] || [ "$USER_COUNT" -eq 0 ]; then
        log "${YELLOW}Advertencia: No se encontraron usuarios en la base de datos${NC}"
        # No fallamos aquí porque podría ser una instalación nueva
    else
        log "${GREEN}Verificación de usuarios completada: $USER_COUNT usuarios encontrados${NC}"
    fi
    
    log "${GREEN}Todos los servicios de $ENVIRONMENT funcionando correctamente${NC}"
    return 0
}

# Función para realizar rollback en caso de fallo
perform_rollback() {
    log "${YELLOW}Iniciando proceso de rollback para $ENVIRONMENT...${NC}"
    
    # 1. Restaurar el código anterior
    if [ -n "$OLD_GIT_HASH" ]; then
        log "${BLUE}Restaurando código a versión anterior: $OLD_GIT_HASH${NC}"
        cd $PROJECT_DIR
        git reset --hard $OLD_GIT_HASH
    fi
    
    # 2. Restaurar la base de datos desde el backup
    if [ -n "$LAST_BACKUP_NAME" ]; then
        log "${BLUE}Restaurando base de datos desde backup: $LAST_BACKUP_NAME${NC}"
        if ! $PROJECT_DIR/scripts/restore-mongodb.sh "$LAST_BACKUP_NAME" "$ENVIRONMENT"; then
            log "${RED}Error al restaurar la base de datos. Situación crítica.${NC}"
            log "${RED}Se requiere intervención manual.${NC}"
            return 1
        fi
    fi
    
    # 3. Reconstruir los contenedores con la versión anterior
    log "${BLUE}Reconstruyendo contenedores con la versión anterior...${NC}"
    if ! docker compose -f $PROJECT_DIR/$COMPOSE_FILE up -d --build; then
        log "${RED}Error al reconstruir los contenedores durante el rollback.${NC}"
        log "${RED}Se requiere intervención manual.${NC}"
        return 1
    fi
    
    # 4. Verificar que todo funcione después del rollback
    sleep 20
    if ! check_services; then
        log "${RED}Los servicios no están funcionando correctamente después del rollback.${NC}"
        log "${RED}Se requiere intervención manual.${NC}"
        return 1
    fi
    
    log "${GREEN}Rollback completado exitosamente. Sistema restaurado a la versión anterior.${NC}"
    return 0
}

# Función principal
main() {
    log "=== Iniciando proceso de actualización para $ENVIRONMENT ==="
    
    # Realizar backup de seguridad
    if ! backup_before_update; then
        log "${RED}Proceso abortado debido a error en el backup${NC}"
        exit 1
    fi
    
    # Actualizar código
    update_code
    UPDATE_RESULT=$?
    
    if [ $UPDATE_RESULT -eq 1 ]; then
        log "${RED}Proceso abortado debido a error en la actualización${NC}"
        exit 1
    elif [ $UPDATE_RESULT -eq 2 ]; then
        log "${BLUE}No hay cambios que aplicar en $ENVIRONMENT. Finalizando.${NC}"
        exit 0
    fi
    
    # Reconstruir contenedores
    if ! rebuild_containers; then
        log "${RED}Error en la reconstrucción de contenedores de $ENVIRONMENT${NC}"
        log "${YELLOW}Iniciando rollback automático...${NC}"
        if ! perform_rollback; then
            log "${RED}Rollback fallido. Se requiere intervención manual.${NC}"
        fi
        exit 1
    fi
    
    # Verificar servicios
    if ! check_services; then
        log "${RED}Error: Los servicios de $ENVIRONMENT no están funcionando correctamente${NC}"
        log "${YELLOW}Iniciando rollback automático...${NC}"
        if ! perform_rollback; then
            log "${RED}Rollback fallido. Se requiere intervención manual.${NC}"
        fi
        exit 1
    fi
    
    log "${GREEN}=== Actualización de $ENVIRONMENT completada exitosamente ===${NC}"
}

# Ejecutar script principal
main 