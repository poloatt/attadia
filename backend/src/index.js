import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { passportConfig } from './config/passport.js';
import { router } from './routes/index.js';
import morgan from 'morgan';
import connectDB from './config/database/mongodb.js';
import { initializeMonedas } from './config/initData.js';
import config from './config/config.js';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const app = express();

// Crear cliente Redis
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379'
});

redisClient.on('error', (err) => console.log('Error de Redis:', err));
redisClient.on('connect', () => console.log('Redis conectado'));

await redisClient.connect();

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Configuración de CORS más permisiva en desarrollo
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = config.corsOrigins;
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Origen bloqueado por CORS:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200
};

// Middlewares
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(config.sessionSecret));

// Configuración de sesión con Redis
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  name: 'sessionId',
  cookie: {
    secure: config.env === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    sameSite: config.env === 'production' ? 'strict' : 'lax'
  }
}));

// Inicialización de Passport
app.use(passportConfig.initialize());
app.use(passportConfig.session());

// Logging middleware mejorado
if (config.isDev) {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Query:', req.query);
    console.log('Body:', req.body);
    next();
  });
}

// Health check con más información
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date(),
    env: config.env,
    cors: {
      enabled: true,
      origins: config.isDev ? 'all' : config.corsOrigins
    },
    auth: {
      google: !!config.google.clientId,
      session: !!config.sessionSecret
    }
  });
});

// Montamos todas las rutas bajo /api
app.use('/api', router);

// Manejo de errores global mejorado
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    headers: req.headers
  });
  
  // Si es un error de CORS
  if (err.message.includes('Not allowed by CORS')) {
    return res.status(403).json({
      error: 'Origen no permitido',
      message: 'El origen de la petición no está autorizado',
      origin: req.headers.origin
    });
  }
  
  // Si es un error de MongoDB
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    return res.status(503).json({
      error: 'Error de base de datos',
      message: config.isDev ? err.message : 'Error interno del servidor'
    });
  }
  
  // Si es un error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      message: err.message,
      details: config.isDev ? err.errors : undefined
    });
  }
  
  // Si es un error de autenticación
  if (err.name === 'AuthenticationError' || err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Error de autenticación',
      message: err.message
    });
  }
  
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: config.isDev ? err.message : 'Error interno del servidor',
    stack: config.isDev ? err.stack : undefined
  });
});

// Conexión a MongoDB e inicialización del servidor
const startServer = async () => {
  try {
    await connectDB();
    console.log('MongoDB conectado exitosamente');
    
    await initializeMonedas();
    console.log('Datos iniciales cargados');
    
    app.listen(config.port, () => {
      console.log(`
=================================
🚀 Servidor iniciado
--------------------------------
🌍 Puerto: ${config.port}
🔧 Ambiente: ${config.env}
🔗 Frontend URL: ${config.frontendUrl}
🛡️ CORS: ${config.isDev ? 'Todos los orígenes (dev)' : config.corsOrigins.join(', ')}
=================================
      `);
    });
  } catch (error) {
    console.error('Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();