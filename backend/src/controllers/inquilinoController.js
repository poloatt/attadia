import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const inquilinoController = {
  getAll: async (req, res) => {
    try {
      const inquilinos = await prisma.inquilino.findMany({
        include: {
          contratos: {
            include: {
              propiedad: true
            }
          }
        },
        orderBy: {
          nombre: 'asc'
        }
      });
      res.json(inquilinos);
    } catch (error) {
      console.error('Error al obtener inquilinos:', error);
      res.status(500).json({ error: 'Error al obtener inquilinos' });
    }
  },

  create: async (req, res) => {
    try {
      const { nombre, dni, email, telefono } = req.body;
      const inquilino = await prisma.inquilino.create({
        data: {
          nombre,
          dni,
          email,
          telefono
        }
      });
      res.status(201).json(inquilino);
    } catch (error) {
      console.error('Error al crear inquilino:', error);
      res.status(500).json({ error: 'Error al crear inquilino' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, dni, email, telefono } = req.body;
      const inquilino = await prisma.inquilino.update({
        where: { id },
        data: {
          nombre,
          dni,
          email,
          telefono
        }
      });
      res.json(inquilino);
    } catch (error) {
      console.error('Error al actualizar inquilino:', error);
      res.status(500).json({ error: 'Error al actualizar inquilino' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.inquilino.delete({
        where: { id }
      });
      res.json({ message: 'Inquilino eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar inquilino:', error);
      res.status(500).json({ error: 'Error al eliminar inquilino' });
    }
  }
}; 