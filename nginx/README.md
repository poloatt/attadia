# Configuración de Nginx para Present

Este directorio contiene archivos de configuración de Nginx para servir la aplicación Present en entornos de producción y staging.

## Contenido

### Producción
- `sites-available/present.attadia.com` - Configuración HTTP para el dominio present.attadia.com
- `sites-available/present.attadia.com.ssl` - Configuración HTTPS (SSL) para el dominio present.attadia.com

### Staging
- `sites-available/staging.present.attadia.com` - Configuración HTTP para el dominio staging.present.attadia.com
- `sites-available/staging.present.attadia.com.ssl` - Configuración HTTPS (SSL) para el dominio staging.present.attadia.com

## Instrucciones para configuración

Sigue estos pasos para configurar Nginx en cada entorno:

### Dar permisos de ejecución a los scripts

```bash
chmod +x scripts/setup-nginx-production.sh
chmod +x scripts/setup-nginx-staging.sh
chmod +x scripts/generate-ssl-cert.sh
chmod +x scripts/generate-ssl-cert-staging.sh
```

### Configuración para producción

#### HTTP

```bash
./scripts/setup-nginx-production.sh
```

#### HTTPS (opcional)

```bash
./scripts/generate-ssl-cert.sh
sudo cp nginx/sites-available/present.attadia.com.ssl /etc/nginx/sites-available/present.attadia.com
sudo systemctl restart nginx
```

### Configuración para staging

#### HTTP

```bash
./scripts/setup-nginx-staging.sh
```

#### HTTPS (opcional)

```bash
./scripts/generate-ssl-cert-staging.sh
sudo cp nginx/sites-available/staging.present.attadia.com.ssl /etc/nginx/sites-available/staging.present.attadia.com
sudo systemctl restart nginx
```

## Problemas comunes

### Error "Connection Refused"

Si ves el error ERR_CONNECTION_REFUSED en el navegador:

1. Verifica que Nginx esté en ejecución:
   ```bash
   sudo systemctl status nginx
   ```

2. Comprueba si los puertos están abiertos en el firewall de Google Cloud:
   - Puerto 80 (HTTP)
   - Puerto 443 (HTTPS)

3. Asegúrate de que los registros DNS estén correctamente configurados para apuntar a la IP pública del servidor.

### Error "Certificate not trusted"

Si ves errores de certificado en el navegador:

1. Para entornos de producción, considera utilizar Let's Encrypt para obtener certificados válidos:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d present.attadia.com -d admin.attadia.com
   ```

2. Para staging, puedes usar certificados autofirmados, pero deberás aceptar la advertencia en el navegador. 