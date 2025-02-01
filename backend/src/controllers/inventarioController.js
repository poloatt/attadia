import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getInventario = async (req, res) => {
  try {
    const inventario = await prisma.inventario.findMany({
      where: { userId: req.user.id }
    });
    res.json(inventario);
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
};

export const createInventario = async (req, res) => {
  try {
    const item = await prisma.inventario.create({
      data: { ...req.body, userId: req.user.id }
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error al crear item:', error);
    res.status(500).json({ error: 'Error al crear item' });
  }
}; 