import mongoose from 'mongoose';

const contratoSchema = new mongoose.Schema({
  inquilino: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inquilinos',
    required: true
  },
  propiedad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Propiedades',
    required: true
  },
  habitacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habitaciones',
    required: true
  },
  fechaInicio: {
    type: Date,
    required: true
  },
  fechaFin: {
    type: Date,
    required: true
  },
  estado: {
    type: String,
    enum: ['ACTIVO', 'FINALIZADO', 'CANCELADO'],
    default: 'ACTIVO'
  },
  montoMensual: {
    type: Number,
    required: true
  },
  moneda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monedas',
    required: true
  }
}, {
  timestamps: true
});

export const Contratos = mongoose.model('Contratos', contratoSchema); 