#!/bin/bash

# Script para configurar api.admin.attadia.com en producción
# Este script resuelve el problema del error 404 al eliminar rutinas

set -e

echo "🔧 Configurando subdominio api.admin.attadia.com para resolver errores 404..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Verificar que estamos en el servidor correcto
if [[ ! -f "/etc/nginx/nginx.conf" ]]; then
    error "Este script debe ejecutarse en el servidor de producción con nginx instalado"
    exit 1
fi

log "Verificando configuraciones actuales..."

# Backup de configuraciones actuales
BACKUP_DIR="/tmp/nginx-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r /etc/nginx/sites-available "$BACKUP_DIR/"
cp -r /etc/nginx/sites-enabled "$BACKUP_DIR/"
log "Backup creado en: $BACKUP_DIR"

# Copiar nueva configuración
log "Copiando nueva configuración para api.admin.attadia.com..."
cp nginx/sites-available/api.admin.attadia.com /etc/nginx/sites-available/

# Habilitar el sitio
log "Habilitando sitio api.admin.attadia.com..."
ln -sf /etc/nginx/sites-available/api.admin.attadia.com /etc/nginx/sites-enabled/

# Verificar configuración de nginx
log "Verificando configuración de nginx..."
if nginx -t; then
    log "✅ Configuración de nginx válida"
else
    error "❌ Error en la configuración de nginx"
    error "Restaurando backup..."
    rm -rf /etc/nginx/sites-available/api.admin.attadia.com
    rm -rf /etc/nginx/sites-enabled/api.admin.attadia.com
    exit 1
fi

# Verificar si el certificado SSL incluye el nuevo subdominio
log "Verificando certificado SSL..."
if openssl x509 -in /etc/nginx/ssl/present-cert.pem -text -noout | grep -q "api.admin.attadia.com"; then
    log "✅ Certificado SSL ya incluye api.admin.attadia.com"
else
    warn "⚠️  Certificado SSL no incluye api.admin.attadia.com"
    warn "Es necesario generar un nuevo certificado que incluya este subdominio"
    warn "Ejecuta: ./scripts/generate-ssl-cert.sh"
fi

# Verificar que el backend esté corriendo
log "Verificando que el backend esté corriendo en puerto 5000..."
if netstat -tulpn | grep :5000 > /dev/null; then
    log "✅ Backend está corriendo en puerto 5000"
else
    warn "⚠️  Backend no está corriendo en puerto 5000"
    warn "Asegúrate de que el backend esté iniciado antes de recargar nginx"
fi

# Recargar nginx
log "Recargando nginx..."
if systemctl reload nginx; then
    log "✅ Nginx recargado exitosamente"
else
    error "❌ Error al recargar nginx"
    error "Restaurando backup..."
    cp -r "$BACKUP_DIR/sites-available/"* /etc/nginx/sites-available/
    cp -r "$BACKUP_DIR/sites-enabled/"* /etc/nginx/sites-enabled/
    systemctl reload nginx
    exit 1
fi

# Verificar que el nuevo sitio esté funcionando
log "Verificando que el nuevo sitio esté funcionando..."
sleep 2

# Test HTTP (debería redirigir a HTTPS)
log "Probando HTTP (debe redirigir a HTTPS)..."
if curl -I -s http://api.admin.attadia.com | grep -q "301\|302"; then
    log "✅ Redirección HTTP -> HTTPS funcionando"
else
    warn "⚠️  La redirección HTTP -> HTTPS podría no estar funcionando correctamente"
fi

# Test HTTPS (solo si el certificado incluye el subdominio)
if openssl x509 -in /etc/nginx/ssl/present-cert.pem -text -noout | grep -q "api.admin.attadia.com"; then
    log "Probando HTTPS..."
    if curl -I -s -k https://api.admin.attadia.com/health | grep -q "200"; then
        log "✅ HTTPS funcionando correctamente"
    else
        warn "⚠️  HTTPS podría no estar funcionando correctamente"
    fi
else
    warn "⚠️  Saltando test HTTPS porque el certificado no incluye el subdominio"
fi

log "📋 Resumen de configuración:"
echo "  - Nuevo sitio: api.admin.attadia.com"
echo "  - Configuración: /etc/nginx/sites-available/api.admin.attadia.com"
echo "  - Backend: localhost:5000"
echo "  - Logs: /var/log/nginx/api.admin.attadia.com.*.log"
echo "  - Backup: $BACKUP_DIR"

log "🎉 Configuración completada exitosamente!"
log "Ahora el frontend puede hacer llamadas a api.admin.attadia.com"

# Verificar si necesitamos actualizar DNS
warn "📝 IMPORTANTE: Asegúrate de que el DNS apunte api.admin.attadia.com a este servidor"
warn "📝 Si el certificado SSL no incluye el subdominio, ejecuta: ./scripts/generate-ssl-cert.sh"

log "Para probar la configuración:"
echo "  curl -I http://api.admin.attadia.com/health"
echo "  curl -I https://api.admin.attadia.com/health" 