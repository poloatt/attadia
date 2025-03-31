import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const baseOptions = {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      ret.value = ret._id; // Para compatibilidad con los selectores del frontend
      ret.label = doc.getLabel?.() || ret.nombre || ret.titulo || ret._id; // Método flexible para etiquetas
      ret.displayValue = doc.getDisplayValue?.() || ret.codigo || ret.nombre || ret.titulo; // Valor para mostrar
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

  // Agregar el plugin de paginación
  schema.plugin(mongoosePaginate);

  // Método para obtener la representación para selectores
  schema.methods.toSelectOption = function() {
    const json = this.toJSON();
    return {
      id: this._id,
      value: this._id,
      label: this.getLabel(),
      displayValue: this.getDisplayValue(),
      data: json // Datos adicionales que puedan ser útiles
    };
  };

  // Método que puede ser sobrescrito por modelos específicos
  schema.methods.getLabel = function() {
    return this.nombre || this.titulo || this.descripcion || this._id.toString();
  };

  // Método que puede ser sobrescrito para personalizar el valor mostrado
  schema.methods.getDisplayValue = function() {
    return this.codigo || this.nombre || this.titulo || this._id.toString();
  };

  return schema;
};

// Plugin para añadir campos comunes a todos los esquemas
export const commonFields = {
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

// Función para excluir campos comunes específicos
export const excludeCommonFields = (fieldsToExclude = []) => {
  const fields = { ...commonFields };
  fieldsToExclude.forEach(field => delete fields[field]);
  return fields;
}; 