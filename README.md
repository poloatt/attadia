# Present - Sistema de Gestión

Sistema de gestión financiera y de proyectos para empresas y profesionales independientes.

## Documentación

La documentación detallada del proyecto se encuentra en la carpeta `docs`:


- [Guía de Despliegue](docs/DEPLOYMENT.md) - Instrucciones para desplegar en staging y producción
- [Configuración de OAuth](docs/OAUTH_CONFIG.md) - Configuración de autenticación con Google
- [Flujo de Trabajo](docs/README.md) - Estructura de ramas y flujo de trabajo con Git


## Estructura del Proyecto   
 

```
present/
├── backend/         # API REST (Node.js, Express, MongoDB)
├── frontend/        # Interfaz de usuario (React, Vite)
├── nginx/           # Configuración de Nginx para producción
├── scripts/         # Scripts de despliegue y mantenimiento
├── docs/            # Documentación del proyecto
├── config/          # Archivos de configuración
│   └── mongodb/     # Configuración de MongoDB
├── data/            # Datos persistentes
│   └── backups/     # Backups de la base de datos
│       └── mongodb/ # Backups de MongoDB
├── examples/        # Ejemplos de configuración
├── temp/            # Archivos temporales (ignorados por git)
└── docker-compose.* # Configuraciones para diferentes entornos
```

## Inicio Rápido

### Desarrollo Local

```bash
# Clonar el repositorio
git clone https://github.com/poloatt/present.git
cd present

# Instalar dependencias
cd frontend && npm install
cd ../backend && npm install

# Iniciar servicios en modo desarrollo
docker-compose up -d
```

### Despliegue

Para desplegar en staging o producción, consulta la [Guía de Despliegue](docs/DEPLOYMENT.md).

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

## Webhooks

El sistema utiliza webhooks para el despliegue automático:
- Rama `main` -> Ambiente de producción (Puerto 9000)
- Rama `staging` -> Ambiente de staging (Puerto 9001)
