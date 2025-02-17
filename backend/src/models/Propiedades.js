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

// Virtual para calcular número de dormitorios simples
propiedadSchema.virtual('dormitoriosSimples').get(async function() {
  const habitaciones = await mongoose.model('Habitaciones').find({
    propiedad: this._id,
    tipo: 'DORMITORIO_SIMPLE'
  });
  return habitaciones.length;
});

// Virtual para calcular número de dormitorios dobles
propiedadSchema.virtual('dormitoriosDobles').get(async function() {
  const habitaciones = await mongoose.model('Habitaciones').find({
    propiedad: this._id,
    tipo: 'DORMITORIO_DOBLE'
  });
  return habitaciones.length;
});

// Virtual para calcular número total de dormitorios
propiedadSchema.virtual('totalDormitorios').get(async function() {
  const [simples, dobles] = await Promise.all([
    this.dormitoriosSimples,
    this.dormitoriosDobles
  ]);
  return simples + dobles;
});

// Virtual para calcular número de baños
propiedadSchema.virtual('totalBanos').get(async function() {
  const banos = await mongoose.model('Habitaciones').find({
    propiedad: this._id,
    tipo: { $in: ['BAÑO', 'TOILETTE'] }
  });
  return banos.length;
});

// Método para obtener resumen de habitaciones
propiedadSchema.methods.getResumenHabitaciones = async function() {
  const [dormitoriosSimples, dormitoriosDobles, banos] = await Promise.all([
    this.dormitoriosSimples,
    this.dormitoriosDobles,
    this.totalBanos
  ]);

  return {
    dormitoriosSimples,
    dormitoriosDobles,
    totalDormitorios: dormitoriosSimples + dormitoriosDobles,
    banos
  };
};

// Asegurar que los virtuals se incluyan cuando se convierte a JSON/Object
propiedadSchema.set('toJSON', { virtuals: true });
propiedadSchema.set('toObject', { virtuals: true });

export const Propiedades = mongoose.model('Propiedades', propiedadSchema); 