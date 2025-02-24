import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import { passportConfig } from './config/passport.js';
import { router } from './routes/index.js';
import morgan from 'morgan';
import connectDB from './config/database/mongodb.js';
import { initializeMonedas } from './config/initData.js';
import config from './config/config.js';

const app = express();
const server = createServer(app);

// Middleware
app.use(cors({
  origin: config.corsOrigins,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de sesión
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.env === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Rutas
app.use('/api', routes);

// Conectar a MongoDB
connectDB();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: config.env });
});

const PORT = config.port || 5000;

server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  console.log(`Ambiente: ${config.env}`);
  console.log(`CORS habilitado para: ${config.corsOrigins.join(', ')}`);
});