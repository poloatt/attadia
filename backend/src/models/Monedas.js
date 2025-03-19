import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const COLORES_MONEDA = {
  CELESTE_ARGENTINA: '#75AADB', // Celeste de la bandera argentina
  AZUL_NAVY: '#000080',        // Azul navy
  TEAL: '#008080',             // Teal
  DARK_TEAL: '#006666',        // Dark teal
  DARK_GREEN: '#006400',       // Dark green
  VIOLETA_OSCURO: '#4B0082'    // Violeta oscuro
};

const monedaSchema = createSchema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
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
  color: {
    type: String,
    enum: Object.values(COLORES_MONEDA),
    default: COLORES_MONEDA.CELESTE_ARGENTINA
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

// Middleware para filtrar por usuario en las consultas
monedaSchema.pre(/^find/, function() {
  if (this._conditions.usuario) {
    const userId = this._conditions.usuario;
    this._conditions.$or = [
      { usuario: userId },
      { activa: true } // Permitir acceso a monedas activas (globales)
    ];
  }
});

const Monedas = mongoose.model('Monedas', monedaSchema);

export { Monedas, COLORES_MONEDA }; 