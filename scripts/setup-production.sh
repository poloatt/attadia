#!/bin/bash

# Colores para los mensajes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Configurando directorios para MongoDB...${NC}"
# Crear directorios necesarios
sudo mkdir -p /data/mongodb
sudo mkdir -p /data/backups

# Establecer permisos (1001 es el usuario de MongoDB en el contenedor)
sudo chown -R 1001:1001 /data/mongodb
sudo chown -R 1001:1001 /data/backups

echo -e "${BLUE}Configurando script de backup...${NC}"
# Hacer ejecutable el script de backup
chmod +x scripts/backup-mongodb.sh

# Configurar cron job para backups diarios
echo -e "${BLUE}Configurando backup automático...${NC}"
CRON_JOB="0 3 * * * cd $(pwd) && ./scripts/backup-mongodb.sh >> /data/backups/backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v "backup-mongodb.sh"; echo "$CRON_JOB") | crontab -

echo -e "${GREEN}¡Configuración completada!${NC}"
echo -e "${BLUE}Directorios creados:${NC}"
echo "  - /data/mongodb (para datos de MongoDB)"
echo "  - /data/backups (para backups automáticos)"
echo -e "${BLUE}Backup automático configurado para ejecutarse diariamente a las 3 AM${NC}"
echo -e "${BLUE}Para iniciar los contenedores, ejecuta:${NC}"
echo "  docker compose -f docker-compose.prod.yml up -d" 