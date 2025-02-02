import express from 'express';
import { getHealth } from '../controllers/healthController.js';

const router = express.Router();

// Cache para almacenar la última respuesta
let healthCache = null;
let lastCheck = 0;
const CACHE_DURATION = 5000; // 5 segundos

// Middleware de caché
const cacheMiddleware = (req, res, next) => {
  const now = Date.now();
  if (healthCache && (now - lastCheck) < CACHE_DURATION) {
    return res.json(healthCache);
  }
  next();
};

router.get('/', cacheMiddleware, async (req, res) => {
  try {
    const health = await getHealth();
    healthCache = health;
    lastCheck = Date.now();
    res.json(health);
  } catch (error) {
    console.error('Error en health check:', error);
    res.status(500).json({ error: 'Error checking health' });
  }
});

export default router; 