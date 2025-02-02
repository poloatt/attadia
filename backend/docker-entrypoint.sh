#!/bin/sh
set -e

# Esperar a que la base de datos esté lista
echo "Esperando a que la base de datos esté lista..."
node scripts/wait-for-db.js

# Ejecutar migraciones
echo "Ejecutando migraciones..."
node scripts/db-dev.js

# Iniciar la aplicación
echo "Iniciando la aplicación..."
exec "$@" 