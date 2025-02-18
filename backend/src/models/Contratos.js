import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const transaccionRecurrenteSchema = createSchema({
  concepto: {
    type: String,
    required: true
  },
  monto: {
    type: Number,
    required: true
  },
  diaVencimiento: {
    type: Number,
    required: true,
    min: 1,
    max: 31
  },
  moneda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monedas',
    required: true
  }
});

const contratoSchema = createSchema({
  inquilino: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inquilinos'
    }],
    validate: {
      validator: function(v) {
        return !this.esMantenimiento || (Array.isArray(v) && v.length === 0);
      },
      message: 'No se pueden asignar inquilinos a un contrato de mantenimiento'
    }
  },
  propiedad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Propiedades',
    required: true
  },
  esPorHabitacion: {
    type: Boolean,
    default: false
  },
  habitacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habitaciones',
    required: function() {
      return this.esPorHabitacion;
    }
  },
  cuenta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cuentas',
    required: function() {
      return !this.esMantenimiento;
    }
  },
  moneda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monedas',
    required: function() {
      return !this.esMantenimiento;
    }
  },
  fechaInicio: {
    type: Date,
    required: true
  },
  fechaFin: {
    type: Date
  },
  estado: {
    type: String,
    enum: ['ACTIVO', 'FINALIZADO', 'PLANEADO', 'MANTENIMIENTO'],
    default: 'PLANEADO'
  },
  esMantenimiento: {
    type: Boolean,
    default: false
  },
  montoMensual: {
    type: Number,
    required: true,
    min: 0
  },
  deposito: {
    type: Number,
    min: 0
  },
  observaciones: String,
  documentoUrl: String,
  transaccionesRecurrentes: [transaccionRecurrenteSchema],
  ...commonFields
}, {
  timestamps: true
});

// Middleware para validar fechas
contratoSchema.pre('save', function(next) {
  if (this.fechaFin && this.fechaInicio > this.fechaFin) {
    next(new Error('La fecha de fin debe ser posterior a la fecha de inicio'));
  }
  next();
});

// Middleware para calcular estado automáticamente
contratoSchema.pre('save', async function(next) {
  const now = new Date();
  
  // Si es un contrato de mantenimiento, el estado siempre será MANTENIMIENTO
  if (this.esMantenimiento) {
    this.estado = 'MANTENIMIENTO';
    this.montoMensual = 0; // Forzar monto 0 para contratos de mantenimiento
    next();
    return;
  }

  // Calcular estado basado en fechas
  if (this.fechaInicio && this.fechaFin) {
    if (this.fechaInicio <= now && this.fechaFin > now) {
      this.estado = 'ACTIVO';
    } else if (this.fechaInicio > now) {
      this.estado = 'PLANEADO';
    } else if (this.fechaFin <= now) {
      this.estado = 'FINALIZADO';
    }
  }

  next();
});

// Middleware para generar transacciones automáticamente
contratoSchema.pre('save', async function(next) {
  if ((this.isNew || this.isModified('transaccionesRecurrentes')) && this.estado === 'ACTIVO') {
    try {
      const Transacciones = mongoose.model('Transacciones');
      const fechaActual = new Date();
      const fechaFin = this.fechaFin || new Date(fechaActual.getFullYear() + 1, fechaActual.getMonth(), fechaActual.getDate());
      
      // Crear transacciones para cada mes del contrato
      for (let fecha = new Date(this.fechaInicio); fecha <= fechaFin; fecha.setMonth(fecha.getMonth() + 1)) {
        for (const transaccion of (this.transaccionesRecurrentes || [])) {
          await Transacciones.create({
            descripcion: transaccion.concepto,
            monto: transaccion.monto,
            fecha: new Date(fecha.getFullYear(), fecha.getMonth(), transaccion.diaVencimiento),
            categoria: 'ALQUILER',
            estado: 'PENDIENTE',
            tipo: 'INGRESO',
            usuario: this.usuario,
            moneda: transaccion.moneda,
            contrato: this._id
          });
        }
      }
    } catch (error) {
      console.error('Error al generar transacciones:', error);
      next(error);
    }
  }
  next();
});

// Método estático para obtener contratos activos de una propiedad
contratoSchema.statics.getContratosPropiedad = async function(propiedadId) {
  const now = new Date();
  return this.find({
    propiedad: propiedadId,
    $or: [
      // Contratos activos (en curso)
      {
        fechaInicio: { $lte: now },
        fechaFin: { $gt: now },
        estado: 'ACTIVO'
      },
      // Contratos planeados (futuros)
      {
        fechaInicio: { $gt: now },
        estado: 'PLANEADO'
      },
      // Contratos de mantenimiento activos
      {
        fechaInicio: { $lte: now },
        fechaFin: { $gt: now },
        esMantenimiento: true,
        estado: 'MANTENIMIENTO'
      }
    ]
  }).sort({ fechaInicio: 1 });
};

export const Contratos = mongoose.model('Contratos', contratoSchema); 