import express from 'express';
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const transacciones = await db('transacciones')
      .select('*')
      .orderBy('fecha', 'desc');
    
    res.json(transacciones);
  } catch (error) {
    console.error('Error fetching transacciones:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router; 