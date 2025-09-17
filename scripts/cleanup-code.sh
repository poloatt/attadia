#!/bin/bash

# 🧹 Script de Limpieza de Código
# Este script elimina archivos temporales, deprecados y código no utilizado

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${GREEN}[CLEANUP]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Función para eliminar archivo de forma segura
safe_remove() {
    if [ -f "$1" ]; then
        log "Eliminando: $1"
        rm "$1"
    else
        warn "Archivo no encontrado: $1"
    fi
}

# Función para eliminar directorio de forma segura
safe_remove_dir() {
    if [ -d "$1" ]; then
        log "Eliminando directorio: $1"
        rm -rf "$1"
    else
        warn "Directorio no encontrado: $1"
    fi
}

# Función para limpiar archivos temporales
cleanup_temp_files() {
    log "🧹 Limpiando archivos temporales..."
    
    # Archivos de prueba y migración
    safe_remove "test-parseapi-fix.js"
    safe_remove "apps/backend/migrar_usuario_string_a_objectid.js"
    
    # Limpiar directorio temp
    if [ -d "temp" ]; then
        log "Limpiando directorio temp..."
        rm -rf temp/*
        log "Directorio temp limpiado"
    fi
    
    # Eliminar backups antiguos (más de 30 días)
    if [ -d "var/storage/backups" ]; then
        log "Eliminando backups antiguos..."
        find var/storage/backups/ -name "backup_*" -mtime +30 -delete 2>/dev/null || true
        log "Backups antiguos eliminados"
    fi
}

# Función para limpiar componentes deprecados
cleanup_deprecated_components() {
    log "🗑️ Limpiando componentes deprecados..."
    
    # Verificar si el componente deprecated aún se usa
    if grep -r "InlineItemConfig" apps/frontend/src/ --include="*.jsx" --exclude="InlineItemConfig.jsx" > /dev/null 2>&1; then
        warn "InlineItemConfig aún se está usando. No se puede eliminar."
    else
        safe_remove "apps/frontend/src/components/rutinas/InlineItemConfig.jsx"
        log "Componente deprecated eliminado"
    fi
    
    # Eliminar archivo de comparación si existe
    safe_remove "apps/frontend/src/components/rutinas/ConfigComparison.jsx"
}

# Función para limpiar logs de desarrollo
cleanup_dev_logs() {
    log "📝 Limpiando logs de desarrollo..."
    
    # Buscar console.log en archivos del backend
    local console_logs=$(grep -r "console\.log" apps/backend/src/ --include="*.js" | wc -l)
    info "Encontrados $console_logs console.log en apps/backend/src/"
    
    # Buscar console.log en archivos del frontend
    local frontend_logs=$(grep -r "console\.log" apps/frontend/src/ --include="*.jsx" | wc -l)
    info "Encontrados $frontend_logs console.log en apps/frontend/src/"
    
    warn "Revisa manualmente los logs de desarrollo en:"
    warn "  - apps/backend/src/index.js"
    warn "  - apps/backend/src/config/passport.js"
    warn "  - apps/frontend/src/components/rutinas/DEBUG.js"
}

# Función para detectar archivos no utilizados
detect_unused_files() {
    log "🔍 Detectando archivos no utilizados..."
    
    # Verificar si npx está disponible
    if command -v npx >/dev/null 2>&1; then
        info "Ejecutando depcheck para detectar dependencias no utilizadas..."
        npx depcheck --json 2>/dev/null || warn "depcheck no pudo ejecutarse completamente"
    else
        warn "npx no está disponible. No se puede ejecutar depcheck."
    fi
}

# Función para limpiar node_modules si es necesario
cleanup_node_modules() {
    if [ "$1" = "--deep" ]; then
        log "🧹 Limpieza profunda de node_modules..."
        
        # Verificar si estamos en el directorio correcto
        if [ -f "package.json" ]; then
            log "Eliminando node_modules..."
            rm -rf node_modules
            log "Instalando dependencias..."
            npm install
        else
            warn "No se encontró package.json en el directorio actual"
        fi
    fi
}

# Función para mostrar estadísticas
show_stats() {
    log "📊 Estadísticas de limpieza:"
    
    # Contar archivos JavaScript/JSX
    local js_files=$(find . -name "*.js" -o -name "*.jsx" | wc -l)
    info "Total de archivos JS/JSX: $js_files"
    
    # Contar console.log
    local console_logs=$(grep -r "console\.log" . --include="*.js" --include="*.jsx" | wc -l)
    info "Total de console.log: $console_logs"
    
    # Contar TODO/FIXME
    local todos=$(grep -r "TODO\|FIXME\|HACK" . --include="*.js" --include="*.jsx" | wc -l)
    info "Total de TODO/FIXME: $todos"
    
    # Tamaño del proyecto
    local size=$(du -sh . | cut -f1)
    info "Tamaño del proyecto: $size"
}

# Función principal
main() {
    log "🚀 Iniciando limpieza de código..."
    
    # Verificar que estamos en el directorio correcto
    if [ ! -f "package.json" ] && [ ! -f "apps/frontend/package.json" ]; then
        error "No se encontró package.json. Asegúrate de estar en el directorio del proyecto."
        exit 1
    fi
    
    # Ejecutar limpieza
    cleanup_temp_files
    cleanup_deprecated_components
    cleanup_dev_logs
    detect_unused_files
    
    # Limpieza profunda si se solicita
    if [ "$1" = "--deep" ]; then
        cleanup_node_modules --deep
    fi
    
    # Mostrar estadísticas
    show_stats
    
    log "✅ Limpieza completada!"
    log "💡 Sugerencias:"
    log "   - Revisa los logs de desarrollo manualmente"
    log "   - Considera implementar un logger estructurado"
    log "   - Configura ESLint para detectar código no utilizado"
}

# Mostrar ayuda
show_help() {
    echo "🧹 Script de Limpieza de Código"
    echo ""
    echo "Uso: $0 [opciones]"
    echo ""
    echo "Opciones:"
    echo "  --help, -h     Mostrar esta ayuda"
    echo "  --deep         Limpieza profunda (incluye node_modules)"
    echo ""
    echo "Ejemplos:"
    echo "  $0              Limpieza básica"
    echo "  $0 --deep       Limpieza profunda"
}

# Manejar argumentos
case "$1" in
    --help|-h)
        show_help
        exit 0
        ;;
    --deep)
        main --deep
        ;;
    "")
        main
        ;;
    *)
        error "Opción desconocida: $1"
        show_help
        exit 1
        ;;
esac 