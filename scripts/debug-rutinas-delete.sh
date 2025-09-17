#!/bin/bash

# Script de diagnóstico para el problema de eliminación de rutinas en producción
# Problema: DELETE https://api.admin.attadia.com/api/rutinas/ID 404 (Not Found)

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Diagnóstico del problema de eliminación de rutinas${NC}"
echo "=================================================="
echo "Problema reportado: DELETE 404 en api.admin.attadia.com"
echo

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

log_debug() {
    echo -e "${CYAN}[DEBUG]${NC} $1"
}

# 1. Verificar configuración de nginx
echo -e "${BLUE}1. VERIFICANDO CONFIGURACIÓN DE NGINX${NC}"
echo "=================================================="

log_info "Sitios habilitados en nginx:"
if [ -d "/etc/nginx/sites-enabled" ]; then
    ls -la /etc/nginx/sites-enabled/ | grep -E "(admin|api)"
    echo
else
    log_error "Directorio /etc/nginx/sites-enabled no encontrado"
fi

log_info "Verificando configuración específica para api.admin.attadia.com:"
if [ -f "/etc/nginx/sites-enabled/api.admin.attadia.com" ]; then
    log_info "✅ Configuración encontrada: /etc/nginx/sites-enabled/api.admin.attadia.com"
    
    # Mostrar configuración relevante
    log_debug "Configuración actual:"
    grep -E "server_name|proxy_pass|location" /etc/nginx/sites-enabled/api.admin.attadia.com
    echo
else
    log_error "❌ No se encontró configuración para api.admin.attadia.com"
    echo "    Esto es la causa probable del error 404"
fi

# 2. Verificar estado de nginx
echo -e "${BLUE}2. VERIFICANDO ESTADO DE NGINX${NC}"
echo "=================================================="

log_info "Estado del servicio nginx:"
systemctl status nginx --no-pager -l | head -10

log_info "Verificando configuración de nginx:"
if nginx -t; then
    log_info "✅ Configuración de nginx es válida"
else
    log_error "❌ Configuración de nginx tiene errores"
fi
echo

# 3. Verificar conectividad local
echo -e "${BLUE}3. VERIFICANDO CONECTIVIDAD LOCAL${NC}"
echo "=================================================="

# Test de dominios
for domain in "admin.attadia.com" "api.admin.attadia.com"; do
    log_info "Probando conectividad a $domain:"
    
    # HTTP
    log_debug "HTTP test:"
    if curl -I -s --connect-timeout 5 "http://$domain/health" 2>/dev/null | head -1; then
        log_info "HTTP responde"
    else
        log_warning "HTTP no responde"
    fi
    
    # HTTPS
    log_debug "HTTPS test:"
    if curl -I -s -k --connect-timeout 5 "https://$domain/health" 2>/dev/null | head -1; then
        log_info "HTTPS responde"
    else
        log_warning "HTTPS no responde"
    fi
    
    echo
done

# 4. Verificar backend
echo -e "${BLUE}4. VERIFICANDO BACKEND${NC}"
echo "=================================================="

log_info "Verificando que el backend esté corriendo en puerto 5000:"
if netstat -tulpn 2>/dev/null | grep :5000; then
    log_info "✅ Servicio corriendo en puerto 5000"
else
    log_warning "⚠️  No se detecta servicio en puerto 5000"
fi

log_info "Probando conexión directa al backend:"
if curl -I -s --connect-timeout 5 "http://localhost:5000/health" 2>/dev/null | head -1; then
    log_info "✅ Backend responde en localhost:5000"
else
    log_warning "⚠️  Backend no responde en localhost:5000"
fi

log_info "Probando endpoint específico de rutinas:"
if curl -I -s --connect-timeout 5 "http://localhost:5000/api/rutinas" 2>/dev/null | head -1; then
    log_info "✅ Endpoint /api/rutinas responde"
else
    log_warning "⚠️  Endpoint /api/rutinas no responde"
fi
echo

# 5. Verificar certificados SSL
echo -e "${BLUE}5. VERIFICANDO CERTIFICADOS SSL${NC}"
echo "=================================================="

log_info "Certificados disponibles:"
if command -v certbot &> /dev/null; then
    certbot certificates 2>/dev/null | grep -E "(admin\.attadia\.com|api\.admin\.attadia\.com)" || log_warning "No se encontraron certificados Let's Encrypt"
else
    log_warning "Certbot no está instalado"
fi

# Verificar certificados autofirmados
if [ -f "/etc/nginx/ssl/present-cert.pem" ]; then
    log_info "Certificado autofirmado encontrado:"
    openssl x509 -in /etc/nginx/ssl/present-cert.pem -text -noout | grep -A 1 "Subject Alternative Name" || log_warning "No hay SANs en el certificado"
fi
echo

# 6. Verificar logs de nginx
echo -e "${BLUE}6. VERIFICANDO LOGS DE NGINX${NC}"
echo "=================================================="

