import mongoose from 'mongoose';

const monedaSchema = new mongoose.Schema({
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
  }
}, {
  timestamps: true
});

export const Monedas = mongoose.model('Moneda', monedaSchema); 