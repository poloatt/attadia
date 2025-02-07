import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const monedaSchema = createSchema({
  codigo: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  simbolo: {
    type: String,
    required: true,
    trim: true
  },
  tasaCambio: {
    type: Number,
    required: true,
    default: 1
  },
  activa: {
    type: Boolean,
    default: true
  },
  ...commonFields
});

export const Monedas = mongoose.model('Moneda', monedaSchema); 