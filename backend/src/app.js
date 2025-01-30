import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import healthRouter from './routes/health.js';
import propiedadRoutes from './routes/propiedadRoutes.js';
import authRoutes from './routes/auth.routes.js';
import cookieParser from 'cookie-parser';

const app = express();
const prisma = new PrismaClient();

app.use(cookieParser());

// Configuración de CORS más permisiva para desarrollo
app.use(cors({
  origin: ['http://localhost:5173', 'http://frontend:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']
}));

app.use(express.json());

// Guardar instancia de prisma en app
app.set('prisma', prisma);

// Rutas
app.use('/health', healthRouter);
app.use('/api/propiedades', propiedadRoutes);
app.use('/auth', authRoutes);

// Agregar un middleware de logging para debug
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Body:', req.body);
  next();
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app; 