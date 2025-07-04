#!/bin/bash

# Script para generar certificado SSL con Let's Encrypt
# Incluye admin.attadia.com y api.admin.attadia.com

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
EMAIL="admin@attadia.com"

echo -e "${BLUE}🔐 Configurando certificados SSL con Let's Encrypt...${NC}"
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

# Verificar que certbot está instalado
check_certbot() {
    log_info "Verificando instalación de certbot..."
    if ! command -v certbot &> /dev/null; then
        log_warning "Certbot no está instalado. Instalando..."
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
        log_info "✅ Certbot instalado correctamente"
    else
        log_info "✅ Certbot ya está instalado"
    fi
}

# Verificar configuraciones de nginx
check_nginx_config() {
    log_info "Verificando configuraciones de nginx..."
    if nginx -t; then
        log_info "✅ Configuración de nginx válida"
    else
        log_error "❌ Error en configuración de nginx. Corrige antes de continuar."
        exit 1
    fi
}

# Función para obtener certificado para un dominio específico
get_certificate_for_domain() {
    local domain=$1
    log_info "Obteniendo certificado para: $domain"
    
    if certbot --nginx -d "$domain" --non-interactive --agree-tos --email "$EMAIL"; then
        log_info "✅ Certificado obtenido para $domain"
        return 0
    else
        log_error "❌ Error al obtener certificado para $domain"
        return 1
    fi
}

# Función para obtener certificado conjunto
get_multi_domain_certificate() {
    log_info "Intentando obtener certificado conjunto para admin.attadia.com y api.admin.attadia.com..."
    
    if certbot --nginx -d admin.attadia.com -d api.admin.attadia.com --non-interactive --agree-tos --email "$EMAIL"; then
        log_info "✅ Certificado conjunto obtenido exitosamente"
        return 0
    else
        log_warning "⚠️  No se pudo obtener certificado conjunto. Intentando dominios por separado..."
        return 1
    fi
}

# Función para configurar renovación automática
setup_auto_renewal() {
    log_info "Configurando renovación automática..."
    
    # Verificar si ya existe una entrada de renovación
    if crontab -l 2>/dev/null | grep -q "certbot renew"; then
        log_info "✅ Renovación automática ya está configurada"
    else
        # Agregar entrada al crontab
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx") | crontab -
        log_info "✅ Renovación automática configurada (diaria a las 12:00)"
    fi
}

# Función para verificar certificados
verify_certificates() {
    log_info "Verificando certificados instalados..."
    
    echo -e "${BLUE}Certificados activos:${NC}"
    certbot certificates
    
    # Verificar que los dominios responden con SSL
    for domain in "admin.attadia.com" "api.admin.attadia.com"; do
        log_info "Verificando conectividad SSL para $domain..."
        if curl -I -s -k "https://$domain" | head -n 1 | grep -q "HTTP"; then
            log_info "✅ $domain responde correctamente"
        else
            log_warning "⚠️  $domain podría no estar respondiendo correctamente"
        fi
    done
}

# Función principal
main() {
    log_info "Iniciando configuración de certificados SSL..."
    
    # 1. Verificar certbot
    check_certbot
    
    # 2. Verificar nginx
    check_nginx_config
    
    # 3. Intentar certificado conjunto primero
    if ! get_multi_domain_certificate; then
        # Si falla, intentar dominio por dominio
        log_info "Obteniendo certificados por separado..."
        
        # Obtener para admin.attadia.com
        if ! get_certificate_for_domain "admin.attadia.com"; then
            log_error "No se pudo obtener certificado para admin.attadia.com"
        fi
        
        # Obtener para api.admin.attadia.com
        if ! get_certificate_for_domain "api.admin.attadia.com"; then
            log_error "No se pudo obtener certificado para api.admin.attadia.com"
        fi
    fi
    
    # 4. Configurar renovación automática
    setup_auto_renewal
    
    # 5. Verificar certificados
    verify_certificates
    
    echo
    echo -e "${GREEN}🎉 Configuración de SSL completada!${NC}"
    echo "=================================================="
    echo -e "${BLUE}Dominios configurados:${NC}"
    echo "- admin.attadia.com"
    echo "- api.admin.attadia.com"
    echo
    echo -e "${BLUE}Certificados ubicados en:${NC}"
    echo "/etc/letsencrypt/live/"
    echo
    echo -e "${BLUE}Para verificar renovación:${NC}"
    echo "certbot renew --dry-run"
    echo
    echo -e "${BLUE}Para ver certificados:${NC}"
    echo "certbot certificates"
}

# Verificar conectividad a internet
check_internet() {
    log_info "Verificando conectividad a internet..."
    if ping -c 1 google.com &> /dev/null; then
        log_info "✅ Conectividad a internet disponible"
    else
        log_error "❌ No hay conectividad a internet. Los certificados de Let's Encrypt requieren acceso a internet."
        exit 1
    fi
}

# Verificar DNS
check_dns() {
    log_info "Verificando resolución DNS..."
    
    for domain in "admin.attadia.com" "api.admin.attadia.com"; do
        if nslookup "$domain" &> /dev/null; then
            log_info "✅ DNS resuelve correctamente para $domain"
        else
            log_warning "⚠️  DNS podría no estar configurado correctamente para $domain"
        fi
    done
}

# Verificaciones previas
log_info "Ejecutando verificaciones previas..."
check_internet
check_dns

# Ejecutar función principal
main "$@" 