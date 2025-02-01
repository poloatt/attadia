import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const inventario = await prisma.inventario.findMany({
      where: { userId: req.user.id }
    });
    res.json(inventario || []); // Asegurar que siempre devuelva un array
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
});

export default router; 