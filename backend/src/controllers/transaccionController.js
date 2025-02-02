import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const transaccionController = {
  getAll: async (req, res) => {
    try {
      const transacciones = await prisma.transaccion.findMany({
        where: { userId: req.user.id },
        include: {
          moneda: true,
          cuenta: true
        },
        orderBy: { fecha: 'desc' }
      });
      res.json(transacciones);
    } catch (error) {
      console.error('Error al obtener transacciones:', error);
      res.status(500).json({ error: 'Error al obtener transacciones' });
    }
  },

  create: async (req, res) => {
    try {
      const { 
        descripcion, 
        monto, 
        fecha, 
        categoria, 
        estado, 
        monedaId, 
        cuentaId 
      } = req.body;

      // Log para debugging
      console.log('Datos recibidos:', {
        descripcion, 
        monto, 
        fecha, 
        categoria, 
        estado, 
        monedaId, 
        cuentaId,
        userId: req.user?.id
      });

      // Validaciones más específicas
      if (!descripcion) return res.status(400).json({ error: 'La descripción es requerida' });
      if (!monto) return res.status(400).json({ error: 'El monto es requerido' });
      if (!fecha) return res.status(400).json({ error: 'La fecha es requerida' });
      if (!categoria) return res.status(400).json({ error: 'La categoría es requerida' });
      if (!estado) return res.status(400).json({ error: 'El estado es requerido' });
      if (!monedaId) return res.status(400).json({ error: 'La moneda es requerida' });
      if (!cuentaId) return res.status(400).json({ error: 'La cuenta es requerida' });
      if (!req.user?.id) return res.status(401).json({ error: 'Usuario no autenticado' });

      const transaccion = await prisma.transaccion.create({
        data: {
          descripcion,
          monto: parseFloat(monto),
          fecha: new Date(fecha),
          categoria,
          estado,
          userId: req.user.id, // Cambiado de usuario a userId
          monedaId: parseInt(monedaId),
          cuentaId: parseInt(cuentaId)
        },
        include: {
          moneda: true,
          cuenta: true
        }
      });

      console.log('Transacción creada:', transaccion);
      res.status(201).json(transaccion);
    } catch (error) {
      console.error('Error detallado al crear transacción:', error);
      // Log más detallado del error
      if (error.code === 'P2002') {
        return res.status(400).json({ 
          error: 'Error de restricción única',
          details: error.meta 
        });
      }
      if (error.code === 'P2003') {
        return res.status(400).json({ 
          error: 'Error de restricción de clave foránea',
          details: error.meta 
        });
      }
      res.status(500).json({ 
        error: 'Error al crear transacción',
        details: error.message,
        code: error.code
      });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { monedaId, cuentaId, monto, descripcion, fecha, categoria, estado } = req.body;

      const transaccion = await prisma.transaccion.update({
        where: { 
          id,
          userId: req.user.id 
        },
        data: {
          monto: parseFloat(monto),
          descripcion,
          fecha: new Date(fecha),
          categoria,
          estado,
          moneda: { connect: { id: parseInt(monedaId) } },
          cuenta: { connect: { id: parseInt(cuentaId) } }
        },
        include: {
          moneda: true,
          cuenta: true
        }
      });

      res.json(transaccion);
    } catch (error) {
      console.error('Error al actualizar transacción:', error);
      res.status(500).json({ error: 'Error al actualizar transacción' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.transaccion.delete({
        where: { 
          id,
          userId: req.user.id 
        }
      });
      res.json({ message: 'Transacción eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar transacción:', error);
      res.status(500).json({ error: 'Error al eliminar transacción' });
    }
  },

  getStats: async (req, res) => {
    try {
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const transaccionesMes = await prisma.transaccion.findMany({
        where: {
          userId: req.user.id,
          fecha: {
            gte: inicioMes
          }
        }
      });

      const ingresosMensuales = transaccionesMes
        .filter(t => t.tipo === 'INGRESO')
        .reduce((sum, t) => sum + Number(t.monto), 0);

      const egresosMensuales = transaccionesMes
        .filter(t => t.tipo === 'EGRESO')
        .reduce((sum, t) => sum + Number(t.monto), 0);

      res.json({
        ingresosMensuales,
        egresosMensuales,
        balance: ingresosMensuales - egresosMensuales,
        monedaPrincipal: 'USD'
      });
    } catch (error) {
      console.error('Error en getStats transacciones:', error);
      res.status(500).json({ message: error.message });
    }
  }
}; 