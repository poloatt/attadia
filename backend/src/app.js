import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import healthRouter from './routes/health.js';
import propiedadRoutes from './routes/propiedadRoutes.js';
import authRoutes from './routes/auth.routes.js';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import './config/passport.js';  // Importar configuración de passport

const app = express();
const prisma = new PrismaClient();

// 1. Cookie parser primero
app.use(cookieParser());

// 2. CORS después
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept']
}));

// 3. JSON parser
app.use(express.json());

// Guardar instancia de prisma en app
app.set('prisma', prisma);

// 4. Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Body:', req.body);
  console.log('Cookies:', req.cookies);  // Agregar log de cookies
  next();
});

// Configurar passport después de cookie-parser
app.use(passport.initialize());

// Rutas
app.use('/api/health', healthRouter);
app.use('/api/propiedades', propiedadRoutes);
app.use('/api/auth', authRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app; 