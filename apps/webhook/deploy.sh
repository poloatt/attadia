#!/bin/bash

# Script de despliegue para el webhook server
# Uso: ./deploy.sh [environment]
# Donde environment puede ser "production" o "staging"

# Variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="/home/poloatt/present"
LOG_FILE="/var/log/webhook-server/deploy.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Asegurar que existe el directorio de logs
mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

# Función para loguear mensajes
log() {
    echo "[$DATE] $1" | tee -a "$LOG_FILE"
}

# Obtener el ambiente
ENVIRONMENT=${1:-"staging"}
if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" ]]; then
    log "ERROR: Ambiente no válido. Debe ser 'production' o 'staging'"
    exit 1
fi

# Determinar el archivo de compose y la rama basado en el ambiente
if [[ "$ENVIRONMENT" == "production" ]]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    GIT_BRANCH="main"
else
    COMPOSE_FILE="docker-compose.staging.yml"
    GIT_BRANCH="staging"
fi

log "Iniciando despliegue para ambiente: $ENVIRONMENT (composefile: $COMPOSE_FILE, rama: $GIT_BRANCH)"

# Ir al directorio del proyecto
cd "$PROJECT_DIR" || {
    log "ERROR: No se puede acceder al directorio del proyecto: $PROJECT_DIR"
    exit 1
}

# Verificar que existe el archivo de compose
if [[ ! -f "$COMPOSE_FILE" ]]; then
    log "ERROR: Archivo de compose no encontrado: $COMPOSE_FILE"
    exit 1
fi

# Actualizar código desde Git
log "Actualizando código desde Git (git pull origin $GIT_BRANCH)..."
git pull origin "$GIT_BRANCH" >> "$LOG_FILE" 2>&1
if [[ $? -ne 0 ]]; then
    log "ERROR: Fallo al actualizar el código desde Git"
    exit 1
fi
log "Código actualizado correctamente"

# Reconstruir contenedores
log "Reconstruyendo contenedores (docker-compose -f $COMPOSE_FILE up -d --build)..."
docker-compose -f "$COMPOSE_FILE" up -d --build >> "$LOG_FILE" 2>&1
if [[ $? -ne 0 ]]; then
    log "ERROR: Fallo al reconstruir los contenedores"
    exit 1
fi
log "Contenedores reconstruidos correctamente"

# Esperar unos segundos para que los contenedores se inicien
log "Esperando a que los contenedores se inicien (10 segundos)..."
sleep 10

# Verificación básica de contenedores
log "Verificando que los contenedores estén en ejecución..."
if [[ "$ENVIRONMENT" == "production" ]]; then
    CONTAINER_PREFIX="prod"
else
    CONTAINER_PREFIX="staging"
fi

# Contar contenedores ejecutándose
RUNNING_CONTAINERS=$(docker ps | grep -c "$CONTAINER_PREFIX")
log "Contenedores en ejecución con prefijo '$CONTAINER_PREFIX': $RUNNING_CONTAINERS"

if [[ "$RUNNING_CONTAINERS" -lt 3 ]]; then
    log "ERROR: No todos los contenedores están en ejecución"
    docker ps >> "$LOG_FILE"
    exit 1
fi

log "Despliegue completado exitosamente para $ENVIRONMENT"
exit 0 