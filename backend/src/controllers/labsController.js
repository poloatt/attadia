import { Labs } from '../models/Labs.js';

export const labsController = {
  getAll: async (req, res) => {
    try {
      const resultados = await Labs.find({ usuario: req.user.id })
        .sort({ fecha: -1 });
      res.json(resultados);
    } catch (error) {
      console.error('Error al obtener resultados:', error);
      res.status(500).json({ msg: 'Hubo un error al obtener los resultados' });
    }
  },

  create: async (req, res) => {
    try {
      const { tipo, valor, unidad, notas } = req.body;
      console.log('Datos recibidos:', req.body);
      console.log('Usuario:', req.user);

      const nuevoResultado = new Labs({
        tipo,
        valor: Number(valor),
        unidad,
        notas,
        usuario: req.user.id
      });

      console.log('Nuevo resultado a guardar:', nuevoResultado);

      await nuevoResultado.save();
      res.json(nuevoResultado);
    } catch (error) {
      console.error('Error al crear resultado:', error);
      res.status(500).json({ msg: 'Hubo un error al crear el resultado', error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const resultado = await Labs.findById(req.params.id);
      if (!resultado) {
        return res.status(404).json({ msg: 'Resultado no encontrado' });
      }
      res.json(resultado);
    } catch (error) {
      console.error('Error al obtener resultado:', error);
      res.status(500).json({ msg: 'Hubo un error al obtener el resultado' });
    }
  },

  update: async (req, res) => {
    try {
      const { tipo, valor, unidad, notas } = req.body;
      const resultado = await Labs.findByIdAndUpdate(
        req.params.id,
        { tipo, valor, unidad, notas },
        { new: true }
      );
      if (!resultado) {
        return res.status(404).json({ msg: 'Resultado no encontrado' });
      }
      res.json(resultado);
    } catch (error) {
      console.error('Error al actualizar resultado:', error);
      res.status(500).json({ msg: 'Hubo un error al actualizar el resultado' });
    }
  },

  delete: async (req, res) => {
    try {
      const resultado = await Labs.findByIdAndDelete(req.params.id);
      if (!resultado) {
        return res.status(404).json({ msg: 'Resultado no encontrado' });
      }
      res.json({ msg: 'Resultado eliminado' });
    } catch (error) {
      console.error('Error al eliminar resultado:', error);
      res.status(500).json({ msg: 'Hubo un error al eliminar el resultado' });
    }
  }
};