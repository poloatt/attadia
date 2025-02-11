import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const labSchema = createSchema({
  tipo: {
    type: String,
    required: true
  },
  valor: {
    type: Number,
    required: true
  },
  unidad: {
    type: String,
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
}, {
  timestamps: true
});

export const Labs = mongoose.model('Labs', labSchema);