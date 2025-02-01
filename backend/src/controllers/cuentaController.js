import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const cuentaController = {
  getAll: async (req, res) => {
    try {
      const cuentas = await prisma.cuenta.findMany({
        where: {
          usuarioId: req.user.id
        },
        include: {
          moneda: true
        },
        orderBy: {
          nombre: 'asc'
        }
      });
      res.json(cuentas);
    } catch (error) {
      console.error('Error al obtener cuentas:', error);
      res.status(500).json({ error: 'Error al obtener cuentas' });
    }
  },

  create: async (req, res) => {
    try {
      const { nombre, numero, tipo, monedaId } = req.body;
      const cuenta = await prisma.cuenta.create({
        data: {
          nombre,
          numero,
          tipo,
          usuarioId: req.user.id,
          monedaId
        },
        include: {
          moneda: true
        }
      });
      res.status(201).json(cuenta);
    } catch (error) {
      console.error('Error al crear cuenta:', error);
      res.status(500).json({ error: 'Error al crear cuenta' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, numero, tipo, monedaId } = req.body;
      
      const cuenta = await prisma.cuenta.update({
        where: { 
          id,
          usuarioId: req.user.id
        },
        data: {
          nombre,
          numero,
          tipo,
          monedaId
        },
        include: {
          moneda: true
        }
      });
      res.json(cuenta);
    } catch (error) {
      console.error('Error al actualizar cuenta:', error);
      res.status(500).json({ error: 'Error al actualizar cuenta' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.cuenta.delete({
        where: { 
          id,
          usuarioId: req.user.id
        }
      });
      res.json({ message: 'Cuenta eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar cuenta:', error);
      res.status(500).json({ error: 'Error al eliminar cuenta' });
    }
  }
}; 