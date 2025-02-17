import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const propiedadSchema = createSchema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true
  },
  direccion: {
    type: String,
    required: true
  },
  ciudad: {
    type: String,
    required: true
  },
  estado: {
    type: String,
    enum: ['DISPONIBLE', 'OCUPADA', 'MANTENIMIENTO', 'RESERVADA'],
    default: 'DISPONIBLE',
    required: true
  },
  tipo: {
    type: String,
    enum: ['CASA', 'DEPARTAMENTO', 'OFICINA', 'LOCAL', 'TERRENO'],
    required: true
  },
  numDormitorios: {
    type: Number,
    required: true
  },
  banos: {
    type: Number,
    required: true
  },
  metrosCuadrados: {
    type: Number,
    required: true
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
  imagen: String,
  ...commonFields
});

// Agregar relación virtual con habitaciones
propiedadSchema.virtual('habitaciones', {
  ref: 'Habitaciones',
  localField: '_id',
  foreignField: 'propiedad'
});

// Asegurar que los virtuals se incluyan cuando se convierte a JSON/Object
propiedadSchema.set('toJSON', { virtuals: true });
propiedadSchema.set('toObject', { virtuals: true });

export const Propiedades = mongoose.model('Propiedades', propiedadSchema); 