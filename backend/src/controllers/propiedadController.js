import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const propiedadController = {
  // Obtener todas las propiedades
  getAll: async (req, res) => {
    try {
      console.log('GET /api/propiedades - Request recibido');
      console.log('Usuario:', req.user?.id);
      
      const propiedades = await prisma.propiedad.findMany({
        where: {
          usuarioId: req.user.id
        },
        include: {
          contratos: true,
          inventarios: true,
          habitaciones: true,
          transacciones: true,
          inquilinos: true,
          moneda: true,
          cuenta: true
        }
      });
      
      console.log('Propiedades encontradas:', propiedades.length);
      res.json(propiedades);
    } catch (error) {
      console.error('Error en getAll propiedades:', error);
      res.status(500).json({ error: 'Error al obtener propiedades' });
    }
  },

  // Crear una nueva propiedad
  create: async (req, res) => {
    try {
      const { moneda: monedaId, cuenta: cuentaId, ...datos } = req.body;

      const propiedad = await prisma.propiedad.create({
        data: {
          ...datos,
          moneda: {
            connect: { 
              id: parseInt(monedaId)
            }
          },
          cuenta: {
            connect: { 
              id: parseInt(cuentaId)
            }
          },
          usuario: {
            connect: { 
              id: req.user.id 
            }
          }
        },
        include: {
          moneda: true,
          cuenta: true
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
    const {
      titulo,
      descripcion,
      precio,
      direccion,
      ciudad,
      estado,
      tipo,
      numHabitaciones,
      banos,
      metrosCuadrados,
      imagen,
      cuentas
    } = req.body;

    try {
      const propiedad = await prisma.propiedad.update({
        where: { id },
        data: {
          titulo,
          descripcion,
          precio: parseFloat(precio),
          direccion,
          ciudad,
          estado,
          tipo,
          numHabitaciones: parseInt(numHabitaciones),
          banos: parseInt(banos),
          metrosCuadrados: parseFloat(metrosCuadrados),
          imagen,
          cuentas: cuentas || []
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