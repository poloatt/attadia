import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const propiedadController = {
  // Obtener todas las propiedades
  getAll: async (req, res) => {
    try {
      const propiedades = await prisma.propiedad.findMany({
        include: {
          habitaciones: true,
        }
      });
      
      res.json(propiedades);
    } catch (error) {
      console.error('Error al obtener propiedades:', error);
      res.status(500).json({ error: 'Error al obtener las propiedades' });
    }
  },

  // Crear una nueva propiedad
  create: async (req, res) => {
    const { direccion, barrio, provincia, pais, cuentas } = req.body;

    try {
      const propiedad = await prisma.propiedad.create({
        data: {
          direccion,
          barrio,
          provincia,
          pais,
          cuentas: cuentas || []
        },
        include: {
          habitaciones: true
        }
      });
      
      res.status(201).json(propiedad);
    } catch (error) {
      console.error('Error al crear propiedad:', error);
      res.status(500).json({ error: 'Error al crear la propiedad' });
    }
  },

  // Obtener una propiedad por ID
  getOne: async (req, res) => {
    const { id } = req.params;

    try {
      const propiedad = await prisma.propiedad.findUnique({
        where: { id },
        include: {
          habitaciones: true
        }
      });

      if (!propiedad) {
        return res.status(404).json({ error: 'Propiedad no encontrada' });
      }

      res.json(propiedad);
    } catch (error) {
      console.error('Error al obtener propiedad:', error);
      res.status(500).json({ error: 'Error al obtener la propiedad' });
    }
  },

  // Actualizar una propiedad
  update: async (req, res) => {
    const { id } = req.params;
    const { direccion, barrio, provincia, pais, cuentas } = req.body;

    try {
      const propiedad = await prisma.propiedad.update({
        where: { id },
        data: {
          direccion,
          barrio,
          provincia,
          pais,
          cuentas
        },
        include: {
          habitaciones: true
        }
      });

      res.json(propiedad);
    } catch (error) {
      console.error('Error al actualizar propiedad:', error);
      res.status(500).json({ error: 'Error al actualizar la propiedad' });
    }
  },

  // Eliminar una propiedad
  delete: async (req, res) => {
    const { id } = req.params;

    try {
      await prisma.propiedad.delete({
        where: { id }
      });

      res.status(204).send();
    } catch (error) {
      console.error('Error al eliminar propiedad:', error);
      res.status(500).json({ error: 'Error al eliminar la propiedad' });
    }
  }
}; 