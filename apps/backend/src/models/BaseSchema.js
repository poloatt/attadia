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
      
      // Para contratos, incluir el estado actual calculado
      if (ret.fechaInicio && ret.fechaFin) {
        ret.estadoActual = doc.estadoActual;
        ret.estaActivo = doc.estaActivo;
        ret.estaPlaneado = doc.estaPlaneado;
        ret.estaFinalizado = doc.estaFinalizado;
      }
      
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

// Utilidades para manejo de timezone
export const timezoneUtils = {
  /**
   * Normaliza una fecha al inicio del día en el timezone especificado
   * @param {Date|string} date - Fecha a normalizar
   * @param {string} timezone - Timezone (ej: 'America/Santiago')
   * @returns {Date} Fecha normalizada
   */
  normalizeToStartOfDay: (date, timezone = 'America/Santiago') => {
    if (!date) return null;
    
    try {
      let year, month, day;
      
      // Manejar diferentes tipos de entrada
      if (typeof date === 'string') {
        // Si es formato YYYY-MM-DD, usar directamente los componentes
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          [year, month, day] = date.split('-').map(Number);
        } else {
          // Para otros formatos, parsear y extraer componentes
          const inputDate = new Date(date);
          if (isNaN(inputDate.getTime())) return null;
          
          year = inputDate.getFullYear();
          month = inputDate.getMonth() + 1; // Convertir a 1-12
          day = inputDate.getDate();
        }
      } else if (date instanceof Date) {
        if (isNaN(date.getTime())) return null;
        
        year = date.getFullYear();
        month = date.getMonth() + 1; // Convertir a 1-12
        day = date.getDate();
      } else {
        return null;
      }
      
      // Crear fecha que representa el inicio del día en el timezone especificado
      // Usamos el método que funciona consistentemente con timezones
      const normalizedDate = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`);
      
      console.log('[timezoneUtils] normalizeToStartOfDay:', {
        input: date,
        inputType: typeof date,
        components: { year, month, day },
        result: normalizedDate.toISOString(),
        timezone: timezone
      });
      
      return normalizedDate;
    } catch (error) {
      console.error('Error al normalizar fecha:', error);
      return null;
    }
  },

  /**
   * Convierte una fecha al final del día en el timezone especificado
   * @param {Date|string} date - Fecha a convertir
   * @param {string} timezone - Timezone (ej: 'America/Santiago')
   * @returns {Date} Fecha al final del día
   */
  normalizeToEndOfDay: (date, timezone = 'America/Santiago') => {
    const startOfDay = timezoneUtils.normalizeToStartOfDay(date, timezone);
    if (!startOfDay) return null;
    
    // Crear fecha al final del día usando UTC
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1); // Agregar 24 horas menos 1ms
    
    console.log('[timezoneUtils] normalizeToEndOfDay:', {
      input: date,
      timezone: timezone,
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    });
    
    return endOfDay;
  },

  /**
   * Obtiene el timezone de un usuario o devuelve el por defecto
   * @param {Object} user - Usuario con preferencias
   * @returns {string} Timezone del usuario o por defecto
   */
  getUserTimezone: (user) => {
    return user?.preferences?.timezone || 'America/Santiago';
  },

  /**
   * Formatea una fecha para mostrar en el timezone del usuario
   * @param {Date|string} date - Fecha a formatear
   * @param {string} timezone - Timezone del usuario
   * @returns {string} Fecha formateada
   */
  formatDateForUser: (date, timezone = 'America/Santiago') => {
    if (!date) return null;
    
    try {
      const inputDate = new Date(date);
      if (isNaN(inputDate.getTime())) return null;
      
      return new Intl.DateTimeFormat('es-CL', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(inputDate);
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return null;
    }
  }
}; 