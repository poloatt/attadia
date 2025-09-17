#!/bin/bash

# Colores para los mensajes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${BLUE}Generando certificados SSL autofirmados para staging.present.attadia.com...${NC}"

# Crear directorio para los certificados
sudo mkdir -p /etc/nginx/ssl

# Generar certificados autofirmados
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/staging-key.pem \
    -out /etc/nginx/ssl/staging-cert.pem \
    -subj "/CN=staging.present.attadia.com" \
    -addext "subjectAltName = DNS:staging.present.attadia.com,DNS:api.staging.present.attadia.com"

# Establecer permisos correctos
sudo chmod 600 /etc/nginx/ssl/staging-key.pem
sudo chmod 644 /etc/nginx/ssl/staging-cert.pem

echo -e "${GREEN}Certificados SSL generados correctamente.${NC}"
echo -e "${BLUE}Ubicación de los certificados:${NC}"
echo -e "  - Certificado: /etc/nginx/ssl/staging-cert.pem"
echo -e "  - Clave privada: /etc/nginx/ssl/staging-key.pem"

echo -e "${YELLOW}Nota:${NC} Estos son certificados autofirmados, por lo que los navegadores mostrarán una advertencia de seguridad."
echo -e "${YELLOW}Para producción, se recomienda usar Let's Encrypt u otro proveedor de certificados confiable.${NC}" 