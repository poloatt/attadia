import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const transaccionSchema = createSchema({
  descripcion: {
    type: String,
    required: true,
    trim: true
  },
  monto: {
    type: Number,
    required: true
  },
  fecha: {
    type: Date,
    required: true,
    default: Date.now
  },
  categoria: {
    type: String,
    required: true,
    enum: [
      'Salud y Belleza',
      'Contabilidad y Facturas',
      'Transporte',
      'Comida y Mercado',
      'Fiesta',
      'Ropa',
      'Tecnología',
      'Otro'
    ],
    trim: true
  },
  estado: {
    type: String,
    enum: ['PENDIENTE', 'PAGADO', 'COMPLETADA', 'CANCELADA'],
    default: 'PENDIENTE'
  },
  tipo: {
    type: String,
    enum: ['INGRESO', 'EGRESO'],
    required: true
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
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
  contrato: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contratos'
  },
  // Campo para transacciones de fuentes externas (MercadoPago, bancos, etc.)
  origen: {
    tipo: {
      type: String,
      enum: ['MANUAL', 'MERCADOPAGO', 'PLAID', 'OPEN_BANKING', 'API_DIRECTA'],
      default: 'MANUAL'
    },
    conexionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BankConnection'
    },
    transaccionId: String, // ID de la transacción en el sistema externo
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: () => ({})
    }
  },
  ...commonFields
});

// Middleware para asignar automáticamente la moneda de la cuenta
transaccionSchema.pre('save', async function(next) {
  try {
    // Solo ejecutar si es un documento nuevo o si la cuenta fue modificada
    if (this.isNew || this.isModified('cuenta')) {
      const Cuentas = mongoose.model('Cuentas');
      console.log('Procesando cuenta para transacción:', this.cuenta);
      
      // Asegurarnos de que el ID de la cuenta sea un ObjectId válido
      const cuentaId = mongoose.Types.ObjectId.isValid(this.cuenta) ? 
        this.cuenta : 
        null;

      if (!cuentaId) {
        throw new Error('ID de cuenta inválido');
      }

      const cuenta = await Cuentas.findById(cuentaId).populate('moneda');
      if (!cuenta) {
        throw new Error('La cuenta especificada no existe');
      }
      
      if (!cuenta.moneda) {
        throw new Error('La cuenta no tiene una moneda asociada');
      }
      
      console.log('Cuenta encontrada:', cuenta.nombre);
      console.log('Asignando moneda:', cuenta.moneda.nombre);
      
      // Solo asignar si no está ya asignado para evitar bucles
      if (!this.moneda || this.moneda.toString() !== cuenta.moneda._id.toString()) {
        this.moneda = cuenta.moneda._id;
      }
    }
    next();
  } catch (error) {
    console.error('Error en middleware pre-save de Transacciones:', error);
    next(error);
  }
});

// Configuración para populate automático solo en consultas específicas
transaccionSchema.pre(['find', 'findOne', 'findOneAndUpdate'], function(next) {
  this.populate('moneda').populate('cuenta');
  next();
});

// Personalizar el método toJSON para transformar _id a id
transaccionSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    if (ret.moneda) {
      ret.moneda.id = ret.moneda._id;
      delete ret.moneda._id;
    }
    if (ret.cuenta) {
      ret.cuenta.id = ret.cuenta._id;
      delete ret.cuenta._id;
    }
    return ret;
  }
});

// Personalizar el método getLabel
transaccionSchema.methods.getLabel = function() {
  const tipoSymbol = this.tipo === 'INGRESO' ? '+' : '-';
  return `${tipoSymbol}${this.monto} - ${this.descripcion}`;
};

// Método para obtener el balance de una cuenta
transaccionSchema.statics.getBalance = async function(cuentaId) {
  const result = await this.aggregate([
    { $match: { cuenta: new mongoose.Types.ObjectId(cuentaId), estado: 'COMPLETADA' } },
    { $group: {
      _id: null,
      ingresos: { 
        $sum: { 
          $cond: [{ $eq: ['$tipo', 'INGRESO'] }, '$monto', 0] 
        }
      },
      egresos: { 
        $sum: { 
          $cond: [{ $eq: ['$tipo', 'EGRESO'] }, '$monto', 0] 
        }
      }
    }}
  ]);

  if (result.length === 0) {
    return { ingresos: 0, egresos: 0, balance: 0 };
  }

  const { ingresos, egresos } = result[0];
  return {
    ingresos,
    egresos,
    balance: ingresos - egresos
  };
};

// Índices para mejorar el rendimiento
transaccionSchema.index({ usuario: 1, fecha: -1 });
transaccionSchema.index({ cuenta: 1, fecha: -1 });
transaccionSchema.index({ contrato: 1, fecha: -1 });
transaccionSchema.index({ estado: 1, fecha: -1 });

export const Transacciones = mongoose.model('Transacciones', transaccionSchema); 