import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const rutinas = await prisma.rutina.findMany({
      where: { userId: req.user.id },
      orderBy: { fecha: 'desc' }
    });
    res.json(rutinas || []);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener rutinas' });
  }
});

export default router; 