#!/bin/bash

# Colores para los mensajes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${BLUE}Arreglando problemas del webhook para GitHub...${NC}"

# Verificar que estamos ejecutando como usuario con permisos sudo
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${YELLOW}Se recomienda ejecutar este script como root o con sudo${NC}"
    read -p "¿Continuar de todos modos? (s/N): " CONTINUE
    if [ "$CONTINUE" != "s" ] && [ "$CONTINUE" != "S" ]; then
        echo -e "${RED}Abortando script${NC}"
        exit 1
    fi
fi

# Detener el servicio primero
echo -e "${BLUE}Deteniendo el servicio webhook...${NC}"
sudo systemctl stop present-webhook

# Reiniciar el contenedor de Docker
echo -e "${BLUE}Reiniciando el contenedor webhook-prod...${NC}"
docker restart webhook-prod

# Verificar los permisos de los directorios
echo -e "${BLUE}Verificando permisos de directorio...${NC}"
sudo chown -R $(whoami):$(whoami) /var/log/webhook-server
sudo chown -R $(whoami):$(whoami) /data/backups

# Reiniciar el servicio
echo -e "${BLUE}Reiniciando el servicio webhook...${NC}"
sudo systemctl start present-webhook
sudo systemctl status present-webhook

echo -e "${GREEN}Webhook reiniciado. Ahora prueba con:${NC}"
echo -e "${YELLOW}curl -X GET \"http://localhost:9000/test-deploy?token=secreto123\"${NC}"

# Mostrar las últimas líneas del log
echo -e "${BLUE}Últimas 20 líneas del log:${NC}"
tail -n 20 /var/log/webhook-server/webhook.log

echo -e "${BLUE}Para verificar el funcionamiento, haz un pequeño push a GitHub${NC}"
echo -e "${BLUE}o monitorea los logs con: tail -f /var/log/webhook-server/webhook.log${NC}" 