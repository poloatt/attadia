#!/bin/bash

# Detectar ambiente basado en hostname
HOSTNAME=$(hostname)
if [[ "$HOSTNAME" == *"staging"* ]] || [[ "$HOSTNAME" == *"foco-staging"* ]]; then
  export ENVIRONMENT="staging"
  export NODE_ENV="staging"
else
  export ENVIRONMENT="production"
  export NODE_ENV="production"
fi

echo "Detectado ambiente: $ENVIRONMENT en host: $HOSTNAME"

echo "Verificando directorios de backup..."
mkdir -p /data/backups/production
mkdir -p /data/backups/staging
chmod -R 777 /data/backups

echo "Verificando directorio de logs..."
mkdir -p /var/log/webhook-server
chmod -R 777 /var/log/webhook-server

echo "Verificando directorio del repositorio..."
if [ ! -d "/home/poloatt/present" ]; then
  echo "Error: Directorio del repositorio no encontrado. Creando enlace simbólico..."
  ln -sf /app /home/poloatt/present
fi

echo "Iniciando servidor webhook en ambiente $ENVIRONMENT..."
exec node webhook-server.js 