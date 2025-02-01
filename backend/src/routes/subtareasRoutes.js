import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/:tareaId', authMiddleware, async (req, res) => {
  try {
    const subtareas = await prisma.subtarea.findMany({
      where: { tareaId: parseInt(req.params.tareaId) }
    });
    res.json(subtareas);
  } catch (error) {
    console.error('Error al obtener subtareas:', error);
    res.status(500).json({ error: 'Error al obtener subtareas' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const subtarea = await prisma.subtarea.create({
      data: req.body
    });
    res.status(201).json(subtarea);
  } catch (error) {
    console.error('Error al crear subtarea:', error);
    res.status(500).json({ error: 'Error al crear subtarea' });
  }
});

export default router; 