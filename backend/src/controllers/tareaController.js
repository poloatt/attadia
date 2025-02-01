import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getTareas = async (req, res) => {
  try {
    const tareas = await prisma.tarea.findMany({
      where: { proyecto: { userId: req.user.id } },
      include: { subtareas: true }
    });
    res.json(tareas);
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
};

export const createTarea = async (req, res) => {
  try {
    const tarea = await prisma.tarea.create({
      data: { ...req.body }
    });
    res.status(201).json(tarea);
  } catch (error) {
    console.error('Error al crear tarea:', error);
    res.status(500).json({ error: 'Error al crear tarea' });
  }
}; 