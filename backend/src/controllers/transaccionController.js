import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getTransacciones = async (req, res) => {
  try {
    const transacciones = await prisma.transaccion.findMany({
      where: {
        userId: req.user.id
      },
      orderBy: {
        fecha: 'desc'
      }
    });
    
    res.json(transacciones);
  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    res.status(500).json({ 
      error: 'Error al obtener transacciones',
      details: error.message 
    });
  }
};

export const createTransaccion = async (req, res) => {
  try {
    const transaccion = await prisma.transaccion.create({
      data: {
        ...req.body,
        userId: req.user.id
      }
    });
    
    res.status(201).json(transaccion);
  } catch (error) {
    console.error('Error al crear transacción:', error);
    res.status(500).json({ 
      error: 'Error al crear transacción',
      details: error.message 
    });
  }
}; 