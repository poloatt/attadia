# Present - Sistema de Gestión

## Estructura de Ramas

El proyecto utiliza el siguiente flujo de trabajo con Git:

- `main`: Rama principal, contiene el código estable
- `develop`: Rama de desarrollo, donde se integran las nuevas características
- `produccion`: Rama de producción, conectada al sistema de despliegue automático
- `feature/*`: Ramas para nuevas características

## Flujo de Trabajo

1. **Desarrollo de Nuevas Características**:
   ```bash
   # Crear nueva rama feature desde develop
   git checkout develop
   git pull origin develop
   git checkout -b feature/nueva-funcionalidad

   # Desarrollar y hacer commits
   git add .
   git commit -m "feat: descripción del cambio"
   git push origin feature/nueva-funcionalidad
   ```

2. **Integración a Develop**:
   ```bash
   # Cuando la feature está lista
   git checkout develop
   git pull origin develop
   git merge feature/nueva-funcionalidad
   git push origin develop
   ```

3. **Despliegue a Producción**:
   ```bash
   # Cuando develop está estable
   git checkout produccion
   git pull origin produccion
   git merge develop
   git push origin produccion  # Esto activará el despliegue automático
   ```

## Configuración del Proyecto

1. **Configuración Inicial**:
   ```bash
   # Clonar el repositorio
   git clone https://github.com/poloatt/present.git
   cd present

   # Instalar dependencias
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. **Archivos de Configuración**:
   - Copiar los archivos de ejemplo:
     ```bash
     cp backend/src/config/config.example.js backend/src/config/config.js
     cp frontend/src/config.example.js frontend/src/config.js
     ```
   - Editar los archivos con las configuraciones necesarias

3. **Variables de Entorno**:
   - Crear archivos `.env` basados en `.env.example`
   - Configurar las variables necesarias para cada entorno

## Despliegue

El sistema utiliza despliegue automático a través de webhooks:

1. Los pushes a la rama `produccion` activan el webhook
2. El sistema ejecuta automáticamente:
   - Pull de los últimos cambios
   - Reconstrucción de contenedores Docker
   - Reinicio de servicios

## Desarrollo Local

1. **Entorno de Desarrollo**:
   ```bash
   # Iniciar servicios en modo desarrollo
   docker-compose up -d
   ```

2. **Pruebas**:
   ```bash
   # Ejecutar pruebas
   cd backend && npm test
   cd frontend && npm test
   ```

## Mantenimiento

- Los logs se encuentran en `/var/log/`
- Monitoreo del webhook: `tail -f /home/poloatt/presentprod/webhook/webhook.log`
- Estado de los servicios: `docker-compose ps`