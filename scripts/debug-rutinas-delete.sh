#!/bin/bash

# Script de diagnóstico para el problema de eliminación de rutinas
# Verifica todas las configuraciones relacionadas con el endpoint DELETE

set -e

echo "🔍 Diagnóstico del problema de eliminación de rutinas..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# 1. Verificar configuración de nginx
log "1. Verificando configuración de nginx..."

# Verificar que los archivos de configuración existen
if [[ -f "/etc/nginx/sites-available/present.attadia.com.ssl" ]]; then
    info "✅ Configuración SSL para present.attadia.com existe"
else
    error "❌ Configuración SSL para present.attadia.com NO existe"
fi

if [[ -f "/etc/nginx/sites-available/api.admin.attadia.com" ]]; then
    info "✅ Configuración para api.admin.attadia.com existe"
else
    error "❌ Configuración para api.admin.attadia.com NO existe"
    warn "Ejecuta: ./scripts/fix-api-subdomain.sh"
fi

# Verificar que los sitios están habilitados
if [[ -L "/etc/nginx/sites-enabled/present.attadia.com.ssl" ]]; then
    info "✅ Sitio SSL habilitado"
else
    error "❌ Sitio SSL NO habilitado"
fi

if [[ -L "/etc/nginx/sites-enabled/api.admin.attadia.com" ]]; then
    info "✅ Sitio api.admin.attadia.com habilitado"
else
    error "❌ Sitio api.admin.attadia.com NO habilitado"
fi

# Verificar configuración de nginx
info "Verificando sintaxis de nginx..."
if nginx -t 2>/dev/null; then
    info "✅ Configuración de nginx válida"
else
    error "❌ Error en configuración de nginx"
    nginx -t
fi

# 2. Verificar estado del backend
log "2. Verificando estado del backend..."

# Verificar que el backend está corriendo
if netstat -tulpn | grep :5000 > /dev/null; then
    info "✅ Backend está corriendo en puerto 5000"
    info "Proceso: $(netstat -tulpn | grep :5000 | awk '{print $7}')"
else
    error "❌ Backend NO está corriendo en puerto 5000"
fi

# Verificar endpoint de health del backend
info "Probando endpoint de health del backend..."
if curl -s http://localhost:5000/api/health > /dev/null; then
    info "✅ Backend responde en localhost:5000/api/health"
else
    error "❌ Backend NO responde en localhost:5000/api/health"
fi

# 3. Verificar certificados SSL
log "3. Verificando certificados SSL..."

if [[ -f "/etc/nginx/ssl/present-cert.pem" ]]; then
    info "✅ Certificado SSL existe"
    
    # Verificar subdominios incluidos en el certificado
    info "Subdominios incluidos en el certificado:"
    openssl x509 -in /etc/nginx/ssl/present-cert.pem -text -noout | grep -A 1 "Subject Alternative Name" | tail -1 | sed 's/DNS://g' | tr ',' '\n' | while read domain; do
        if [[ -n "$domain" ]]; then
            echo "  - $domain"
        fi
    done
    
    # Verificar si incluye api.admin.attadia.com
    if openssl x509 -in /etc/nginx/ssl/present-cert.pem -text -noout | grep -q "api.admin.attadia.com"; then
        info "✅ Certificado incluye api.admin.attadia.com"
    else
        error "❌ Certificado NO incluye api.admin.attadia.com"
        warn "Ejecuta: ./scripts/generate-ssl-cert.sh"
    fi
    
    # Verificar fecha de expiración
    expiry_date=$(openssl x509 -in /etc/nginx/ssl/present-cert.pem -noout -enddate | cut -d= -f2)
    info "Certificado expira: $expiry_date"
else
    error "❌ Certificado SSL NO existe"
fi

# 4. Verificar DNS/conectividad
log "4. Verificando DNS y conectividad..."

# Verificar resolución DNS
info "Verificando resolución DNS..."
for domain in "present.attadia.com" "admin.attadia.com" "api.admin.attadia.com"; do
    if nslookup "$domain" > /dev/null 2>&1; then
        ip=$(nslookup "$domain" | grep "Address:" | tail -1 | awk '{print $2}')
        info "✅ $domain -> $ip"
    else
        error "❌ $domain no resuelve DNS"
    fi
done

