#!/bin/bash

# Colores para los mensajes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Directorio del proyecto
PROJECT_DIR="/home/polo/presentprod"
BACKUP_DIR="/data/backups"
LOG_FILE="$BACKUP_DIR/deploy.log"

# Función para logging
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Función para hacer backup antes de actualizar
backup_before_update() {
    log "${BLUE}Realizando backup de seguridad antes de actualizar...${NC}"
    BACKUP_NAME="pre_update_$(date +%Y%m%d_%H%M%S)"
    
    # Ejecutar backup
    if ! $PROJECT_DIR/scripts/backup-mongodb.sh "$BACKUP_NAME"; then
        log "${RED}Error al realizar el backup. Abortando actualización.${NC}"
        return 1
    fi
    
    log "${GREEN}Backup completado: $BACKUP_NAME${NC}"
    return 0
}

# Función para actualizar el código
update_code() {
    log "${BLUE}Actualizando código desde el repositorio...${NC}"
    cd $PROJECT_DIR
    
    # Guardar el hash actual para comparar después
    OLD_HASH=$(git rev-parse HEAD)
    
    # Pull de los cambios
    if ! git pull origin production; then
        log "${RED}Error al hacer pull del repositorio${NC}"
        return 1
    fi
    
    NEW_HASH=$(git rev-parse HEAD)
    
    # Si no hay cambios, no necesitamos reconstruir
    if [ "$OLD_HASH" = "$NEW_HASH" ]; then
        log "${BLUE}No hay cambios nuevos que aplicar${NC}"
        return 2
    }
    
    log "${GREEN}Código actualizado correctamente${NC}"
    return 0
}

# Función para reconstruir y reiniciar contenedores
rebuild_containers() {
    log "${BLUE}Reconstruyendo y reiniciando contenedores...${NC}"
    
    # Reconstruir contenedores
    if ! docker compose -f $PROJECT_DIR/docker-compose.prod.yml up -d --build; then
        log "${RED}Error al reconstruir los contenedores${NC}"
        return 1
    }
    
    log "${GREEN}Contenedores actualizados correctamente${NC}"
    return 0
}

# Función para verificar el estado de los servicios
check_services() {
    log "${BLUE}Verificando estado de los servicios...${NC}"
    sleep 10 # Esperar a que los servicios se inicien
    
    # Verificar MongoDB
    if ! docker exec mongodb-prod mongosh --eval "db.runCommand({ ping: 1 })" > /dev/null; then
        log "${RED}Error: MongoDB no responde${NC}"
        return 1
    fi
    
    # Verificar Backend (health check)
    if ! curl -s https://api.present.attadia.com/api/health > /dev/null; then
        log "${RED}Error: Backend no responde${NC}"
        return 1
    fi
    
    # Verificar Frontend
    if ! curl -s https://present.attadia.com > /dev/null; then
        log "${RED}Error: Frontend no responde${NC}"
        return 1
    fi
    
    log "${GREEN}Todos los servicios funcionando correctamente${NC}"
    return 0
}

# Función principal
main() {
    log "=== Iniciando proceso de actualización ==="
    
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
        log "${BLUE}No hay cambios que aplicar. Finalizando.${NC}"
        exit 0
    fi
    
    # Reconstruir contenedores
    if ! rebuild_containers; then
        log "${RED}Error en la reconstrucción de contenedores${NC}"
        exit 1
    fi
    
    # Verificar servicios
    if ! check_services; then
        log "${RED}Error: Los servicios no están funcionando correctamente${NC}"
        log "${RED}Iniciando rollback...${NC}"
        # Aquí podrías implementar lógica de rollback si es necesario
        exit 1
    fi
    
    log "${GREEN}=== Actualización completada exitosamente ===${NC}"
}

# Ejecutar script principal
main 