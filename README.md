#
Análisis de la Aplicación:
Arquitectura General:
Aplicación de 3 capas: Frontend, Backend y Base de datos (MongoDB)
Utiliza Docker para la containerización
Sistema de autenticación con JWT y Google OAuth
Desarrollo actual en ambiente local/desarrollo
Frontend:
Aplicación Vite.js
Puerto de desarrollo: 5173
Variables de entorno configuradas para desarrollo
Dependencias manejadas a través de npm/node_modules
Backend:
Node.js
Puerto: 5000
Autenticación con JWT y Google OAuth
Conexión a MongoDB
Variables de entorno sensibles configuradas
Base de Datos:
MongoDB como base de datos principal
Credenciales de desarrollo expuestas en docker-compose
Volumen persistente para datos
5. Configuración Actual:
Ambiente de desarrollo con URLs locales
Secretos y claves API expuestas en configuración
Logging básico configurado
Network bridge entre servicios

 Present - Sistema de Gestión

## Descripción
Present es un sistema de gestión integral que incluye módulos para administración de propiedades, finanzas, rutinas, laboratorio y más.

## Requisitos Previos
- Docker y Docker Compose
- Node.js (v18 o superior)
- MongoDB (se incluye en Docker)

## Configuración del Entorno

### 1. Variables de Entorno

#### Backend (.env)
```env
# Entorno
NODE_ENV=development

# Puerto
PORT=5000

# MongoDB
MONGODB_URI=mongodb://mongodb:27017/present

# Frontend
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# CORS
CORS_ORIGIN=http://localhost:5173

# JWT
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRE=1h
REFRESH_TOKEN_SECRET=your_secure_refresh_token_secret_here
REFRESH_TOKEN_EXPIRE=7d

# Cookie
COOKIE_SECRET=your_secure_cookie_secret_here
COOKIE_EXPIRE=7

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

### 2. Configuración de Google OAuth

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear un nuevo proyecto o seleccionar uno existente
3. Habilitar la API de Google+ y OAuth
4. Configurar las credenciales OAuth:
   - Tipo: Aplicación Web
   - Nombre: Present
   - Orígenes autorizados:
     - http://localhost:5173
   - URIs de redirección autorizadas:
     - http://localhost:5000/api/auth/google/callback

5. Copiar el Client ID y Client Secret a las variables de entorno correspondientes

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/present.git
cd present
```

2. Instalar dependencias:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Iniciar con Docker:
```bash
docker-compose up
```

## Estructura del Proyecto

```
present/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── index.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
└── docker-compose.yml
```

## Autenticación

### Flujo de Autenticación con Google

1. El usuario hace clic en "Login con Google"
2. Se redirige a la página de autenticación de Google
3. Después de la autenticación exitosa, Google redirige a:
   `http://localhost:5000/api/auth/google/callback`
4. El backend procesa el callback y redirige al frontend:
   `http://localhost:5173/auth/callback`
5. El frontend maneja el token y redirige al dashboard

### Rutas de Autenticación

- `/login` - Página de inicio de sesión
- `/auth/callback` - Manejo de callback de Google
- `/api/auth/google/url` - Obtener URL de autenticación
- `/api/auth/google/callback` - Callback de Google
- `/api/auth/check` - Verificar estado de autenticación

## Desarrollo

### Comandos Útiles

```bash
# Iniciar en modo desarrollo
docker-compose up

# Reconstruir contenedores
docker-compose up --build

# Detener contenedores
docker-compose down

# Logs
docker-compose logs -f

# Acceder a la shell de un contenedor
docker-compose exec backend sh
docker-compose exec frontend sh
```

### Puertos

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- MongoDB: mongodb://localhost:27017

## Seguridad

- Todas las rutas de la API están protegidas con JWT
- Las contraseñas se hashean con bcrypt
- CORS configurado para permitir solo orígenes específicos
- Rate limiting implementado para prevenir ataques de fuerza bruta

## Contribuir

1. Fork el repositorio
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.