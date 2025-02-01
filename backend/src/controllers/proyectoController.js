import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getProyectos = async (req, res) => {
  try {
    const proyectos = await prisma.proyecto.findMany({
      where: { userId: req.user.id },
      include: { tareas: true }
    });
    res.json(proyectos);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ error: 'Error al obtener proyectos' });
  }
};

export const createProyecto = async (req, res) => {
  try {
    const proyecto = await prisma.proyecto.create({
      data: { ...req.body, userId: req.user.id }
    });
    res.status(201).json(proyecto);
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    res.status(500).json({ error: 'Error al crear proyecto' });
  }
}; 