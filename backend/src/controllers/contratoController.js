import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const contratoController = {
  getAll: async (req, res) => {
    try {
      const contratos = await prisma.contrato.findMany({
        include: {
          propiedad: true,
          inquilino: true,
          moneda: true
        }
      });
      res.json(contratos);
    } catch (error) {
      console.error('Error al obtener contratos:', error);
      res.status(500).json({ error: 'Error al obtener contratos' });
    }
  },

  create: async (req, res) => {
    try {
      const { fechaInicio, fechaFin, montoAlquiler, deposito, estado, documentoUrl, propiedadId, inquilinoId, monedaId } = req.body;
      const contrato = await prisma.contrato.create({
        data: {
          fechaInicio: new Date(fechaInicio),
          fechaFin: fechaFin ? new Date(fechaFin) : null,
          montoAlquiler,
          deposito,
          estado,
          documentoUrl,
          propiedadId,
          inquilinoId,
          monedaId
        },
        include: {
          propiedad: true,
          inquilino: true,
          moneda: true
        }
      });
      res.status(201).json(contrato);
    } catch (error) {
      console.error('Error al crear contrato:', error);
      res.status(500).json({ error: 'Error al crear contrato' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { fechaInicio, fechaFin, montoAlquiler, deposito, estado, documentoUrl, propiedadId, inquilinoId, monedaId } = req.body;
      
      const contrato = await prisma.contrato.update({
        where: { id },
        data: {
          fechaInicio: new Date(fechaInicio),
          fechaFin: fechaFin ? new Date(fechaFin) : null,
          montoAlquiler,
          deposito,
          estado,
          documentoUrl,
          propiedadId,
          inquilinoId,
          monedaId
        },
        include: {
          propiedad: true,
          inquilino: true,
          moneda: true
        }
      });
      res.json(contrato);
    } catch (error) {
      console.error('Error al actualizar contrato:', error);
      res.status(500).json({ error: 'Error al actualizar contrato' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.contrato.delete({
        where: { id }
      });
      res.json({ message: 'Contrato eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar contrato:', error);
      res.status(500).json({ error: 'Error al eliminar contrato' });
    }
  },

  getActivos: async (req, res) => {
    try {
      const contratos = await prisma.contrato.findMany({
        where: {
          AND: [
            { estado: 'ACTIVO' },
            {
              propiedad: {
                usuarioId: req.user.id
              }
            }
          ]
        },
        include: {
          inquilino: true,
          propiedad: true,
          moneda: true
        }
      });
      res.json(contratos);
    } catch (error) {
      console.error('Error al obtener contratos activos:', error);
      res.status(500).json({ error: 'Error al obtener contratos activos' });
    }
  }
}; 