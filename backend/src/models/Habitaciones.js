import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const habitacionSchema = createSchema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  propiedad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Propiedades',
    required: true
  },
  tipo: {
    type: String,
    enum: [
      'BAÑO',
      'TOILETTE',
      'DORMITORIO_DOBLE',
      'DORMITORIO_SIMPLE',
      'ESTUDIO',
      'COCINA',
      'DESPENSA',
      'SALA_PRINCIPAL',
      'PATIO',
      'JARDIN',
      'TERRAZA',
      'LAVADERO',
      'OTRO'
    ],
    required: true
  },
  nombrePersonalizado: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (this.tipo === 'OTRO') {
          return v && v.trim().length > 0;
        }
        return true;
      },
      message: 'El nombre personalizado es requerido cuando el tipo es OTRO'
    }
  },
  ...commonFields
});

// Agregar relación virtual con inventarios
habitacionSchema.virtual('inventarios', {
  ref: 'Inventarios',
  localField: '_id',
  foreignField: 'habitacion'
});

// Asegurar que los virtuals se incluyan cuando se convierte a JSON/Object
habitacionSchema.set('toJSON', { virtuals: true });
habitacionSchema.set('toObject', { virtuals: true });

// Middleware para validar que el usuario tenga acceso a la propiedad
habitacionSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('propiedad')) {
    try {
      const Propiedades = mongoose.model('Propiedades');
      const propiedad = await Propiedades.findById(this.propiedad);
      
      if (!propiedad) {
        throw new Error('La propiedad especificada no existe');
      }
      
      if (propiedad.usuario.toString() !== this.usuario.toString()) {
        throw new Error('No tienes permiso para crear habitaciones en esta propiedad');
      }
    } catch (error) {
      next(error);
    }
  }
  next();
});

// Middleware para filtrar por usuario en las consultas
habitacionSchema.pre(/^find/, function() {
  this.populate('propiedad');
  if (this._conditions.usuario) {
    const userId = this._conditions.usuario;
    this._conditions.$or = [
      { usuario: userId },
      { 'propiedad.usuario': userId }
    ];
  }
});

export const Habitaciones = mongoose.model('Habitaciones', habitacionSchema); 