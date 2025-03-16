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
switch (process.env.NODE_ENV) {
  case 'production':
    config = (await import('./config/config.js')).default;
    break;
  case 'staging':
    config = (await import('./config/config.staging.js')).default;
    break;
  case 'development':
  default:
    config = (await import('./config/config.dev.js')).default;
    break;
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

// Configuración de CORS
const corsOptions = {
  origin: function(origin, callback) {
    // Lista de dominios permitidos
    const allowedOrigins = [
      config.frontendUrl,
      'https://present.attadia.com',
      'https://api.present.attadia.com',
      'https://staging.present.attadia.com',
      'https://api.staging.present.attadia.com',
      'http://localhost:5173',
      'http://localhost:5000'
    ];
    
    // Permitir solicitudes sin origen (como aplicaciones móviles o curl)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Origen bloqueado por CORS: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
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