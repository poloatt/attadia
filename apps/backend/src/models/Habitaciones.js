import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

// Mapeo de tipos de habitación a íconos
const ICONOS_POR_TIPO = {
  'BAÑO': 'wc',
  'TOILETTE': 'wc',
  'DORMITORIO_DOBLE': 'bed',
  'DORMITORIO_SIMPLE': 'single_bed',
  'ESTUDIO': 'desktop_mac',
  'COCINA': 'kitchen',
  'DESPENSA': 'inventory_2',
  'SALA_PRINCIPAL': 'weekend',
  'PATIO': 'yard',
  'JARDIN': 'park',
  'TERRAZA': 'deck',
  'LAVADERO': 'local_laundry_service',
  'OTRO': 'room'
};

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
  icono: {
    type: String,
    default: function() {
      return ICONOS_POR_TIPO[this.tipo] || 'room';
    }
  },
  ...commonFields
});

// Método estático para obtener el ícono por tipo
habitacionSchema.statics.getIconoPorTipo = function(tipo) {
  return ICONOS_POR_TIPO[tipo] || 'room';
};

// Método estático para obtener todos los tipos con sus íconos
habitacionSchema.statics.getTiposConIconos = function() {
  return Object.keys(ICONOS_POR_TIPO).map(tipo => ({
    tipo,
    icono: ICONOS_POR_TIPO[tipo]
  }));
};

// Agregar relación virtual con inventarios
habitacionSchema.virtual('inventarios', {
  ref: 'Inventarios',
  localField: '_id',
  foreignField: 'habitacion',
  justOne: false // Un inventario puede o no estar asociado a una habitación
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
      
      // Verificar que el usuario de la propiedad coincida con el usuario de la habitación
      if (propiedad.usuario && this.usuario && 
          propiedad.usuario.toString() !== this.usuario.toString()) {
        throw new Error('No tienes permiso para crear habitaciones en esta propiedad');
      }
    } catch (error) {
      next(error);
    }
  }
  next();
});

// Middleware para asegurar que el ícono se asigne correctamente
habitacionSchema.pre('save', function(next) {
  // Asignar el ícono si no está definido o si el tipo cambió
  if (!this.icono || this.isModified('tipo')) {
    this.icono = ICONOS_POR_TIPO[this.tipo] || 'room';
  }
  next();
});

// Middleware para filtrar por usuario en las consultas
habitacionSchema.pre(/^find/, function() {
  this.populate('propiedad');
});

export const Habitaciones = mongoose.model('Habitaciones', habitacionSchema); 