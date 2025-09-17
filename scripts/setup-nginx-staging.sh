#!/bin/bash

# Colores para los mensajes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${BLUE}Configurando Nginx para staging...${NC}"

# Crear carpeta sites-available si no existe
if [ ! -d "/etc/nginx/sites-available" ]; then
    echo -e "${BLUE}Creando carpeta sites-available...${NC}"
    sudo mkdir -p /etc/nginx/sites-available
fi

# Crear carpeta sites-enabled si no existe
if [ ! -d "/etc/nginx/sites-enabled" ]; then
    echo -e "${BLUE}Creando carpeta sites-enabled...${NC}"
    sudo mkdir -p /etc/nginx/sites-enabled
fi

# Copiar archivo de configuración
echo -e "${BLUE}Copiando archivo de configuración...${NC}"
sudo cp config/nginx/sites-available/staging.present.attadia.com /etc/nginx/sites-available/

# Crear enlace simbólico
echo -e "${BLUE}Creando enlace simbólico...${NC}"
sudo ln -sf /etc/nginx/sites-available/staging.present.attadia.com /etc/nginx/sites-enabled/

# Verificar la configuración de Nginx
echo -e "${BLUE}Verificando configuración de Nginx...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}Configuración correcta.${NC}"
    
    # Reiniciar Nginx
    echo -e "${BLUE}Reiniciando Nginx...${NC}"
    sudo systemctl restart nginx
    
    # Verificar estado de Nginx
    if sudo systemctl is-active --quiet nginx; then
        echo -e "${GREEN}Nginx está activo y funcionando correctamente.${NC}"
    else
        echo -e "${RED}Error: Nginx no está activo. Verifica la configuración.${NC}"
        sudo systemctl status nginx
    fi
else
    echo -e "${RED}Error en la configuración de Nginx. Por favor revisa el archivo nginx.conf.${NC}"
fi

echo -e "${GREEN}Configuración de Nginx para staging completada.${NC}" 