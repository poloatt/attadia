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
import autoSyncService from './services/autoSyncService.js';
import mongoose from 'mongoose';

// Importar configuración según el entorno
let config;
try {
  config = (await import('./config/config.js')).default;
  console.log('✅ Configuración principal cargada correctamente:', { frontendUrl: config.frontendUrl, corsOrigins: config.corsOrigins });
} catch (error) {
  console.error('❌ Error al cargar la configuración, usando configuración básica:', error.message);
  config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '8080', 10),
    mongoUrl: process.env.MONGO_PUBLIC_URL || process.env.MONGO_URL,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()) : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    sessionSecret: process.env.SESSION_SECRET || 'fallback_session_secret'
  };
  console.log('⚠️ Usando configuración FALLBACK:', { frontendUrl: config.frontendUrl, corsOrigins: config.corsOrigins });
}

// Logs de configuración removidos para producción

const app = express();

// Configurar trust proxy para trabajar con nginx
app.set('trust proxy', 1);

// Manejo de errores no capturados - CRÍTICO para evitar reinicios en Render
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
  // Loggear stack trace si está disponible
  if (reason instanceof Error) {
    console.error('Stack:', reason.stack);
  }
  // NO hacer process.exit() aquí para evitar reinicios innecesarios en Render
  // Render reiniciará automáticamente si el proceso termina, así que mejor mantenerlo vivo
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  
  // Solo hacer exit en casos realmente críticos
  // Dar tiempo para que los logs se escriban antes de terminar
  // IMPORTANTE: Render reiniciará automáticamente, así que solo salir en casos extremos
  setTimeout(() => {
    console.error('⚠️ Terminando proceso debido a excepción no capturada...');
    process.exit(1);
  }, 2000); // Aumentado a 2 segundos para dar más tiempo a los logs
});

// Prevenir que el proceso se cierre por señales no manejadas
process.on('SIGTERM', () => {
  // Loggear solo en desarrollo para reducir ruido en producción
  if (config.isDev) {
    console.log('📴 Recibida señal SIGTERM - cerrando servidor gracefully...');
  }
  // Dar tiempo para que las conexiones se cierren
  setTimeout(() => {
    process.exit(0);
  }, 5000);
});

process.on('SIGINT', () => {
  // Loggear solo en desarrollo para reducir ruido en producción
  if (config.isDev) {
    console.log('📴 Recibida señal SIGINT - cerrando servidor gracefully...');
  }
  setTimeout(() => {
    process.exit(0);
  }, 5000);
});

// Middleware de debug para capturar peticiones problemáticas (solo para debugging)
// Comentado temporalmente para evitar interferir con el parsing de JSON
/*
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      if (chunks.length > 0) {
        const rawBody = Buffer.concat(chunks).toString('utf8');
        console.log('🔍 DEBUG JSON PARSING:');
        console.log('  Method:', req.method);
        console.log('  Path:', req.path);
        console.log('  Content-Type:', req.headers['content-type']);
        console.log('  Raw Body Length:', rawBody.length);
        console.log('  Raw Body:', JSON.stringify(rawBody));
        console.log('  Raw Body (hex):', Buffer.concat(chunks).toString('hex'));
      }
      next();
    });
  } else {
    next();
  }
});
*/

// Middleware para limitar tamaño de body y prevenir problemas con PWA
app.use(express.json({
  strict: true,
  limit: '10mb' // Límite razonable para prevenir problemas
}));
app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb'
}));

