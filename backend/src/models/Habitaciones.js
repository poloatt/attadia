import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const habitacionSchema = createSchema({
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
        return this.tipo !== 'OTRO' || (v && v.length > 0);
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

export const Habitaciones = mongoose.model('Habitaciones', habitacionSchema); 