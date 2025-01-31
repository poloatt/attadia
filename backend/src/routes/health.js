import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// La ruta base será '/' ya que '/health' se especifica en el index.js
router.get('/', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    await prisma.$queryRaw`SELECT 1`;
    
    // Simplificamos la respuesta
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 