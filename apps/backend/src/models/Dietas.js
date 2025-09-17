import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const dietaSchema = createSchema({
  tipo: {
    type: String,
    required: true
  },
  calorias: {
    type: Number,
    required: true
  },
  proteinas: {
    type: Number,
    required: true
  },
  carbohidratos: {
    type: Number,
    required: true
  },
  grasas: {
    type: Number,
    required: true
  },
  notas: {
    type: String
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  ...commonFields
});

export const Dietas = mongoose.model('Dietas', dietaSchema); 