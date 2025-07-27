import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';
import './Monedas.js'; // Aseguramos que el modelo Monedas se registre primero

const cuentaSchema = createSchema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  numero: {
    type: String,
    required: false,
    trim: true,
    default: function() {
      return `ACC-${Date.now()}`;
    }
  },
  tipo: {
    type: String,
    required: true,
    enum: ['EFECTIVO', 'BANCO', 'MERCADO_PAGO', 'CRIPTO', 'OTRO'],
    default: 'OTRO'
  },
  saldo: {
    type: Number,
    default: 0
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  moneda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monedas',
    required: true
  },
  activo: {
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

// Middleware para poblar referencias solo en consultas específicas
cuentaSchema.pre(['find', 'findOne'], function() {
  this.populate('moneda');
});

const Cuentas = mongoose.model('Cuentas', cuentaSchema);

export { Cuentas }; 