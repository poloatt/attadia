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

- Los backups de la base de datos se realizan automáticamente
- Se mantienen los últimos 7 backups
- Todos los datos persistentes se almacenan en `/data`# Prueba de webhook
# Test webhook Mon Mar 17 19:31:43 CET 2025


   
 

    