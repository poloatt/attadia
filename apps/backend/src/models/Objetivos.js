import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const objetivoSchema = createSchema({
  titulo: {
    type: String,
    required: true
  },
  descripcion: String,
  tipo: {
    type: String,
    enum: ['FINANCIERO', 'MANTENIMIENTO', 'OCUPACION', 'MEJORA', 'OTRO'],
    required: true
  },
  estado: {
    type: String,
    enum: ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO'],
    default: 'PENDIENTE'
  },
  fechaInicio: {
    type: Date,
    required: true,
    default: Date.now
  },
  fechaObjetivo: {
    type: Date,
    required: true
  },
  metrica: {
    actual: Number,
    objetivo: Number,
    unidad: String
  },
  propiedad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Propiedades'
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  ...commonFields
});

export const Objetivos = mongoose.model('Objetivos', objetivoSchema); 