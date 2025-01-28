import express from 'express';
const router = express.Router();

// La ruta base será '/' ya que '/health' se especifica en el index.js
router.get('/', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 