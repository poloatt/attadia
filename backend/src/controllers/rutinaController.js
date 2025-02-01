import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getRutinas = async (req, res) => {
  try {
    const rutinas = await prisma.rutina.findMany({
      where: { userId: req.user.id },
      orderBy: { fecha: 'desc' }
    });
    res.json(rutinas);
  } catch (error) {
    console.error('Error al obtener rutinas:', error);
    res.status(500).json({ error: 'Error al obtener rutinas' });
  }
};

export const createRutina = async (req, res) => {
  try {
    const rutina = await prisma.rutina.create({
      data: { ...req.body, userId: req.user.id }
    });
    res.status(201).json(rutina);
  } catch (error) {
    console.error('Error al crear rutina:', error);
    res.status(500).json({ error: 'Error al crear rutina' });
  }
}; 