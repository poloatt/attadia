# Solución al problema de acceso a staging.present.attadia.com

El problema actual es que el servidor Nginx del sistema host no está configurado correctamente para permitir el acceso al sitio web. Específicamente, hay un error porque el archivo de configuración está haciendo referencia a un host `backend` que no existe en la red del host (este nombre solo es válido dentro de la red de Docker).

## Pasos para solucionar el problema

1. Asegúrate de que todos los contenedores estén funcionando correctamente:
   ```bash
   docker-compose -f docker-compose.staging.yml --env-file=.env.staging ps
   ```

2. Usa el script automatizado para configurar Nginx:
   ```bash
   sudo ./scripts/setup-nginx.sh staging
   ```

3. Si el script no funciona, sigue estos pasos manuales:
   
   a. Elimina la configuración actual de Nginx (que contiene errores):
   ```bash
   sudo rm /etc/nginx/sites-enabled/staging.conf
   ```
   
   b. Copia la nueva configuración:
   ```bash
   sudo cp nginx/staging-nginx.conf /etc/nginx/sites-available/staging.conf
   ```
   
   c. Crea un enlace simbólico:
   ```bash
   sudo ln -sf /etc/nginx/sites-available/staging.conf /etc/nginx/sites-enabled/
   ```
   
   d. Asegúrate de que los certificados SSL estén en su lugar:
   ```bash
   sudo mkdir -p /etc/nginx/ssl
   sudo cp ssl/nginx/ssl/fullchain.pem /etc/nginx/ssl/
   sudo cp ssl/nginx/ssl/privkey.pem /etc/nginx/ssl/
   sudo chmod 600 /etc/nginx/ssl/*.pem
   ```
   
   e. Verifica la configuración:
   ```bash
   sudo nginx -t
   ```
   
   f. Reinicia Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

4. Comprueba que Nginx esté funcionando:
   ```bash
   sudo systemctl status nginx
   ```

5. Verifica la conectividad:
   ```bash
   curl -k https://localhost
   ```

## Resolución de problemas adicionales

Si sigues teniendo problemas después de estos pasos:

1. Verifica los logs de Nginx:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

2. Asegúrate de que los puertos necesarios estén abiertos en el firewall:
   ```bash
   sudo ufw status
   ```
   
   Si es necesario, permite los puertos:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

3. Verifica las reglas de red de Google Cloud (si aplica):
   - Ve a la consola de Google Cloud
   - Navega a VPC Network > Firewall
   - Asegúrate de que haya reglas que permitan tráfico en los puertos 80 y 443

4. Verifica el DNS:
   ```bash
   nslookup staging.present.attadia.com
   ```
   Asegúrate de que el DNS esté apuntando a la IP correcta de tu servidor.

## Recordatorio sobre los archivos de configuración

Para futuros cambios, recuerda que:

1. La configuración del servidor Nginx HOST está en:
   - `nginx/staging-nginx.conf` (para staging)
   - `nginx/production-nginx.conf` (para producción)

2. Esta configuración debe usar `localhost:puerto` en lugar de nombres de contenedores Docker.

3. La configuración de Nginx dentro del CONTENEDOR está en:
   - `frontend/nginx.conf` (para staging)
   - `frontend/nginx.conf.prod` (para producción)

4. Después de realizar cambios, siempre:
   - Prueba la configuración con `sudo nginx -t`
   - Reinicia Nginx con `sudo systemctl restart nginx`
   - Verifica el estado con `sudo systemctl status nginx` 