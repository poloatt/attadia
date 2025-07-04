# Fix: Error 404 al Eliminar Rutinas en Producción

## 🔥 **Problema Identificado**

El frontend intenta hacer llamadas DELETE a:
```
https://api.admin.attadia.com/api/rutinas/ID
```

Pero recibe error **404 (Not Found)** porque el subdominio `api.admin.attadia.com` **no está configurado** en nginx.

## 📋 **Análisis del Problema**

### Configuración Actual
- ✅ `admin.attadia.com` - Configurado correctamente
- ❌ `api.admin.attadia.com` - **NO EXISTE** en nginx
- ✅ Backend corriendo en `localhost:5000`

### Causa Raíz
El archivo `frontend/src/config/envConfig.js` línea 17 está configurado para usar `admin.attadia.com` por defecto, pero existe una variable de entorno `VITE_API_URL` que sobrescribe esta configuración y apunta a `api.admin.attadia.com`.

### Evidencia
```bash
# Error reportado
DELETE https://api.admin.attadia.com/api/rutinas/6866fa2a1a61acc2d44cc61d 404 (Not Found)

# Configuración actual nginx
$ ls /etc/nginx/sites-enabled/
admin.attadia.com  # ✅ Existe
# api.admin.attadia.com  # ❌ No existe
```

## 🔧 **Solución Implementada**

### 1. Configuración de nginx
- **Archivo**: `nginx/sites-available/api.admin.attadia.com`
- **Función**: Proxy reverso que redirige peticiones a `localhost:5000`
- **Incluye**: CORS, SSL, logging, compresión

### 2. Script de Configuración Automática
- **Archivo**: `scripts/fix-api-subdomain.sh`
- **Función**: Configura automáticamente el subdominio
- **Incluye**: Backup, verificaciones, rollback automático

### 3. Certificados SSL
- **Archivo**: `scripts/generate-ssl-cert-letsencrypt.sh`
- **Función**: Obtiene certificados Let's Encrypt para ambos dominios
- **Incluye**: Renovación automática, verificaciones

### 4. Diagnóstico
- **Archivo**: `scripts/debug-rutinas-delete.sh`
- **Función**: Diagnostica el problema y verifica la solución

## 🚀 **Instrucciones de Deployment**

### En el Servidor de Producción

1. **Acceder al servidor**:
   ```bash
   # Desde PowerShell local
   wsl
   gcloud compute ssh --zone "southamerica-west1-c" "foco-prod" --project "present-webapp-449410"
   ```

2. **Ir al directorio del proyecto**:
   ```bash
   cd /root/present
   git pull origin main
   ```

3. **Ejecutar diagnóstico** (opcional):
   ```bash
   sudo chmod +x scripts/debug-rutinas-delete.sh
   sudo ./scripts/debug-rutinas-delete.sh
   ```

4. **Configurar nginx**:
   ```bash
   sudo chmod +x scripts/fix-api-subdomain.sh
   sudo ./scripts/fix-api-subdomain.sh
   ```

5. **Configurar SSL**:
   ```bash
   sudo chmod +x scripts/generate-ssl-cert-letsencrypt.sh
   sudo ./scripts/generate-ssl-cert-letsencrypt.sh
   ```

6. **Verificar funcionamiento**:
   ```bash
   # Probar endpoints
   curl -I https://api.admin.attadia.com/health
   curl -I https://api.admin.attadia.com/api/health
   
   # Verificar logs
   tail -f /var/log/nginx/api.admin.attadia.com.access.log
   ```

### Verificación Final

7. **Probar desde el frontend**:
   - Ir a la aplicación en producción
   - Intentar eliminar una rutina
   - Verificar que no aparezca el error 404

## 📊 **Configuración Técnica**

### Configuración de nginx
```nginx
server {
    listen 443 ssl http2;
    server_name api.admin.attadia.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.admin.attadia.com/fullchain.pem;
    ssl_private_key /etc/letsencrypt/live/api.admin.attadia.com/privkey.pem;
    
    # CORS headers
    add_header Access-Control-Allow-Origin "https://admin.attadia.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, User-Agent, DNT, Cache-Control, X-Mx-ReqToken, Keep-Alive, X-Requested-With, If-Modified-Since" always;
    add_header Access-Control-Allow-Credentials "true" always;
    
    # Proxy to backend
    location ~ ^/api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Variables de Entorno
```javascript
// En producción
VITE_API_URL=https://api.admin.attadia.com
```

## 🔍 **Troubleshooting**

### Si el problema persiste:

1. **Verificar DNS**:
   ```bash
   nslookup api.admin.attadia.com
   ```

2. **Verificar certificados**:
   ```bash
   certbot certificates
   ```

3. **Verificar backend**:
   ```bash
   netstat -tulpn | grep :5000
   ```

4. **Verificar logs**:
   ```bash
   tail -f /var/log/nginx/api.admin.attadia.com.error.log
   ```

### Rollback en caso de problemas:
```bash
sudo rm /etc/nginx/sites-enabled/api.admin.attadia.com
sudo systemctl reload nginx
```

## 📈 **Resultados Esperados**

- ✅ Eliminación de rutinas funciona correctamente
- ✅ No más errores 404 en `api.admin.attadia.com`
- ✅ CORS configurado correctamente
- ✅ SSL funcional para ambos dominios
- ✅ Logs específicos para debugging

## 🎯 **Archivos Afectados**

### Creados/Modificados:
- `nginx/sites-available/api.admin.attadia.com`
- `scripts/fix-api-subdomain.sh`
- `scripts/generate-ssl-cert-letsencrypt.sh`
- `scripts/debug-rutinas-delete.sh`
- `docs/FIX-RUTINAS-DELETE-404.md`

### Configuraciones de Sistema:
- `/etc/nginx/sites-enabled/api.admin.attadia.com`
- `/etc/letsencrypt/live/api.admin.attadia.com/`
- Crontab para renovación automática de certificados

## 🔄 **Mantenimiento**

### Renovación Automática de Certificados
Los certificados SSL se renovarán automáticamente vía crontab:
```bash
0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

### Monitoreo
```bash
# Verificar certificados
certbot certificates

# Verificar conectividad
curl -I https://api.admin.attadia.com/health

# Verificar logs
tail -f /var/log/nginx/api.admin.attadia.com.access.log
```

---

**Creado**: $(date)  
**Autor**: Assistant  
**Versión**: 1.0 