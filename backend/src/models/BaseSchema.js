import mongoose from 'mongoose';

const baseOptions = {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      ret.value = ret._id; // Para compatibilidad con los selectores del frontend
      ret.label = doc.getLabel?.() || ret.nombre || ret.titulo || ret._id; // Método flexible para etiquetas
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
};

export const createSchema = (definition, options = {}) => {
  const schema = new mongoose.Schema(definition, {
    ...baseOptions,
    ...options
  });

  // Método para obtener la representación para selectores
  schema.methods.toSelectOption = function() {
    return {
      id: this._id,
      value: this._id,
      label: this.getLabel(),
      data: this.toJSON() // Datos adicionales que puedan ser útiles
    };
  };

  // Método que puede ser sobrescrito por modelos específicos
  schema.methods.getLabel = function() {
    return this.nombre || this.titulo || this.descripcion || this._id.toString();
  };

  return schema;
};

// Plugin para añadir campos comunes a todos los esquemas
export const commonFields = {
  activo: {
    type: Boolean,
    default: true
  },
  orden: {
    type: Number,
    default: 0
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: () => new Map()
  }
}; 