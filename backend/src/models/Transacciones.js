import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const transaccionSchema = createSchema({
  descripcion: {
    type: String,
    required: true,
    trim: true
  },
  monto: {
    type: Number,
    required: true
  },
  fecha: {
    type: Date,
    required: true,
    default: Date.now
  },
  categoria: {
    type: String,
    required: true,
    trim: true
  },
  estado: {
    type: String,
    enum: ['PENDIENTE', 'COMPLETADA', 'CANCELADA'],
    default: 'PENDIENTE'
  },
  tipo: {
    type: String,
    enum: ['INGRESO', 'EGRESO'],
    required: true
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
  cuenta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cuentas',
    required: true
  },
  contrato: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contratos'
  },
  ...commonFields
});

// Personalizar el método getLabel
transaccionSchema.methods.getLabel = function() {
  const tipoSymbol = this.tipo === 'INGRESO' ? '+' : '-';
  return `${tipoSymbol}${this.monto} - ${this.descripcion}`;
};

// Método para obtener el balance de una cuenta
transaccionSchema.statics.getBalance = async function(cuentaId) {
  const result = await this.aggregate([
    { $match: { cuenta: new mongoose.Types.ObjectId(cuentaId), estado: 'COMPLETADA' } },
    { $group: {
      _id: null,
      ingresos: { 
        $sum: { 
          $cond: [{ $eq: ['$tipo', 'INGRESO'] }, '$monto', 0] 
        }
      },
      egresos: { 
        $sum: { 
          $cond: [{ $eq: ['$tipo', 'EGRESO'] }, '$monto', 0] 
        }
      }
    }}
  ]);

  if (result.length === 0) {
    return { ingresos: 0, egresos: 0, balance: 0 };
  }

  const { ingresos, egresos } = result[0];
  return {
    ingresos,
    egresos,
    balance: ingresos - egresos
  };
};

// Índices para mejorar el rendimiento
transaccionSchema.index({ usuario: 1, fecha: -1 });
transaccionSchema.index({ cuenta: 1, fecha: -1 });
transaccionSchema.index({ contrato: 1, fecha: -1 });
transaccionSchema.index({ estado: 1, fecha: -1 });

export const Transacciones = mongoose.model('Transacciones', transaccionSchema); 