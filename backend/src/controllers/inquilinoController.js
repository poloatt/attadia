import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const inquilinoController = {
  getAll: async (req, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const inquilinos = await prisma.inquilino.findMany({
        where: {
          usuarioId: req.user.id
        },
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
      const { nombre, apellido, dni, email, telefono } = req.body;
      const inquilino = await prisma.inquilino.create({
        data: {
          nombre,
          apellido,
          dni,
          email,
          telefono,
          estado: "ACTIVO",
          usuarioId: req.user.id
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
      const { nombre, apellido, dni, email, telefono } = req.body;
      const inquilino = await prisma.inquilino.update({
        where: { 
          id,
          usuarioId: req.user.id
        },
        data: {
          nombre,
          apellido,
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
        where: { 
          id,
          usuarioId: req.user.id
        }
      });
      res.json({ message: 'Inquilino eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar inquilino:', error);
      res.status(500).json({ error: 'Error al eliminar inquilino' });
    }
  },

  getActivos: async (req, res) => {
    try {
      const inquilinos = await prisma.inquilino.findMany({
        where: {
          estado: 'ACTIVO',
          usuarioId: req.user.id
        },
        include: {
          contratos: {
            include: {
              propiedad: true
            }
          }
        }
      });
      res.json(inquilinos);
    } catch (error) {
      console.error('Error al obtener inquilinos activos:', error);
      res.status(500).json({ 
        error: 'Error al obtener inquilinos activos',
        details: error.message 
      });
    }
  }
}; 