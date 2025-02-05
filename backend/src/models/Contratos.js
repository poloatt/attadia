import mongoose from 'mongoose';

const transaccionRecurrenteSchema = new mongoose.Schema({
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

const contratoSchema = new mongoose.Schema({
  inquilinos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inquilinos',
    required: true
  }],
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
  },
  transaccionesRecurrentes: [transaccionRecurrenteSchema]
}, {
  timestamps: true
});

// Middleware para generar transacciones automáticamente
contratoSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('transaccionesRecurrentes')) {
    try {
      const Transacciones = mongoose.model('Transacciones');
      const fechaActual = new Date();
      const fechaFin = new Date(this.fechaFin);
      
      // Crear transacciones para cada mes del contrato
      for (let fecha = new Date(this.fechaInicio); fecha <= fechaFin; fecha.setMonth(fecha.getMonth() + 1)) {
        for (const transaccion of this.transaccionesRecurrentes) {
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