import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const cuentaSchema = createSchema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users'
  },
  moneda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monedas',
    required: true
  },
  ...commonFields
});

export const Cuentas = mongoose.model('Cuentas', cuentaSchema); 