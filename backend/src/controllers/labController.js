import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getLabResults = async (req, res) => {
  try {
    const results = await prisma.labResult.findMany({
      where: { userId: req.user.id },
      orderBy: { fecha: 'desc' }
    });
    res.json(results);
  } catch (error) {
    console.error('Error al obtener resultados:', error);
    res.status(500).json({ error: 'Error al obtener resultados' });
  }
};

export const createLabResult = async (req, res) => {
  try {
    const result = await prisma.labResult.create({
      data: { ...req.body, userId: req.user.id }
    });
    res.status(201).json(result);
  } catch (error) {
    console.error('Error al crear resultado:', error);
    res.status(500).json({ error: 'Error al crear resultado' });
  }
}; 