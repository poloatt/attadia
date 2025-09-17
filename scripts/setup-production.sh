#!/bin/bash

# Colores para los mensajes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Determinar el entorno
if [ "$1" = "staging" ]; then
    ENVIRONMENT="staging"
else
    ENVIRONMENT="production"
fi

echo -e "${BLUE}Configurando directorios para MongoDB ($ENVIRONMENT)...${NC}"
# Crear directorios necesarios
sudo mkdir -p /data/mongodb/$ENVIRONMENT
sudo mkdir -p /data/backups/$ENVIRONMENT

# Establecer permisos
sudo chown -R $(whoami):$(whoami) /data/mongodb
sudo chown -R $(whoami):$(whoami) /data/backups

echo -e "${BLUE}Configurando script de backup...${NC}"
# Hacer ejecutable el script de backup
chmod +x scripts/backup-mongodb.sh
chmod +x scripts/restore-mongodb.sh

# Configurar cron job para backups diarios
echo -e "${BLUE}Configurando backup automático para $ENVIRONMENT...${NC}"
CRON_JOB="0 3 * * * cd $(pwd) && ./scripts/backup-mongodb.sh diario $ENVIRONMENT >> /data/backups/$ENVIRONMENT/backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v "backup-mongodb.sh.*$ENVIRONMENT"; echo "$CRON_JOB") | crontab -

echo -e "${GREEN}¡Configuración completada!${NC}"
echo -e "${BLUE}Directorios creados:${NC}"
echo "  - /data/mongodb/$ENVIRONMENT (para datos de MongoDB)"
echo "  - /data/backups/$ENVIRONMENT (para backups automáticos)"
echo -e "${BLUE}Backup automático configurado para ejecutarse diariamente a las 3 AM${NC}"
echo -e "${BLUE}Para iniciar los contenedores, ejecuta:${NC}"
if [ "$ENVIRONMENT" = "staging" ]; then
    echo "  docker compose -f docker-compose.staging.yml up -d"
else
    echo "  docker compose -f docker-compose.prod.yml up -d"
fi 