const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// La ruta base será '/' ya que '/health' se especifica en el index.js
router.get('/', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'ok',
      api: 'connected',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      api: 'connected',
      database: 'disconnected',
      message: 'Database connection failed'
    });
  }
});

module.exports = router; 