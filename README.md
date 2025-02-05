# Present - Sistema de Gestión Personal

## Descripción
Sistema integral para la gestión de finanzas personales, propiedades, rutinas y proyectos, con autenticación Google y arquitectura moderna.

## Stack Tecnológico

### Frontend
- **React 18** con Vite
- **Material-UI (MUI) v5**: Componentes de interfaz
- **React Router v6**: Navegación
- **Context API**: Gestión de estado global
- **Notistack**: Sistema de notificaciones
- **Axios**: Cliente HTTP

### Backend
- **Node.js + Express**: Framework del servidor
- **MongoDB**: Base de datos NoSQL
- **JWT**: Autenticación de usuarios
- **Google OAuth2**: Autenticación social
- **Docker**: Contenerización

## Configuración del Proyecto

### Requisitos Previos
- Docker y Docker Compose
- Node.js >= 18
- npm >= 8

### Variables de Entorno

#### Backend (.env)
```env
NODE_ENV=development
MONGODB_URI=mongodb://root:example@mongodb:27017/present?authSource=admin
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
PORT=5000
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Present
VITE_APP_VERSION=1.0.0
VITE_DEV_MODE=true
VITE_HOST=0.0.0.0
VITE_PORT=5173
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Estructura del Proyecto
```
present/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── index.js
│   └── package.json
└── frontend/
    ├── Dockerfile
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── hooks/
    │   ├── layouts/
    │   ├── pages/
    │   ├── services/
    │   ├── utils/
    │   └── App.jsx
    └── package.json
```

## Instalación y Despliegue

### Con Docker (Recomendado)
```bash
# 1. Clonar el repositorio
git clone <repo_url>
cd present

# 2. Configurar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Iniciar contenedores
docker-compose up --build
```

### Desarrollo Local
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## Puertos por Defecto
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- MongoDB: mongodb://localhost:27017

## Módulos Principales

### 1. Autenticación
- Inicio de sesión con Google
- JWT para manejo de sesiones
- Refresh tokens

### 2. Transacciones
- Gestión de finanzas personales
- Múltiples monedas
- Categorización

### 3. Propiedades
- Registro y gestión de propiedades
- Sistema de ubicaciones
- Características detalladas

### 4. Rutinas
- Seguimiento de hábitos
- Métricas personales
- Control de actividades

### 5. Laboratorio
- Análisis médicos
- Métricas de salud

### 6. Proyectos
- Gestión de tareas
- Sistema de etiquetas
- Control de tiempos

## Monitoreo y Logs
- Logs JSON con rotación
- Límite de 10MB por archivo
- Máximo 3 archivos de log

## Redes y Seguridad
- Red Docker bridge dedicada
- CORS configurado
- Secrets management
- Autenticación OAuth2

## Contribución
1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/NuevaCaracteristica`)
3. Commit (`git commit -m 'Añade nueva característica'`)
4. Push (`git push origin feature/NuevaCaracteristica`)
5. Crea un Pull Request

## Licencia
MIT

## Estado del Proyecto
En desarrollo activo