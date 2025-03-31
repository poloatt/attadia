#!/bin/bash

# Script para configurar Nginx en el servidor
# Uso: ./scripts/setup-nginx.sh [staging|production]

set -e

# Verificar argumentos
if [ "$#" -ne 1 ]; then
    echo "Uso: $0 [staging|production]"
    exit 1
fi

ENV=$1

if [ "$ENV" != "staging" ] && [ "$ENV" != "production" ]; then
    echo "Entorno no válido. Debe ser 'staging' o 'production'"
    exit 1
fi

echo "Configurando Nginx para el entorno: $ENV"

# Verificar si se está ejecutando como root
if [ "$(id -u)" -ne 0 ]; then
    echo "Este script debe ejecutarse como root o con sudo"
    exit 1
fi

# Directorio actual
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Crear directorio para certificados SSL
echo "Creando directorio para certificados SSL..."
mkdir -p /etc/nginx/ssl

# Copiar certificados SSL
echo "Copiando certificados SSL..."
cp -f "$DIR/ssl/nginx/ssl/fullchain.pem" /etc/nginx/ssl/
cp -f "$DIR/ssl/nginx/ssl/privkey.pem" /etc/nginx/ssl/
chmod 600 /etc/nginx/ssl/*.pem

# Directorio para Let's Encrypt
echo "Creando directorio para Let's Encrypt..."
mkdir -p /var/www/certbot

# Eliminar configuración anterior
echo "Eliminando configuración anterior..."
rm -f /etc/nginx/sites-enabled/${ENV}.conf

# Copiar nueva configuración
echo "Copiando nueva configuración de $ENV..."
cp -f "$DIR/nginx/${ENV}-nginx.conf" /etc/nginx/sites-available/${ENV}.conf

# Crear enlace simbólico
echo "Creando enlace simbólico..."
ln -sf /etc/nginx/sites-available/${ENV}.conf /etc/nginx/sites-enabled/

# Probar configuración
echo "Probando configuración de Nginx..."
nginx -t

# Reiniciar Nginx
echo "Reiniciando Nginx..."
systemctl restart nginx

echo "Configuración de Nginx para $ENV completada."
echo "Verificar estado: systemctl status nginx" 