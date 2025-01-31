#!/bin/bash

# Esperar a que la base de datos esté lista
echo "Esperando a que la base de datos esté lista..."
node scripts/wait-for-db.js

# Ejecutar migraciones
echo "Ejecutando migraciones..."
npx prisma migrate deploy

# Iniciar la aplicación
echo "Iniciando la aplicación..."
exec "$@" 