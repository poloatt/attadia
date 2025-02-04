import mongoose from 'mongoose';

const inventarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  descripcion: String,
  cantidad: {
    type: Number,
    required: true,
    default: 0
  },
  categoria: String,
  ubicacion: String,
  estado: {
    type: String,
    enum: ['DISPONIBLE', 'EN_USO', 'MANTENIMIENTO', 'BAJA'],
    default: 'DISPONIBLE'
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  propiedad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Propiedades'
  }
}, {
  timestamps: true
});

export const Inventarios = mongoose.model('Inventarios', inventarioSchema); 