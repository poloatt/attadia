# Guía de Solución de Problemas - Present App

Este documento proporciona soluciones para problemas comunes que pueden ocurrir en el entorno de producción.

## Problemas con Certificados SSL

### Error: ERR_SSL_PROTOCOL_ERROR o ERR_CONNECTION_REFUSED

Este error ocurre cuando hay problemas con la configuración SSL o los certificados.

**Solución:**

1. Verifica que los certificados existan y sean válidos:
```bash
# Verificar certificados en el sistema
sudo certbot certificates

# Verificar certificados en el proyecto
ls -l /home/poloatt/present/ssl/nginx/ssl/
```

2. Verifica que los certificados estén actualizados:
```bash
# Renovar certificados manualmente
cd /home/poloatt/present
./ssl/renew_certs.sh
```

3. Verifica los permisos de los certificados:
```bash
sudo chown -R poloatt:poloatt /home/poloatt/present/ssl/nginx/ssl/
sudo chmod 644 /home/poloatt/present/ssl/nginx/ssl/*.pem
```

4. Reinicia el contenedor frontend:
```bash
docker restart frontend-prod
```

### Error: NET::ERR_CERT_AUTHORITY_INVALID

Este error ocurre cuando el certificado no es reconocido por el navegador.

**Solución:**

1. Verifica que estés usando los certificados de Let's Encrypt:
```bash
sudo certbot certificates | grep "Domains"
```

2. Si es necesario, genera nuevos certificados:
```bash
# Detener contenedores primero
docker-compose -f docker-compose.prod.yml down

# Generar nuevos certificados
sudo certbot certonly --standalone -d present.attadia.com -d admin.attadia.com

# Copiar nuevos certificados
sudo cp /etc/letsencrypt/live/present.attadia.com/fullchain.pem /home/poloatt/present/ssl/nginx/ssl/
sudo cp /etc/letsencrypt/live/present.attadia.com/privkey.pem /home/poloatt/present/ssl/nginx/ssl/
sudo chown -R poloatt:poloatt /home/poloatt/present/ssl/nginx/ssl/

# Reiniciar contenedores
docker-compose -f docker-compose.prod.yml up -d
```

## Problemas con el Contenedor Frontend

### Error: "no such file or directory" en los certificados SSL

Este error ocurre cuando nginx no puede encontrar los certificados SSL.

**Solución:**

1. Verifica la estructura de directorios:
```bash
ls -R /home/poloatt/present/ssl/
```

2. Verifica que los certificados estén montados correctamente:
```bash
docker exec frontend-prod ls -l /etc/nginx/ssl/
```

3. Si es necesario, recrea el volumen:
```bash
docker-compose -f docker-compose.prod.yml down
docker volume rm $(docker volume ls -q | grep ssl)
docker-compose -f docker-compose.prod.yml up -d
```

## Problemas con la API (Backend)

### Error: "502 Bad Gateway" al acceder a endpoints de la API

**Causas comunes:**
1. El contenedor backend no está funcionando
2. Problema de configuración del proxy en Nginx
3. La aplicación backend tiene un error interno

**Solución:**

1. Verifica el estado del contenedor:
```bash
docker ps | grep backend
```

2. Revisa los logs del backend:
```bash
docker logs backend-prod
```

3. Verifica la configuración del proxy en nginx.conf:
```bash
docker exec frontend-prod cat /etc/nginx/nginx.conf
```

4. Prueba la conectividad directamente:
```bash
curl -k https://admin.attadia.com/health
```

## Problemas con el Webhook

### El webhook no responde a eventos de GitHub

**Solución:**

1. Verifica que la URL del webhook use HTTPS:
   - En GitHub: Settings > Webhooks
   - La URL debe ser: `https://admin.attadia.com/webhook`

2. Verifica el estado del servicio:
```bash
sudo systemctl status present-webhook.service
```

3. Revisa los logs:
```bash
sudo journalctl -u present-webhook.service -f
```

4. Verifica la conectividad:
```bash
curl -k https://admin.attadia.com/webhook
```

## Problemas de Red

### Error al acceder a la aplicación

1. Verifica que los puertos estén abiertos:
```bash
# En el contenedor
docker exec frontend-prod netstat -tulpn

# En el host
sudo netstat -tulpn | grep -E ':80|:443'
```

2. Verifica las reglas de firewall:
```bash
# UFW
sudo ufw status

# Google Cloud Platform
# Verifica las reglas en VPC Network > Firewall
```

3. Verifica los DNS:
```bash
dig present.attadia.com
dig admin.attadia.com
```

4. Prueba la conectividad SSL:
```bash
openssl s_client -connect present.attadia.com:443 -servername present.attadia.com
```

## Problemas con Mercado Pago

### Error 400: "date_created.from is not a possible param"

**Causa**: Parámetros de fecha incorrectos para el endpoint `/v1/payments/search`

