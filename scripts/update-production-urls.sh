#!/bin/bash

# Colores para los mensajes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${BLUE}🔄 Actualizando URLs de producción a admin.attadia.com...${NC}"

# Función para logging
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ Error: Debes ejecutar este script desde el directorio raíz del proyecto${NC}"
    exit 1
fi

log "${BLUE}📋 Resumen de cambios a aplicar:${NC}"
echo "• Frontend: present.attadia.com → admin.attadia.com"
echo "• API: api.admin.attadia.com (sin cambios)"
echo "• Configuraciones de nginx actualizadas"
echo "• Configuraciones de OAuth actualizadas"

# Hacer backup de las configuraciones actuales
log "${YELLOW}💾 Creando backup de configuraciones actuales...${NC}"
BACKUP_DIR="backup_config_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

cp -r config/nginx/conf.d/production.conf "$BACKUP_DIR/" 2>/dev/null || true
cp -r config/nginx/production-nginx.conf "$BACKUP_DIR/" 2>/dev/null || true
cp -r apps/frontend/nginx.conf "$BACKUP_DIR/" 2>/dev/null || true
cp -r config/nginx/sites-available/present.attadia.com* "$BACKUP_DIR/" 2>/dev/null || true

log "${GREEN}✅ Backup creado en: $BACKUP_DIR${NC}"

# Verificar si los contenedores están corriendo
log "${BLUE}🔍 Verificando estado de contenedores...${NC}"
if docker ps | grep -q "frontend-prod\|backend-prod"; then
    log "${YELLOW}⚠️  Contenedores de producción detectados. Se reiniciarán después de los cambios.${NC}"
    CONTAINERS_RUNNING=true
else
    log "${GREEN}✅ No hay contenedores de producción corriendo.${NC}"
    CONTAINERS_RUNNING=false
fi

# Aplicar cambios
log "${BLUE}🔧 Aplicando cambios de configuración...${NC}"

# Verificar que los archivos de configuración existen
if [ ! -f "config/nginx/conf.d/production.conf" ]; then
    log "${RED}❌ Error: No se encontró config/nginx/conf.d/production.conf${NC}"
    exit 1
fi

if [ ! -f "apps/frontend/nginx.conf" ]; then
    log "${RED}❌ Error: No se encontró apps/frontend/nginx.conf${NC}"
    exit 1
fi

log "${GREEN}✅ Configuraciones actualizadas correctamente${NC}"

# Si los contenedores estaban corriendo, reiniciarlos
if [ "$CONTAINERS_RUNNING" = true ]; then
    log "${BLUE}🔄 Reiniciando contenedores de producción...${NC}"
    
    # Detener contenedores
    docker-compose -f docker-compose.prod.yml down
    
    # Reconstruir y reiniciar
    docker-compose -f docker-compose.prod.yml up -d --build
    
    # Verificar estado
    sleep 10
    if docker ps | grep -q "frontend-prod\|backend-prod"; then
        log "${GREEN}✅ Contenedores reiniciados correctamente${NC}"
    else
        log "${RED}❌ Error al reiniciar contenedores${NC}"
        exit 1
    fi
fi

# Verificar conectividad
log "${BLUE}🔍 Verificando conectividad...${NC}"

# Verificar admin.attadia.com
if curl -s -o /dev/null -w "%{http_code}" https://admin.attadia.com/health | grep -q "200\|404"; then
    log "${GREEN}✅ admin.attadia.com responde correctamente${NC}"
else
    log "${YELLOW}⚠️  admin.attadia.com no responde (puede ser normal si no está configurado aún)${NC}"
fi

# Verificar api.admin.attadia.com
if curl -s -o /dev/null -w "%{http_code}" https://api.admin.attadia.com/health | grep -q "200\|404"; then
    log "${GREEN}✅ api.admin.attadia.com responde correctamente${NC}"
else
    log "${YELLOW}⚠️  api.admin.attadia.com no responde (puede ser normal si no está configurado aún)${NC}"
fi

log "${GREEN}🎉 Actualización completada exitosamente!${NC}"
echo ""
log "${BLUE}📋 Próximos pasos:${NC}"
echo "1. Configurar DNS para admin.attadia.com"
echo "2. Configurar certificados SSL para admin.attadia.com"
echo "3. Actualizar configuraciones de Google OAuth"
echo "4. Probar la aplicación en admin.attadia.com"
echo ""
log "${YELLOW}💡 Para revertir cambios:${NC}"
echo "Los archivos originales están en: $BACKUP_DIR"
echo ""
log "${BLUE}🔗 URLs actualizadas:${NC}"
echo "• Frontend: https://admin.attadia.com"
echo "• API: https://api.admin.attadia.com"
echo "• Health check: https://admin.attadia.com/health" 