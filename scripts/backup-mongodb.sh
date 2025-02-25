#!/bin/bash

# Configuración
BACKUP_DIR="/data/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="present_backup_$TIMESTAMP"

# Crear backup
echo "Iniciando backup de MongoDB..."
docker exec mongodb-prod mongodump \
  --username $MONGO_USER \
  --password $MONGO_PASSWORD \
  --authenticationDatabase admin \
  --db present \
  --out /data/db/$BACKUP_NAME

# Comprimir backup
echo "Comprimiendo backup..."
cd /data/mongodb/$BACKUP_NAME
tar -czf $BACKUP_DIR/$BACKUP_NAME.tar.gz ./*

# Limpiar archivos temporales
echo "Limpiando archivos temporales..."
rm -rf /data/mongodb/$BACKUP_NAME

# Mantener solo los últimos 7 backups
echo "Manteniendo solo los últimos 7 backups..."
cd $BACKUP_DIR
ls -t *.tar.gz | tail -n +8 | xargs -r rm

echo "Backup completado: $BACKUP_NAME.tar.gz" 