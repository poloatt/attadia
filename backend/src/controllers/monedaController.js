import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const monedaController = {
  getAll: async (req, res) => {
    try {
      const monedas = await prisma.moneda.findMany({
        orderBy: {
          nombre: 'asc'
        }
      });
      res.json(monedas);
    } catch (error) {
      console.error('Error al obtener monedas:', error);
      res.status(500).json({ error: 'Error al obtener monedas' });
    }
  },

  create: async (req, res) => {
    try {
      const { codigo, nombre, simbolo } = req.body;

      // Verificar si ya existe una moneda con ese código
      const existingMoneda = await prisma.moneda.findUnique({
        where: { codigo }
      });

      if (existingMoneda) {
        return res.status(400).json({ 
          error: `Ya existe una moneda con el código ${codigo}` 
        });
      }

      const moneda = await prisma.moneda.create({
        data: {
          codigo,
          nombre,
          simbolo
        }
      });

      res.status(201).json(moneda);
    } catch (error) {
      console.error('Error al crear moneda:', error);
      res.status(500).json({ 
        error: 'Error al crear la moneda',
        details: error.message 
      });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { codigo, nombre, simbolo } = req.body;
      const moneda = await prisma.moneda.update({
        where: { id },
        data: {
          codigo,
          nombre,
          simbolo
        }
      });
      res.json(moneda);
    } catch (error) {
      console.error('Error al actualizar moneda:', error);
      res.status(500).json({ error: 'Error al actualizar moneda' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.moneda.delete({
        where: { id }
      });
      res.json({ message: 'Moneda eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar moneda:', error);
      res.status(500).json({ error: 'Error al eliminar moneda' });
    }
  }
}; 