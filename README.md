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

# Present - Ambiente de Staging

## Prerequisitos

Asegúrate de tener instalado:
```bash
sudo apt-get update && sudo apt-get install -y make
```

## Comandos Make Disponibles

### Comandos Principales

| Comando | Descripción |
|---------|-------------|
| `make staging` | Construye e inicia todos los contenedores de staging (comando todo en uno) |
| `make staging-build` | Construye las imágenes de los contenedores sin usar caché |
| `make staging-up` | Inicia todos los contenedores en modo detached |
| `make staging-down` | Detiene y elimina todos los contenedores |
| `make staging-logs` | Muestra los logs de todos los contenedores en tiempo real |
| `make staging-restart` | Reinicia todos los contenedores |

### Ejemplos de Uso

1. Primera vez o después de cambios:
```bash
make staging
```

2. Ver logs en tiempo real:
```bash
make staging-logs
```

3. Reiniciar servicios:
```bash
make staging-restart
```

4. Detener todos los servicios:
```bash
make staging-down
```

## Archivos de Configuración

El ambiente de staging utiliza los siguientes archivos de configuración:
- `.env.staging` - Variables de entorno para la aplicación
- `.env.staging.docker` - Variables de entorno para Docker Compose
- `docker-compose.staging.yml` - Configuración de los servicios

## URLs

- Frontend: https://staging.present.attadia.com
- Backend API: https://api.staging.present.attadia.com