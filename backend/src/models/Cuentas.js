import mongoose from 'mongoose';

const cuentaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users'
  },
  moneda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monedas',
    required: true
  }
});

export const Cuentas = mongoose.model('Cuentas', cuentaSchema); 