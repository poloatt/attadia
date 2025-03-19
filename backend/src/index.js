import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { passportConfig } from './config/passport.js';
import { router } from './routes/index.js';
import authRoutes from './routes/authRoutes.js';
import morgan from 'morgan';
import connectDB from './config/database/mongodb.js';
import { initializeMonedas } from './config/initData.js';
import MongoStore from 'connect-mongo';

// Importar configuración según el entorno
let config;
try {
  switch (process.env.NODE_ENV) {
    case 'production':
      config = (await import('./config/config.js')).default;
      break;
    case 'staging':
      config = (await import('./config/config.js')).default;
      break;
    case 'development':
    default:
      config = (await import('./config/config.js')).default;
      break;
  }
} catch (error) {
  console.error('Error al cargar la configuración, usando configuración básica:', error.message);
  // Configuración básica por defecto
  const defaultCorsOrigins = 'https://staging.present.attadia.com,https://api.staging.present.attadia.com';
  config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    mongoUrl: process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://mongodb-staging:27017/present?authSource=admin',
    frontendUrl: process.env.FRONTEND_URL || 'https://staging.present.attadia.com',
    corsOrigins: Array.from(new Set((process.env.CORS_ORIGINS || defaultCorsOrigins).split(',').map(origin => origin.trim()))),
    sessionSecret: process.env.SESSION_SECRET || 'fallback_session_secret'
  };
}

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

// Configuración manual de CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = config.env === 'development' 
    ? [origin] // En desarrollo, permitir cualquier origen
    : [ // En staging/producción, solo orígenes específicos
        'https://staging.present.attadia.com',
        'https://api.staging.present.attadia.com'
      ];

  // Log detallado para debugging solo en staging/producción
  if (config.env !== 'development') {
    console.log('CORS Request:', {
      origin,
      method: req.method,
      path: req.path,
      headers: req.headers
    });
  }

  // En desarrollo, permitir cualquier origen. En staging/producción, verificar la lista
  if (config.env === 'development' || (origin && allowedOrigins.includes(origin))) {
    if (config.env !== 'development') {
      console.log(`CORS: Permitiendo origen ${origin}`);
    }
    
    // Establecer headers CORS
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Vary', 'Origin');

    // Para requests OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
  } else if (config.env !== 'development') {
    console.log(`CORS: Origen no permitido ${origin}`);
  }

  next();
});

// Middleware para verificar headers de respuesta solo en staging/producción
if (config.env !== 'development') {
  app.use((req, res, next) => {
    const oldJson = res.json;
    res.json = function(...args) {
      console.log('Response Headers:', res.getHeaders());
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
    env: config.env
  });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api', router);

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
    console.log('MongoDB conectado exitosamente a mongodb-staging');
    console.log('MongoDB conectado exitosamente');
    
    await initializeMonedas();
    console.log('Datos iniciales cargados');
    
    app.listen(config.port, () => {
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
=================================
      `);
    });
  } catch (error) {
    console.error('Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();