import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// La ruta base será '/' ya que '/health' se especifica en el index.js
router.get('/', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      backend: 'running'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      backend: 'running'
    });
  }
});

export default router; 