import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const monedaSchema = createSchema({
  codigo: {
    type: String,
    required: true,
    trim: true,
    unique: true
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
  activa: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: () => ({})
  },
  ...commonFields
});

const Monedas = mongoose.model('Monedas', monedaSchema);

export { Monedas }; 