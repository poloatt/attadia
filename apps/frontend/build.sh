#!/bin/bash

# Script de build para Vercel
echo "Instalando dependencias..."
npm install

echo "Verificando que vite esté disponible..."
if [ ! -f "./node_modules/.bin/vite" ]; then
    echo "Error: vite no encontrado en node_modules/.bin/"
    exit 1
fi

echo "Ejecutando build..."
./node_modules/.bin/vite build

echo "Build completado exitosamente" 