**Solución**: 
```bash
# Verificar que se usen los parámetros correctos
# Para /v1/payments/search:
range=date_created&begin_date=2024-01-01T00:00:00Z&end_date=2024-12-31T23:59:59Z

# Para /v1/account/movements/search:
date_created_from=2024-01-01T00:00:00Z&date_created_to=2024-12-31T23:59:59Z
```

**Verificación**:
```bash
# Revisar logs del backend
docker logs backend-prod | grep "MercadoPago"

# Verificar que el adaptador esté usando parámetros correctos
grep -r "date_created.from" backend/src/
```

### Error 401: Token de acceso expirado o inválido

**Causa**: El access_token ha expirado

**Solución**:
```bash
# Verificar logs de renovación de tokens
docker logs backend-prod | grep "TOKEN_EXCHANGE"

# Verificar configuración OAuth
echo $MERCADOPAGO_CLIENT_ID
echo $MERCADOPAGO_CLIENT_SECRET
```

### Error 403: Acceso denegado

**Causa**: La aplicación no tiene los permisos necesarios

**Solución**:
1. Verificar configuración en MercadoPago Developers
2. Verificar que la aplicación esté activa
3. Verificar URLs de redirección configuradas

### Error 429: Rate limit excedido

**Causa**: Demasiadas peticiones en poco tiempo

**Solución**:
```bash
# Verificar logs de rate limiting
docker logs backend-prod | grep "Rate limit"

# Esperar y reintentar (el sistema lo hace automáticamente)
# Verificar configuración de rate limiting en el código
```

### Error al obtener datos completos

**Causa**: Problema con el nuevo servicio de datos completos

**Solución**:
```bash
# Verificar logs del servicio de datos completos
docker logs backend-prod | grep "MercadoPagoDataService"

# Probar endpoint directamente
curl -H "Authorization: Bearer TOKEN" \
  "https://admin.attadia.com/api/bankconnections/mercadopago/datos-completos/CONNECTION_ID"

# Verificar que todos los endpoints funcionen
curl -H "Authorization: Bearer TOKEN" \
  "https://admin.attadia.com/api/bankconnections/mercadopago/datos-completos/CONNECTION_ID?limit=1"
```

### Error al procesar datos

**Causa**: Problema en el procesamiento de transacciones

**Solución**:
```bash
# Verificar logs de procesamiento
docker logs backend-prod | grep "procesarPagos\|procesarMovimientos"

# Verificar base de datos
docker exec -it mongodb mongo
use present
db.transacciones.find({"origen.tipo": /MERCADOPAGO/}).limit(5)
```

### Error de moneda no encontrada

**Causa**: La moneda no existe en la base de datos

**Solución**:
```bash
# Verificar monedas disponibles
docker exec -it mongodb mongo
use present
db.monedas.find({})

# Crear moneda manualmente si es necesario
db.monedas.insertOne({
  codigo: "ARS",
  nombre: "Peso Argentino",
  simbolo: "$",
  pais: "Argentina"
})
```

### Error de conexión OAuth

**Causa**: Problema en el flujo de autorización

**Solución**:
```bash
# Verificar logs de OAuth
docker logs backend-prod | grep "OAuth\|callback"

# Verificar variables de entorno
echo $MERCADOPAGO_CLIENT_ID
echo $MERCADOPAGO_CLIENT_SECRET
echo $FRONTEND_URL

# Verificar URLs de redirección en MercadoPago Developers
# Deben coincidir con:
# - Desarrollo: http://localhost:5173/mercadopago/callback
# - Staging: https://staging.present.attadia.com/mercadopago/callback
# - Producción: https://present.attadia.com/mercadopago/callback
```

### Error de encriptación de credenciales

**Causa**: Problema con la clave de encriptación

**Solución**:
```bash
# Verificar clave de encriptación
echo $ENCRYPTION_KEY

# La clave debe ser de al menos 32 caracteres
# Si es necesario, regenerar y actualizar credenciales
```

### Verificación de Integración Completa

Para verificar que toda la integración funcione correctamente:

```bash
# 1. Verificar que el backend esté funcionando
curl -k https://admin.attadia.com/health

# 2. Verificar endpoints de Mercado Pago
curl -k https://admin.attadia.com/api/bankconnections/mercadopago/auth-url

# 3. Verificar logs de sincronización
docker logs backend-prod | grep "sincronizarConMercadoPago"

# 4. Verificar datos en base de datos
docker exec -it mongodb mongo
use present
db.bankconnections.find({"tipo": "MERCADOPAGO"})
db.transacciones.find({"origen.tipo": /MERCADOPAGO/}).count()
```

### Comandos de Diagnóstico Rápidos

```bash
# Estado general del sistema
docker ps
docker logs backend-prod --tail 50

# Logs específicos de Mercado Pago
docker logs backend-prod | grep -i "mercadopago" | tail -20

# Verificar conectividad con Mercado Pago
curl -I https://api.mercadopago.com/health

# Verificar configuración de la aplicación
docker exec backend-prod env | grep MERCADOPAGO
``` 