#!/bin/bash

# Script para configurar api.admin.attadia.com
# Soluciona el problema de DELETE 404 en rutinas de producción

set -e  # Salir si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Configurando api.admin.attadia.com...${NC}"
echo "=================================================="

# Verificar que se ejecuta como root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ Este script debe ejecutarse como root${NC}" 
   exit 1
fi

# Función para logging
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función para backup de configuraciones
backup_configs() {
    log_info "Creando backup de configuraciones..."
    BACKUP_DIR="/etc/nginx/backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    if [ -f "/etc/nginx/sites-enabled/api.admin.attadia.com" ]; then
        cp "/etc/nginx/sites-enabled/api.admin.attadia.com" "$BACKUP_DIR/"
        log_info "Backup creado en: $BACKUP_DIR"
    fi
}

# Función para verificar nginx
check_nginx() {
    log_info "Verificando configuración de nginx..."
    if nginx -t; then
        log_info "✅ Configuración de nginx válida"
        return 0
    else
        log_error "❌ Error en configuración de nginx"
        return 1
    fi
}

# Función para habilitar sitio
enable_site() {
    log_info "Habilitando sitio api.admin.attadia.com..."
    
    # Verificar que el archivo de configuración existe
    if [ ! -f "/root/present/nginx/sites-available/api.admin.attadia.com" ]; then
        log_error "Archivo de configuración no encontrado en /root/present/nginx/sites-available/"
        exit 1
    fi
    
    # Copiar configuración a sites-available de nginx
    cp "/root/present/nginx/sites-available/api.admin.attadia.com" "/etc/nginx/sites-available/"
    
    # Crear enlace simbólico
    if [ -L "/etc/nginx/sites-enabled/api.admin.attadia.com" ]; then
        log_warning "Enlace simbólico ya existe, eliminando..."
        rm "/etc/nginx/sites-enabled/api.admin.attadia.com"
    fi
    
    ln -s "/etc/nginx/sites-available/api.admin.attadia.com" "/etc/nginx/sites-enabled/"
    log_info "✅ Sitio habilitado"
}

# Función para obtener certificado SSL
setup_ssl() {
    log_info "Configurando certificado SSL para api.admin.attadia.com..."
    
    # Verificar si certbot está instalado
    if ! command -v certbot &> /dev/null; then
        log_warning "Certbot no está instalado, instalando..."
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    fi
    
    # Obtener certificado
    log_info "Obteniendo certificado SSL..."
    certbot --nginx -d api.admin.attadia.com --non-interactive --agree-tos --email admin@attadia.com
    
    if [ $? -eq 0 ]; then
        log_info "✅ Certificado SSL configurado correctamente"
    else
        log_warning "⚠️  Certificado SSL no pudo configurarse automáticamente"
        log_info "Puedes configurarlo manualmente más tarde con:"
        log_info "certbot --nginx -d api.admin.attadia.com"
    fi
}

# Función para recargar nginx
reload_nginx() {
    log_info "Recargando nginx..."
    if systemctl reload nginx; then
        log_info "✅ Nginx recargado correctamente"
    else
        log_error "❌ Error al recargar nginx"
        exit 1
    fi
}

# Función para verificar conectividad
test_connectivity() {
    log_info "Verificando conectividad..."
    
    # Test local
    log_info "Probando conexión local..."
    if curl -k -s -o /dev/null -w "%{http_code}" https://api.admin.attadia.com/health | grep -q "200\|404"; then
        log_info "✅ Conexión local exitosa"
    else
        log_warning "⚠️  Conexión local falló, pero puede ser normal si el backend no está corriendo"
    fi
    
    # Verificar logs de nginx
    log_info "Últimas entradas en logs de nginx:"
    tail -n 5 /var/log/nginx/api.admin.attadia.com.error.log 2>/dev/null || log_info "No hay logs de error aún"
}

# Función principal
main() {
    log_info "Iniciando configuración de api.admin.attadia.com..."
    
    # 1. Backup
    backup_configs
    
    # 2. Habilitar sitio
    enable_site
    
    # 3. Verificar configuración
    if ! check_nginx; then
        log_error "Error en configuración, revirtiendo..."
        rm -f "/etc/nginx/sites-enabled/api.admin.attadia.com"
        exit 1
    fi
    
    # 4. Recargar nginx
    reload_nginx
    
    # 5. Configurar SSL (opcional)
    read -p "¿Deseas configurar SSL automáticamente? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_ssl
    else
        log_warning "SSL no configurado. Recuerda configurarlo manualmente."
    fi
    
    # 6. Verificar conectividad
    test_connectivity
    
    echo
    echo -e "${GREEN}🎉 Configuración completada!${NC}"
    echo "=================================================="
    echo -e "${BLUE}Próximos pasos:${NC}"
    echo "1. Verificar que el backend esté corriendo en puerto 5000"
    echo "2. Probar las APIs desde el frontend"
    echo "3. Verificar logs: tail -f /var/log/nginx/api.admin.attadia.com.access.log"
    echo
    echo -e "${BLUE}URLs de prueba:${NC}"
    echo "- https://api.admin.attadia.com/health"
    echo "- https://api.admin.attadia.com/api/health"
    echo
    echo -e "${BLUE}Para rollback en caso de problemas:${NC}"
    echo "sudo rm /etc/nginx/sites-enabled/api.admin.attadia.com"
    echo "sudo systemctl reload nginx"
}

# Función de rollback
rollback() {
    log_warning "Ejecutando rollback..."
    rm -f "/etc/nginx/sites-enabled/api.admin.attadia.com"
    systemctl reload nginx
    log_info "✅ Rollback completado"
}

# Trap para manejo de errores
trap 'echo -e "${RED}❌ Error detectado. Ejecutando rollback...${NC}"; rollback' ERR

# Ejecutar función principal
main "$@" 