log_info "Logs de error recientes:"
if [ -f "/var/log/nginx/error.log" ]; then
    tail -5 /var/log/nginx/error.log | grep -E "(admin|api)" || log_info "No hay errores recientes relacionados"
else
    log_warning "Archivo de log de errores no encontrado"
fi

log_info "Logs específicos de api.admin.attadia.com:"
if [ -f "/var/log/nginx/api.admin.attadia.com.error.log" ]; then
    tail -5 /var/log/nginx/api.admin.attadia.com.error.log 2>/dev/null || log_info "No hay errores específicos"
else
    log_warning "Log específico de api.admin.attadia.com no encontrado"
fi
echo

# 7. Verificar DNS (si está disponible)
echo -e "${BLUE}7. VERIFICANDO DNS${NC}"
echo "=================================================="

for domain in "admin.attadia.com" "api.admin.attadia.com"; do
    log_info "Resolución DNS para $domain:"
    if nslookup "$domain" 2>/dev/null | grep -A 2 "Non-authoritative answer:" | grep "Address:" ; then
        log_info "✅ DNS resuelve correctamente"
    else
        log_warning "⚠️  Problema con resolución DNS"
    fi
done
echo

# 8. Diagnóstico final y recomendaciones
echo -e "${BLUE}8. DIAGNÓSTICO FINAL${NC}"
echo "=================================================="

# Determinar la causa más probable
if [ ! -f "/etc/nginx/sites-enabled/api.admin.attadia.com" ]; then
    echo -e "${RED}🔥 PROBLEMA IDENTIFICADO:${NC}"
    echo "   El subdominio api.admin.attadia.com NO está configurado en nginx"
    echo "   Esto explica el error 404 al intentar eliminar rutinas"
    echo
    echo -e "${GREEN}📋 SOLUCIÓN RECOMENDADA:${NC}"
    echo "   1. Ejecutar: sudo ./scripts/fix-api-subdomain.sh"
    echo "   2. Configurar certificados SSL: sudo ./scripts/generate-ssl-cert-letsencrypt.sh"
    echo "   3. Verificar que el DNS apunte api.admin.attadia.com al servidor"
    echo
elif ! systemctl is-active nginx --quiet; then
    echo -e "${RED}🔥 PROBLEMA IDENTIFICADO:${NC}"
    echo "   Nginx no está corriendo correctamente"
    echo
    echo -e "${GREEN}📋 SOLUCIÓN:${NC}"
    echo "   sudo systemctl restart nginx"
    echo
elif ! netstat -tulpn 2>/dev/null | grep -q :5000; then
    echo -e "${RED}🔥 PROBLEMA IDENTIFICADO:${NC}"
    echo "   El backend no está corriendo en puerto 5000"
    echo
    echo -e "${GREEN}📋 SOLUCIÓN:${NC}"
    echo "   Iniciar el backend: cd /root/present/backend && npm run dev"
    echo
else
    echo -e "${GREEN}✅ CONFIGURACIÓN APARENTA ESTAR CORRECTA${NC}"
    echo "   Posibles causas adicionales:"
    echo "   - Problema de DNS externo"
    echo "   - Certificados SSL no incluyen api.admin.attadia.com"
    echo "   - Problema de firewall"
    echo
    echo -e "${BLUE}📋 VERIFICACIONES ADICIONALES:${NC}"
    echo "   1. Probar desde el exterior: curl -I https://api.admin.attadia.com/health"
    echo "   2. Verificar logs en tiempo real: tail -f /var/log/nginx/access.log"
    echo "   3. Verificar configuración del frontend para confirmar la URL"
fi

echo
echo -e "${BLUE}🔧 SCRIPTS DE SOLUCIÓN DISPONIBLES:${NC}"
echo "   - ./scripts/fix-api-subdomain.sh           # Configurar nginx"
echo "   - ./scripts/generate-ssl-cert-letsencrypt.sh # Configurar SSL"
echo "   - ./scripts/debug-rutinas-delete.sh         # Este diagnóstico"
echo

# Test final de conectividad
echo -e "${BLUE}9. TEST FINAL DE CONECTIVIDAD${NC}"
echo "=================================================="

log_info "Probando el endpoint exacto que falla:"
SAMPLE_ID="6866fa2a1a61acc2d44cc61d"
log_debug "DELETE https://api.admin.attadia.com/api/rutinas/$SAMPLE_ID"

# Simular el request que falla
if curl -I -s -k -X DELETE "https://api.admin.attadia.com/api/rutinas/$SAMPLE_ID" 2>/dev/null | head -1; then
    log_info "✅ Endpoint DELETE responde (código de estado disponible arriba)"
else
    log_error "❌ Endpoint DELETE no responde - ESTE ES EL PROBLEMA"
fi

echo
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Diagnóstico completado. Revisa las recomendaciones arriba.${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}" 