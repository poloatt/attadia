import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const habitacionController = {
  getAll: async (req, res) => {
    try {
      const habitaciones = await prisma.habitacion.findMany({
        include: {
          propiedad: true
        }
      });
      res.json(habitaciones);
    } catch (error) {
      console.error('Error al obtener habitaciones:', error);
      res.status(500).json({ error: 'Error al obtener habitaciones' });
    }
  },

  create: async (req, res) => {
    try {
      const { nombre, descripcion, propiedadId } = req.body;
      const habitacion = await prisma.habitacion.create({
        data: {
          nombre,
          descripcion,
          propiedadId
        },
        include: {
          propiedad: true
        }
      });
      res.status(201).json(habitacion);
    } catch (error) {
      console.error('Error al crear habitación:', error);
      res.status(500).json({ error: 'Error al crear habitación' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, descripcion } = req.body;
      const habitacion = await prisma.habitacion.update({
        where: { id },
        data: {
          nombre,
          descripcion
        },
        include: {
          propiedad: true
        }
      });
      res.json(habitacion);
    } catch (error) {
      console.error('Error al actualizar habitación:', error);
      res.status(500).json({ error: 'Error al actualizar habitación' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.habitacion.delete({
        where: { id }
      });
      res.json({ message: 'Habitación eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar habitación:', error);
      res.status(500).json({ error: 'Error al eliminar habitación' });
    }
  }
}; 