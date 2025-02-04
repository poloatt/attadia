import mongoose from 'mongoose';

const transaccionSchema = new mongoose.Schema({
  descripcion: {
    type: String,
    required: true
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
    required: true
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
  }
}, {
  timestamps: true
});

export const Transacciones = mongoose.model('Transacciones', transaccionSchema); 