// Manejar errores de parsing JSON de forma más amigable (debe ir justo después de express.json)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    // Error de parsing JSON - puede ser "null" como string u otro formato inválido
    const bodyStr = err.body?.toString() || '';
    if (bodyStr.trim() === 'null' || bodyStr.trim() === '') {
      // Si es "null" o vacío, tratar como body vacío y continuar sin error
      req.body = {};
      return next();
    }
    // Para otros errores de JSON, retornar error 400
    return res.status(400).json({ 
      error: 'JSON inválido en el body de la petición',
      details: config.isDev ? err.message : undefined
    });
  }
  next(err);
});

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
  
  // Filtrar api.attadia.com de los CORS origins (el backend no necesita CORS para sí mismo)
  corsOrigins = corsOrigins.filter(origin => {
    const cleaned = origin.trim();
    // Excluir el backend URL y variaciones
    return cleaned && 
           !cleaned.includes('api.attadia.com') && 
           !cleaned.includes(config.backendUrl?.replace('https://', '').replace('http://', ''));
  });

  // En desarrollo, agregar explícitamente localhost:5173 si no está presente
  if (config.env === 'development' && !corsOrigins.includes('http://localhost:5173')) {
    corsOrigins.push('http://localhost:5173');
  }

  // Log para debug en desarrollo
  if (config.env === 'development') {
    console.log('🔍 CORS DEBUG:', {
      origin,
      method: req.method,
      path: req.path,
      allowedOrigins: corsOrigins,
      isAllowed: origin && corsOrigins.includes(origin)
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
  // También permitir dominios de Vercel automáticamente
  const isVercelDomain = origin && origin.includes('vercel.app');
  const isAllowedOrigin = config.env === 'development' || 
                         (origin && corsOrigins.includes(origin)) || 
                         isVercelDomain;
  
  // Permitir peticiones sin origin (como health checks de Render)
  const isRequestWithoutOrigin = !origin;
  
  if (isAllowedOrigin || isRequestWithoutOrigin) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Cache-Control, Pragma, X-Device-Type');
    res.header('Vary', 'Origin');
  } else {
    // Log cuando se rechaza una petición CORS
    console.log('❌ CORS REJECTED:', {
      origin,
      method: req.method,
      path: req.path,
      allowedOrigins: corsOrigins
    });
  }

  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

// Función helper para determinar si se debe loggear
const shouldLogDebug = () => {
  return process.env.NODE_ENV === 'development' || 
         process.env.DEBUG_LOGS === 'true';
};

// Middleware para verificar headers de respuesta solo en desarrollo o con DEBUG_LOGS
if (shouldLogDebug()) {
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
    sameSite: 'lax'
  }
};

// En producción, usar MongoStore
if (config.env === 'production') {
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

// Health check robusto para Render y otros servicios
// Render hace health checks automáticos - este endpoint debe responder siempre
// CRÍTICO: Siempre responder con 200 RÁPIDAMENTE para evitar reinicios automáticos
// Este endpoint debe ser lo más rápido posible para evitar que Render piense que el servicio está caído
app.get('/health', (req, res) => {
  // Responder INMEDIATAMENTE sin bloqueos
  // No hacer operaciones pesadas aquí para evitar timeouts
  try {
    // Verificar MongoDB de forma no bloqueante
    const mongoStatus = mongoose.connection.readyState;
    const mongoConnected = mongoStatus === 1; // 1 = connected
    
    // Respuesta mínima y rápida en producción
    const health = config.isDev ? {
      status: mongoConnected ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      env: config.env,
      port: config.port,
      mongo: {
        connected: mongoConnected,
        readyState: mongoStatus
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    } : {
      status: mongoConnected ? 'ok' : 'degraded',
      timestamp: new Date().toISOString()
    };
    
    // Responder con 200 INMEDIATAMENTE - no hacer operaciones pesadas
    // Render reiniciará si el health check falla o tarda demasiado
    res.status(200).json(health);
  } catch (error) {
    // En caso de error, responder con 200 INMEDIATAMENTE para evitar reinicios
    // Loggear solo en desarrollo para reducir ruido
    if (config.isDev) {
      console.error('❌ Error en health check:', error.message);
    }
    res.status(200).json({
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }
});

// Health check adicional en la raíz para Render (algunos servicios lo requieren)
app.get('/', (req, res) => {
  // Si es un health check de Render (User-Agent típico de Render)
  const isHealthCheck = req.headers['user-agent']?.includes('Render') || 
                        req.path === '/' && Object.keys(req.query).length === 0;
  
  if (isHealthCheck) {
    // Redirigir al health check real
    return res.redirect('/health');
  }
  
  // Para otras peticiones, responder con información básica
  res.status(200).json({
    service: 'Attadia API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api', router);
app.use('/webhook', webhookRoutes);

// Manejo de errores global (debe ir al final, después de todas las rutas)
app.use((err, req, res, next) => {
  // Si ya se manejó el error (response enviada), pasar al siguiente
  if (res.headersSent) {
    return next(err);
  }
  
  console.error('Error:', err);
  
  // Errores de parsing JSON ya fueron manejados arriba
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return; // Ya se manejó
  }
  
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
    // Producción: siempre activado. Desarrollo: activable con BANK_SYNC_DEV=1
    const enableBankSyncDev = process.env.BANK_SYNC_DEV === '1' || process.env.BANK_SYNC_DEV === 'true' ||
                              process.env.MP_DEV === '1' || process.env.MP_DEV === 'true';
    if (config.env === 'production' || enableBankSyncDev) {
      const bankSyncScheduler = new BankSyncScheduler();
      bankSyncScheduler.start();
      console.log(`Scheduler de sincronización bancaria iniciado${config.env !== 'production' ? ' (DEV)' : ''}`);
    } else {
      console.log('⚠️ Bank Sync DESACTIVADO en desarrollo (setea BANK_SYNC_DEV=1 para habilitar)');
    }
    
    // Iniciar servicio de sincronización automática de Google Tasks SOLO en producción
    if (config.env === 'production') {
      autoSyncService.start();
      console.log('Servicio de sincronización automática de Google Tasks iniciado');
    } else {
      console.log('⚠️ Google Tasks AutoSync DESACTIVADO en desarrollo para reducir logs');
    }
    
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