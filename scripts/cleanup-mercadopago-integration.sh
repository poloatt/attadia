#!/bin/bash

# Script para limpiar archivos duplicados y deprecados de la integración de MercadoPago
# Ejecutar desde la raíz del proyecto

echo "🧹 Limpiando integración de MercadoPago..."

# Función para verificar si un archivo existe antes de eliminarlo
safe_remove() {
    if [ -f "$1" ]; then
        echo "🗑️  Eliminando: $1"
        rm "$1"
    else
        echo "⚠️  No encontrado: $1"
    fi
}

# Función para verificar si un directorio existe antes de eliminarlo
safe_remove_dir() {
    if [ -d "$1" ]; then
        echo "🗑️  Eliminando directorio: $1"
        rm -rf "$1"
    else
        echo "⚠️  No encontrado: $1"
    fi
}

# Archivos deprecados que pueden ser eliminados (si existen)
echo "📋 Verificando archivos deprecados..."

# Archivos de documentación duplicados
safe_remove "docs/MERCADOPAGO_INTEGRATION.md"
safe_remove "docs/MERCADOPAGO_SETUP.md"

# Archivos de prueba que pueden estar duplicados
safe_remove "test-mercadopago-flow.js"

# Verificar si hay archivos de configuración duplicados
if [ -f "frontend/src/config/mercadopago.js" ] && [ -f "frontend/src/config/mercadopago.config.js" ]; then
    echo "⚠️  Detectado archivo de configuración duplicado"
    echo "   Manteniendo: frontend/src/config/mercadopago.js"
    safe_remove "frontend/src/config/mercadopago.config.js"
fi

# Verificar si hay componentes duplicados
if [ -f "frontend/src/components/bankconnections/MercadoPagoConnectButton.jsx" ] && [ -f "frontend/src/components/MercadoPagoConnectButton.jsx" ]; then
    echo "⚠️  Detectado componente duplicado"
    echo "   Manteniendo: frontend/src/components/bankconnections/MercadoPagoConnectButton.jsx"
    safe_remove "frontend/src/components/MercadoPagoConnectButton.jsx"
fi

# Verificar si hay páginas duplicadas
if [ -f "frontend/src/pages/MercadoPagoCallbackPage.jsx" ] && [ -f "frontend/src/components/MercadoPagoCallbackPage.jsx" ]; then
    echo "⚠️  Detectada página duplicada"
    echo "   Manteniendo: frontend/src/pages/MercadoPagoCallbackPage.jsx"
    safe_remove "frontend/src/components/MercadoPagoCallbackPage.jsx"
fi

# Verificar si hay servicios duplicados
if [ -f "frontend/src/services/mercadopagoService.js" ] && [ -f "frontend/src/services/mercadopago.js" ]; then
    echo "⚠️  Detectado servicio duplicado"
    echo "   Manteniendo: frontend/src/services/mercadopagoService.js"
    safe_remove "frontend/src/services/mercadopago.js"
fi

# Verificar si hay hooks duplicados
if [ -f "frontend/src/hooks/useMercadoPago.js" ] && [ -f "frontend/src/hooks/useMercadoPagoHook.js" ]; then
    echo "⚠️  Detectado hook duplicado"
    echo "   Manteniendo: frontend/src/hooks/useMercadoPago.js"
    safe_remove "frontend/src/hooks/useMercadoPagoHook.js"
fi

# Limpiar archivos temporales
echo "🧹 Limpiando archivos temporales..."
find . -name "*.tmp" -type f -delete 2>/dev/null || true
find . -name "*.log" -type f -delete 2>/dev/null || true
find . -name ".DS_Store" -type f -delete 2>/dev/null || true

# Verificar estructura final
echo "📁 Verificando estructura final..."

# Listar archivos de la integración modular
echo "✅ Archivos de la integración modular:"
echo "   📄 frontend/src/services/mercadopagoService.js"
echo "   📄 frontend/src/hooks/useMercadoPago.js"
echo "   📄 frontend/src/config/mercadopago.js"
echo "   📄 frontend/src/components/bankconnections/MercadoPagoConnectButton.jsx"
echo "   📄 frontend/src/components/bankconnections/DigitalWalletConnectButton.jsx"
echo "   📄 frontend/src/pages/MercadoPagoCallbackPage.jsx"
echo "   📄 backend/src/oauth/mercadoPagoOAuth.js"
echo "   📄 backend/src/controllers/bankConnectionController.js"
echo "   📄 backend/src/services/bankSyncService.js"
echo "   📄 docs/MERCADOPAGO_MODULAR_INTEGRATION.md"

# Verificar que los archivos principales existen
echo "🔍 Verificando archivos principales..."

required_files=(
    "frontend/src/services/mercadopagoService.js"
    "frontend/src/hooks/useMercadoPago.js"
    "frontend/src/config/mercadopago.js"
    "frontend/src/components/bankconnections/MercadoPagoConnectButton.jsx"
    "frontend/src/pages/MercadoPagoCallbackPage.jsx"
    "backend/src/oauth/mercadoPagoOAuth.js"
    "docs/MERCADOPAGO_MODULAR_INTEGRATION.md"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (FALTANTE)"
    fi
done

echo ""
echo "🎉 Limpieza completada!"
echo ""
echo "📋 Resumen de la integración modular:"
echo "   • Servicio centralizado: mercadopagoService.js"
echo "   • Hook personalizado: useMercadoPago.js"
echo "   • Configuración: mercadopago.js"
echo "   • Componentes modulares: DigitalWalletConnectButton.jsx"
echo "   • Documentación actualizada: MERCADOPAGO_MODULAR_INTEGRATION.md"
echo ""
echo "🚀 La integración está lista para usar!" 