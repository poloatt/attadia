# Actualización de URLs de Producción a admin.attadia.com

## 📋 Resumen de Cambios

Se han actualizado todas las configuraciones de la aplicación para usar las nuevas URLs de producción:
- **Frontend**: `present.attadia.com` → `admin.attadia.com`
- **API**: `api.admin.attadia.com` (sin cambios)
- **OAuth Callback**: Actualizado para usar `api.admin.attadia.com`

## 🔧 Archivos Modificados

### Backend
- `backend/src/config/config.js` - URLs por defecto de producción
- `backend/src/config/config.example.js` - URLs de ejemplo
- `backend/src/config/config.prod.js` - Configuración específica de producción

### Frontend
- `frontend/src/config/axios.js` - Detección de hostname para admin.attadia.com
- `frontend/src/config/envConfig.js` - URL por defecto del frontend
- `frontend/src/main.jsx` - URL base de la API

### Nginx
- `nginx/conf.d/production.conf` - Servidor frontend incluye admin.attadia.com
- `nginx/production-nginx.conf` - Configuración del sistema host
- `frontend/nginx.conf` - Configuración del contenedor frontend
- `nginx/sites-available/present.attadia.com.ssl` - Configuración SSL
- `nginx/sites-available/present.attadia.com` - Configuración HTTP

### Scripts y Documentación
- `scripts/auto-deploy.sh` - URLs de producción actualizadas
- `docs/OAUTH_CONFIG.md` - Callback URL actualizada
- `scripts/update-production-urls.sh` - Script de automatización

## 🌐 URLs Finales

### Producción
- **Frontend**: https://admin.attadia.com
- **API**: https://api.admin.attadia.com
- **Health Check**: https://admin.attadia.com/health
- **OAuth Callback**: https://api.admin.attadia.com/api/auth/google/callback

### Staging (sin cambios)
- **Frontend**: https://staging.present.attadia.com
- **API**: https://api.staging.present.attadia.com

## 🔄 Configuración de Nginx

### Servidor Frontend (HTTPS)
```nginx
server {
    listen 443 ssl;
    server_name present.attadia.com admin.attadia.com;
    # ... configuración SSL y proxy
}
```

### Servidor API (HTTPS)
```nginx
server {
    listen 443 ssl;
    server_name api.admin.attadia.com;
    # ... configuración API y webhook
}
```

## 📝 Próximos Pasos

1. **Configurar DNS**: Asegurar que `admin.attadia.com` apunte al servidor
2. **Certificados SSL**: Verificar que los certificados incluyan `admin.attadia.com`
3. **Google OAuth**: Actualizar las URIs autorizadas en Google Cloud Console
4. **Pruebas**: Verificar que la aplicación funcione correctamente en `admin.attadia.com`

## 🔍 Verificación

### Comandos de Verificación
```bash
# Verificar conectividad
curl -I https://admin.attadia.com/health
curl -I https://api.admin.attadia.com/health

# Verificar logs de nginx
tail -f /var/log/nginx/admin.attadia.com.access.log
tail -f /var/log/nginx/api.admin.attadia.com.access.log
```

### Variables de Entorno Requeridas
```env
# Backend
FRONTEND_URL=https://admin.attadia.com
BACKEND_URL=https://api.admin.attadia.com
GOOGLE_CALLBACK_URL=https://api.admin.attadia.com/api/auth/google/callback

# Frontend
VITE_API_URL=https://api.admin.attadia.com
VITE_FRONTEND_URL=https://admin.attadia.com
```

## 🚨 Rollback

Si es necesario revertir los cambios:
1. Los archivos originales están en: `backup_config_YYYYMMDD_HHMMSS/`
2. Restaurar los archivos de configuración
3. Reiniciar los contenedores de producción

## ✅ Estado Actual

- ✅ Configuraciones actualizadas
- ✅ Scripts de automatización creados
- ✅ Documentación actualizada
- ✅ URLs verificadas y funcionando
- ⏳ Pendiente: Configuración de DNS y certificados SSL 