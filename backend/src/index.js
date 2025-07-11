import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { passportConfig } from './config/passport.js';
import { router } from './routes/index.js';
import authRoutes from './routes/authRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import morgan from 'morgan';
import connectDB from './config/database/mongodb.js';
import { initializeMonedas } from './config/initData.js';
import MongoStore from 'connect-mongo';
import BankSyncScheduler from './services/bankSyncScheduler.js';

// Importar configuración según el entorno
let config;
try {
  config = (await import('./config/config.js')).default;
} catch (error) {
  console.error('Error al cargar la configuración, usando configuración básica:', error.message);
  config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '8080', 10),
    mongoUrl: process.env.MONGO_PUBLIC_URL || process.env.MONGO_URL,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()) : ['http://localhost:3000'],
    sessionSecret: process.env.SESSION_SECRET || 'fallback_session_secret'
  };
}

// Logs de configuración removidos para producción

const app = express();

// Configurar trust proxy para trabajar con nginx
app.set('trust proxy', 1);

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Asegurar que corsOrigins sea un array y limpiar los valores
  let corsOrigins = [];
  if (Array.isArray(config.corsOrigins)) {
    corsOrigins = config.corsOrigins.map(origin => origin.trim());
  } else if (typeof config.corsOrigins === 'string') {
    corsOrigins = config.corsOrigins.split(',').map(origin => origin.trim());
  } else {
    corsOrigins = [config.frontendUrl];
  }

  // Log solo en staging/producción
  if (config.env !== 'development') {
    console.log('CORS Request:', {
      env: config.env,
      origin,
      method: req.method,
      path: req.path,
      allowedOrigins: corsOrigins,
      headers: req.headers
    });
  }

  // Permitir peticiones de GitHub para el webhook
  if (req.path === '/webhook') {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Hub-Signature-256');
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    return next();
  }

  // En desarrollo permitir cualquier origen, en otros ambientes solo los configurados
  if (config.env === 'development' || (origin && corsOrigins.includes(origin))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Cache-Control, Pragma');
    res.header('Vary', 'Origin');
  }

  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

// Middleware para verificar headers de respuesta solo en staging/producción
if (config.env !== 'development') {
  app.use((req, res, next) => {
    const oldJson = res.json;
    res.json = function(...args) {
      const headers = res.getHeaders();
      console.log('Response Headers:', {
        origin: headers['access-control-allow-origin'],
        methods: headers['access-control-allow-methods'],
        credentials: headers['access-control-allow-credentials'],
        vary: headers.vary
      });
      return oldJson.apply(res, args);
    };
    next();
  });
}

app.use(cookieParser(config.sessionSecret));

// Configuración de sesión
const sessionConfig = {
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
};

// En producción, usar MongoStore
if (config.env === 'production' || config.env === 'staging') {
  sessionConfig.store = MongoStore.create({
    mongoUrl: config.mongoUrl,
    ttl: 24 * 60 * 60, // 24 horas
    autoRemove: 'native',
    touchAfter: 24 * 3600 // 24 horas
  });
} else {
  // En desarrollo, usar MongoStore también para consistencia
  sessionConfig.store = MongoStore.create({
    mongoUrl: config.mongoUrl,
    ttl: 24 * 60 * 60,
    autoRemove: 'native'
  });
}

app.use(session(sessionConfig));

// Inicialización de Passport
app.use(passportConfig.initialize());
app.use(passportConfig.session());

// Logging middleware
if (config.isDev) {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date(),
    env: config.env,
    port: config.port,
    envPort: process.env.PORT
  });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api', router);
app.use('/webhook', webhookRoutes);

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: config.isDev ? err.message : 'Error interno del servidor'
  });
});

// Conexión a MongoDB e inicialización del servidor
const startServer = async () => {
  try {
    await connectDB();
    console.log('MongoDB conectado exitosamente');
    
    await initializeMonedas();
    console.log('Datos iniciales cargados');
    
    // Iniciar scheduler de sincronización bancaria
    const bankSyncScheduler = new BankSyncScheduler();
    bankSyncScheduler.start();
    console.log('Scheduler de sincronización bancaria iniciado');
    
    app.listen(config.port, '0.0.0.0', () => {
      // Asegurarse de que corsOrigins sea un array antes de usar join
      const corsOriginsStr = Array.isArray(config.corsOrigins) 
        ? config.corsOrigins.join(', ')
        : String(config.corsOrigins);
        
      console.log(`
=================================
🚀 Servidor iniciado
--------------------------------
🌍 Puerto: ${config.port}
🔧 Ambiente: ${config.env}
🔗 Frontend URL: ${config.frontendUrl}
🛡️ CORS: ${config.isDev ? 'Todos los orígenes (dev)' : corsOriginsStr}
🔗 Escuchando en: 0.0.0.0:${config.port}
=================================
      `);
    });
  } catch (error) {
    console.error('Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();