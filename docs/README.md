# Present App - Documentación

Este repositorio contiene la documentación necesaria para el desarrollo, despliegue y mantenimiento de Present App.

## Índice

1. [Estructura del Proyecto](#estructura-del-proyecto)
2. [Entornos](#entornos)
3. [Despliegue](#despliegue)
4. [Configuración de OAuth](#configuración-de-oauth)
5. [Configuración de Nginx](#configuración-de-nginx)
6. [Backups y Mantenimiento](#backups-y-mantenimiento)

## Estructura del Proyecto

El proyecto está estructurado en los siguientes componentes:

- **frontend**: Aplicación React con Vite
- **backend**: API REST con Node.js y Express
- **webhook**: Servicio para automatizar despliegues
- **nginx**: Configuraciones para el servidor web
- **scripts**: Scripts de automatización para diferentes tareas
- **docs**: Documentación del proyecto

## Entornos

La aplicación está configurada para funcionar en tres entornos:

- **Desarrollo**: Entorno local para desarrollo
- **Staging**: Entorno de pruebas preproducción
- **Producción**: Entorno de producción

Cada entorno tiene su propia configuración, que se maneja mediante archivos `.env` específicos.

## Despliegue

Para información detallada sobre el proceso de despliegue, consulta [DEPLOYMENT.md](./DEPLOYMENT.md).

## Configuración de OAuth

Para configurar la autenticación con Google OAuth, consulta [OAUTH_CONFIG.md](./OAUTH_CONFIG.md).

## Configuración de Nginx

### Estructura del archivo nginx.conf

El archivo `nginx.conf` para el contenedor frontend debe seguir esta estructura:

```nginx
worker_processes auto;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        # Resto de la configuración...
    }
}
```

Es importante mantener esta estructura para evitar errores como "unknown directive" que pueden causar que el contenedor se reinicie continuamente.

### Configuraciones específicas por entorno

- Staging: `nginx/conf.d/staging.conf`
- Producción: `nginx/conf.d/production.conf`

Estas configuraciones son utilizadas por el servidor Nginx del host, no por el contenedor.

### Resolución de nombres en Nginx del host

Al configurar el proxy en el host hacia los contenedores, usa `localhost:puerto` en lugar de nombres de contenedores, ya que el host no puede resolver los nombres internos de Docker.

## Backups y Mantenimiento

Para información sobre backups y mantenimiento de la base de datos MongoDB, consulta la sección correspondiente en [DEPLOYMENT.md](./DEPLOYMENT.md#backups-de-la-base-de-datos).