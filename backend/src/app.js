import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import healthRouter from './routes/health.js';
import transaccionesRouter from './routes/transacciones.js';

const app = express();
const prisma = new PrismaClient();

// Configuración de CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://tudominio.com' 
    : ['http://localhost:5173', 'http://127.0.0.1:5173']
}));

app.use(express.json());

// Guardar instancia de prisma en app
app.set('prisma', prisma);

// Rutas
app.use('/health', healthRouter);
app.use('/api/transacciones', transaccionesRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app; 