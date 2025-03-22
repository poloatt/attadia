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
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
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
  tipoContrato: {
    type: String,
    enum: ['ALQUILER', 'MANTENIMIENTO'],
    default: 'ALQUILER'
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

// Middleware para validar y actualizar estados
contratoSchema.pre('save', async function(next) {
  try {
    const now = new Date();
    
    // Validar fechas
    if (this.fechaFin && this.fechaInicio > this.fechaFin) {
      throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    // Si es un contrato de mantenimiento
    if (this.esMantenimiento || this.tipoContrato === 'MANTENIMIENTO') {
      this.estado = 'MANTENIMIENTO';
      this.montoMensual = 0;
      this.inquilino = [];
      this.esMantenimiento = true;
      this.tipoContrato = 'MANTENIMIENTO';

      // Actualizar estado de la propiedad a MANTENIMIENTO
      const Propiedades = mongoose.model('Propiedades');
      const propiedad = await Propiedades.findById(this.propiedad);
      if (propiedad) {
        propiedad.estado = ['MANTENIMIENTO'];
        await propiedad.save();
      }
      
      next();
      return;
    }

    // Para contratos de alquiler
    this.tipoContrato = 'ALQUILER';
    this.esMantenimiento = false;

    // Validar que los inquilinos existan y estén asignados a la propiedad
    const Inquilinos = mongoose.model('Inquilinos');
    for (const inquilinoId of this.inquilino) {
      const inquilino = await Inquilinos.findById(inquilinoId);
      if (!inquilino) {
        throw new Error(`El inquilino ${inquilinoId} no existe`);
      }
    }

    // Calcular estado basado en fechas
    if (this.fechaInicio <= now && this.fechaFin > now) {
      this.estado = 'ACTIVO';
      // Actualizar estado de inquilinos a ACTIVO
      for (const inquilinoId of this.inquilino) {
        const inquilino = await Inquilinos.findById(inquilinoId);
        if (inquilino) {
          inquilino.estado = 'ACTIVO';
          await inquilino.save();
        }
      }
      // Actualizar estado de la propiedad a OCUPADA
      const Propiedades = mongoose.model('Propiedades');
      const propiedad = await Propiedades.findById(this.propiedad);
      if (propiedad) {
        propiedad.estado = ['OCUPADA'];
        await propiedad.save();
      }
    } else if (this.fechaInicio > now) {
      this.estado = 'PLANEADO';
      // Actualizar estado de inquilinos a RESERVADO
      for (const inquilinoId of this.inquilino) {
        const inquilino = await Inquilinos.findById(inquilinoId);
        if (inquilino) {
          inquilino.estado = 'RESERVADO';
          await inquilino.save();
        }
      }
      // Actualizar estado de la propiedad a RESERVADA
      const Propiedades = mongoose.model('Propiedades');
      const propiedad = await Propiedades.findById(this.propiedad);
      if (propiedad) {
        propiedad.estado = ['RESERVADA'];
        await propiedad.save();
      }
    } else if (this.fechaFin <= now) {
      this.estado = 'FINALIZADO';
      // Actualizar estado de inquilinos a INACTIVO
      for (const inquilinoId of this.inquilino) {
        const inquilino = await Inquilinos.findById(inquilinoId);
        if (inquilino) {
          inquilino.estado = 'INACTIVO';
          await inquilino.save();
        }
      }
      // Actualizar estado de la propiedad a DISPONIBLE
      const Propiedades = mongoose.model('Propiedades');
      const propiedad = await Propiedades.findById(this.propiedad);
      if (propiedad) {
        propiedad.estado = ['DISPONIBLE'];
        await propiedad.save();
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Middleware para actualizar estados al finalizar un contrato
contratoSchema.pre('updateOne', async function(next) {
  try {
    const update = this.getUpdate();
    const contrato = await this.model.findOne(this.getQuery());
    if (!contrato) return next();

    const now = new Date();

    // Para contratos regulares
    if (update.estado === 'FINALIZADO') {
      // Actualizar estados de inquilinos a INACTIVO
      for (const inquilinoId of contrato.inquilino) {
        const inquilino = await mongoose.model('Inquilinos').findById(inquilinoId);
        if (inquilino) {
          inquilino.estado = 'INACTIVO';
          await inquilino.save();
        }
      }

      // Actualizar estado de la propiedad a DISPONIBLE
      const propiedad = await mongoose.model('Propiedades').findById(contrato.propiedad);
      if (propiedad) {
        propiedad.estado = ['DISPONIBLE'];
        await propiedad.save();
      }
    } else if (update.estado === 'ACTIVO') {
      // Si el contrato se activa
      if (contrato.fechaInicio <= now && contrato.fechaFin > now) {
        // Actualizar estados de inquilinos a ACTIVO
        for (const inquilinoId of contrato.inquilino) {
          const inquilino = await mongoose.model('Inquilinos').findById(inquilinoId);
          if (inquilino) {
            inquilino.estado = 'ACTIVO';
            await inquilino.save();
          }
        }

        // Actualizar estado de la propiedad a OCUPADA
        const propiedad = await mongoose.model('Propiedades').findById(contrato.propiedad);
        if (propiedad) {
          propiedad.estado = ['OCUPADA'];
          await propiedad.save();
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
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

// Middleware para validar que el usuario tenga acceso a la propiedad
contratoSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('propiedad')) {
    try {
      const Propiedades = mongoose.model('Propiedades');
      const propiedad = await Propiedades.findById(this.propiedad);
      
      if (!propiedad) {
        throw new Error('La propiedad especificada no existe');
      }
      
      if (propiedad.usuario.toString() !== this.usuario.toString()) {
        throw new Error('No tienes permiso para crear contratos en esta propiedad');
      }
    } catch (error) {
      next(error);
    }
  }
  next();
});

// Middleware para filtrar por usuario en las consultas
contratoSchema.pre(/^find/, function() {
  this.populate('propiedad').populate('inquilino');
  if (this._conditions.usuario) {
    const userId = this._conditions.usuario;
    this._conditions.$or = [
      { usuario: userId },
      { 'propiedad.usuario': userId }
    ];
  }
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