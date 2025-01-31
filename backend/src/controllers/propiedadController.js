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
        select: {
          id: true,
          titulo: true,
          descripcion: true,
          precio: true,
          direccion: true,
          ciudad: true,
          estado: true,
          tipo: true,
          numHabitaciones: true,
          banos: true,
          metrosCuadrados: true,
          imagen: true,
          cuentas: true,
          createdAt: true,
          updatedAt: true
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
        imagen
      } = req.body;

      const propiedad = await prisma.propiedad.create({
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
          cuentas: req.body.cuentas || [],
          usuario: {
            connect: { id: req.user.id }
          }
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