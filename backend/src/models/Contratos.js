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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inquilinos'
  },
  propiedad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Propiedades'
  },
  habitacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habitaciones'
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
    enum: ['ACTIVO', 'FINALIZADO', 'CANCELADO', 'PENDIENTE'],
    default: 'PENDIENTE'
  },
  montoMensual: {
    type: Number,
    required: true,
    min: 0
  },
  moneda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monedas',
    required: true
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

export const Contratos = mongoose.model('Contratos', contratoSchema); 