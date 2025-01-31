# Sistema de Gestión Personal

Este proyecto es una aplicación web full-stack para la gestión personal de finanzas, propiedades, inventario, rutinas diarias y proyectos.

## Estructura del Proyecto

# Present

Present es una aplicación web moderna para gestión personal y profesional.

## Cambios Recientes

### Frontend
- Implementado sistema de estado de conexión en tiempo real
- Añadido indicador visual de estado de conexión con backend y base de datos
- Mejorado el manejo de formularios con validación y campos select
- Corregidos problemas con React DevTools y Fast Refresh
- Implementada barra de estado de conexión persistente
- Mejorado el sistema de navegación con sidebar colapsable
- Añadido soporte para campos tipo array en formularios
- Implementada validación de campos requeridos
- Mejorado el manejo de errores en formularios

### Backend
- Añadido endpoint de health check para monitoreo
- Implementado script de espera para base de datos
- Mejorado el sistema de inicialización con docker-entrypoint
- Implementadas migraciones automáticas al inicio
- Configurado CORS para mejor seguridad

### Características Nuevas
- **Estado de Conexión**: Monitoreo en tiempo real del estado de conexión con el backend y la base de datos
- **Formularios Mejorados**: 
  - Soporte para campos tipo select con opciones
  - Manejo de arrays con chips
  - Validación mejorada
- **Inicialización Robusta**: Sistema mejorado de inicio con verificación de base de datos
- **UI/UX**: 
  - Sidebar colapsable para mejor uso del espacio
  - Indicadores visuales de estado de conexión
  - Mejor manejo de errores y feedback al usuario

### Correcciones
- Solucionado problema con React DevTools
- Corregidos errores en campos select de Material-UI
- Mejorado el manejo de estados en formularios
- Solucionados problemas de CORS
- Implementada mejor gestión de errores en conexiones

## Próximos Pasos
- Implementar sistema de caché para mejor rendimiento offline
- Añadir más validaciones en formularios
- Mejorar el sistema de notificaciones
- Implementar tests automatizados
- Añadir documentación de API

## Tecnologías

### Frontend
- React 18
- Material-UI (MUI) v5
- React Router v6
- Vite
- Context API para gestión de estado

### Backend
- Node.js
- Express
- MongoDB
- Docker

```
present/
├── docker-compose.yml
├── .dockerignore
├── backend/
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── auth.controller.js
│   │   ├── routes/
│   │   │   └── auth.routes.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js
│   │   ├── utils/
│   │   └── index.js
│   ├── .env
│   └── package.json
└── frontend/
    ├── Dockerfile
    ├── src/
    │   ├── index.js
    │   ├── index.css
    │   ├── components/
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── ThemeContext.jsx
    │   ├── hooks/
    │   ├── layouts/
    │   │   └── Layout.jsx
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── Transacciones.jsx
    │   │   ├── Propiedades.jsx
    │   │   ├── Inventario.jsx
    │   │   ├── Rutinas.jsx
    │   │   ├── Lab.jsx
    │   │   └── Proyectos.jsx
    │   ├── services/
    │   │   ├── api.js
    │   │   └── auth.service.js
    │   ├── utils/
    │   └── App.jsx
    └── package.json
```

## Stack Tecnológico

### Backend
- **Node.js + Express**: Framework para el servidor
- **PostgreSQL**: Base de datos relacional
- **Prisma**: ORM para manejo de base de datos
- **JWT**: Autenticación de usuarios
- **bcrypt**: Encriptación de contraseñas

### Frontend
- **React**: Biblioteca principal de UI
- **Material-UI (MUI)**: Componentes de interfaz
- **React Router**: Navegación
- **Axios**: Cliente HTTP para peticiones al backend
- **Context API**: Manejo de estado global

### Herramientas de Desarrollo
- **Nodemon**: Desarrollo en tiempo real para backend
- **ESLint**: Linting de código
- **Git**: Control de versiones
- **Prisma Studio**: Gestión visual de la base de datos

## Módulos Principales

### 1. Transacciones
- Gestión de transacciones económicas
- Soporte para múltiples monedas (EUR, USD, ARS)
- Sistema de categorización
- Control de estados de pago
- Gestión de recurrencias

### 2. Propiedades
- Registro de propiedades
- Gestión de ubicaciones
- Vinculación con cuentas
- Control de inventario por propiedad
- Gestión de habitaciones

### 3. Inventario
- Control de items
- Categorización
- Sistema de localización
- Control de consumibles
- Gestión de cantidades

### 4. Rutinas
- Seguimiento de hábitos diarios
- Checklist de actividades
- Métricas de composición corporal
- Seguimiento de sueño y estrés

### 5. Laboratorio
- Registro de análisis médicos
- Seguimiento de métricas de salud

### 6. Proyectos
- Gestión de tareas y subtareas
- Sistema de etiquetas
- Control de tiempos
- Estados de progreso

## Configuración con Docker

### Requisitos Previos
- Docker
- Docker Compose
- Node.js >= 18 (para desarrollo local)

### Pasos de Instalación

1. Clonar el repositorio:
```bash
git clone <repo_url>
cd present
```

2. Configurar variables de entorno:
```bash
# En backend/.env
DATABASE_URL="postgresql://postgres:postgres@db:5432/gestion_personal"
JWT_SECRET="desarrollo_secreto_2024"
NODE_ENV=development
```

3. Iniciar los contenedores:
```bash
docker-compose up --build
```

4. Inicializar la base de datos (primera vez):
```bash
# En otra terminal
docker-compose exec backend npx prisma migrate dev
```

### Comandos Útiles

```bash
# Ver logs de un servicio específico
docker-compose logs -f frontend
docker-compose logs -f backend

# Reiniciar un servicio
docker-compose restart frontend
docker-compose restart backend

# Detener todos los servicios
docker-compose down

# Limpiar volúmenes (¡cuidado! esto borrará la base de datos)
docker-compose down -v
```

### Desarrollo

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Base de datos: localhost:5432
- Prisma Studio: http://localhost:5555 (ejecutar: docker-compose exec backend npx prisma studio)

## Configuración Manual (Alternativa)

### Backend
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Variables de Entorno

### Backend (.env)
```
DATABASE_URL="postgresql://postgres:postgres@db:5432/gestion_personal"
JWT_SECRET="desarrollo_secreto_2024"
PORT=5000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Autores
[Tu nombre]

## Licencia
Este proyecto está bajo la Licencia MIT

## Estado de Conexiones

La aplicación monitorea constantemente:
- Conectividad con el backend (API)
- Estado de la base de datos

## Contribución

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request