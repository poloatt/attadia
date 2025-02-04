import mongoose from 'mongoose';

const habitacionSchema = new mongoose.Schema({
  propiedad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Propiedades',
    required: true
  },
  numero: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['DORMITORIO', 'BAÑO', 'COCINA', 'SALA', 'OTRO'],
    required: true
  },
  estado: {
    type: String,
    enum: ['DISPONIBLE', 'OCUPADA', 'MANTENIMIENTO'],
    default: 'DISPONIBLE'
  },
  descripcion: String,
  caracteristicas: [String],
  imagenes: [String]
}, {
  timestamps: true
});

export const Habitaciones = mongoose.model('Habitaciones', habitacionSchema); 