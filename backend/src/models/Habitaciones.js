import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const habitacionSchema = createSchema({
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
    enum: ['INDIVIDUAL', 'DOBLE', 'SUITE', 'ESTUDIO'],
    required: true
  },
  estado: {
    type: String,
    enum: ['DISPONIBLE', 'OCUPADA', 'MANTENIMIENTO', 'RESERVADA'],
    default: 'DISPONIBLE'
  },
  capacidad: {
    type: Number,
    required: true
  },
  descripcion: String,
  caracteristicas: [String],
  imagenes: [String],
  ...commonFields
});

export const Habitaciones = mongoose.model('Habitaciones', habitacionSchema); 