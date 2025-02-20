# Present - Configuración de Producción

Este repositorio contiene la configuración de producción para el sistema Present.

## Estructura

- `docker-compose.prod.yml`: Configuración de Docker para producción
- `nginx/`: Configuraciones de Nginx
  - `conf.d/`: Archivos de configuración del servidor
  - `ssl/`: Certificados SSL (se configurarán posteriormente)
- `frontend/`: Aplicación React
- `backend/`: API Node.js + MongoDB

## Despliegue

1. Clonar el repositorio
2. Configurar las variables de entorno
3. Ejecutar `docker-compose -f docker-compose.prod.yml up -d`

## Variables de Entorno

### Backend (.env.production)
```
MONGODB_URI=mongodb://admin:password@mongodb:27017/present?authSource=admin
NODE_ENV=production
PORT=5000
```

### Frontend (.env.production)
```
VITE_API_URL=https://api.present.attadia.com
NODE_ENV=production
```

## Dominios

- Frontend: https://present.attadia.com
- Backend: https://api.present.attadia.com

## Certificados SSL

Los certificados SSL se configurarán una vez que el sistema esté funcionando correctamente con HTTP.