# 5. Probar endpoints específicos
log "5. Probando endpoints específicos..."

# Función para probar endpoint
test_endpoint() {
    local url=$1
    local method=${2:-GET}
    local description=$3
    
    info "Probando $method $url ($description)..."
    
    if [[ "$method" == "GET" ]]; then
        response=$(curl -I -s -w "%{http_code}" -o /dev/null "$url" 2>/dev/null || echo "FAILED")
    else
        response=$(curl -X "$method" -I -s -w "%{http_code}" -o /dev/null "$url" 2>/dev/null || echo "FAILED")
    fi
    
    if [[ "$response" == "FAILED" ]]; then
        error "❌ $url - CONEXIÓN FALLIDA"
    elif [[ "$response" == "200" || "$response" == "301" || "$response" == "302" ]]; then
        info "✅ $url - HTTP $response"
    elif [[ "$response" == "404" ]]; then
        error "❌ $url - HTTP 404 (Not Found)"
    elif [[ "$response" == "403" ]]; then
        warn "⚠️  $url - HTTP 403 (Forbidden)"
    else
        warn "⚠️  $url - HTTP $response"
    fi
}

# Probar diferentes combinaciones
test_endpoint "http://localhost:5000/api/health" "GET" "Backend directo"
test_endpoint "http://admin.attadia.com/api/health" "GET" "A través de admin.attadia.com"
test_endpoint "https://admin.attadia.com/api/health" "GET" "HTTPS admin.attadia.com"
test_endpoint "http://api.admin.attadia.com/api/health" "GET" "A través de api.admin.attadia.com"
test_endpoint "https://api.admin.attadia.com/api/health" "GET" "HTTPS api.admin.attadia.com"

# Probar endpoints de rutinas específicamente
test_endpoint "http://localhost:5000/api/rutinas" "GET" "Rutinas backend directo"
test_endpoint "https://api.admin.attadia.com/api/rutinas" "GET" "Rutinas vía api.admin.attadia.com"

# 6. Verificar logs recientes
log "6. Verificando logs recientes..."

# Logs de nginx
if [[ -f "/var/log/nginx/error.log" ]]; then
    info "Últimos errores de nginx:"
    tail -n 5 /var/log/nginx/error.log | sed 's/^/  /'
fi

if [[ -f "/var/log/nginx/api.admin.attadia.com.error.log" ]]; then
    info "Últimos errores de api.admin.attadia.com:"
    tail -n 5 /var/log/nginx/api.admin.attadia.com.error.log | sed 's/^/  /'
fi

# 7. Sugerencias de solución
log "7. Resumen y sugerencias..."

echo ""
echo "📋 RESUMEN DEL DIAGNÓSTICO:"
echo "=========================="
echo ""

# Verificar si el problema principal está resuelto
if [[ -f "/etc/nginx/sites-available/api.admin.attadia.com" ]] && [[ -L "/etc/nginx/sites-enabled/api.admin.attadia.com" ]]; then
    if netstat -tulpn | grep :5000 > /dev/null; then
        info "✅ Configuración básica correcta"
        echo ""
        echo "🔧 Para completar la configuración:"
        echo "1. Asegúrate de que el DNS apunte api.admin.attadia.com a este servidor"
        echo "2. Si el certificado no incluye api.admin.attadia.com, ejecuta:"
        echo "   ./scripts/generate-ssl-cert.sh"
        echo "3. Reinicia nginx: sudo systemctl reload nginx"
        echo ""
        echo "🧪 Para probar la eliminación de rutinas:"
        echo "1. Ve a https://present.attadia.com"
        echo "2. Intenta eliminar una rutina"
        echo "3. Verifica que no aparezca error 404"
    else
        error "❌ Backend no está corriendo"
        echo ""
        echo "🔧 Para solucionar:"
        echo "1. Inicia el backend: cd present && npm start"
        echo "2. Verifica que esté corriendo en puerto 5000"
    fi
else
    error "❌ Configuración de api.admin.attadia.com faltante"
    echo ""
    echo "🔧 Para solucionar:"
    echo "1. Ejecuta: ./scripts/fix-api-subdomain.sh"
    echo "2. Configura DNS para api.admin.attadia.com"
    echo "3. Renueva certificado SSL si es necesario"
fi

echo ""
log "Diagnóstico completado." 