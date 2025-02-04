import mongoose from 'mongoose';

const propiedadSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  direccion: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['CASA', 'DEPARTAMENTO', 'LOCAL', 'OFICINA', 'OTRO'],
    required: true
  },
  estado: {
    type: String,
    enum: ['DISPONIBLE', 'OCUPADA', 'EN_MANTENIMIENTO'],
    default: 'DISPONIBLE'
  },
  precio: {
    type: Number,
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
  descripcion: String,
  caracteristicas: [String],
  imagenes: [String]
}, {
  timestamps: true
});

export const Propiedades = mongoose.model('Propiedad', propiedadSchema); 