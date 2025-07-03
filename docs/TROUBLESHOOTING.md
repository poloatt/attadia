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