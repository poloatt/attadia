#!/bin/sh
set -e

# Esperar a que la base de datos esté lista
echo "Esperando a la base de datos..."
node scripts/wait-for-db.js

# Ejecutar migraciones y seed en desarrollo
if [ "$NODE_ENV" = "development" ]; then
  echo "Inicializando base de datos..."
  node scripts/db-dev.js
fi

# Ejecutar el comando principal
exec "$@" 