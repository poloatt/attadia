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
      // Si ya recibimos 'YYYY-MM-DD' lo usamos directo como día lógico
      if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(`${date}T00:00:00.000Z`);
      }

      const input = (typeof date === 'string') ? new Date(date) : date;
      if (!(input instanceof Date) || isNaN(input.getTime())) return null;

      // Extraer componentes del día en el timezone del usuario con Intl
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const parts = formatter.formatToParts(input);
      const year = parts.find(p => p.type === 'year').value;
      const month = parts.find(p => p.type === 'month').value;
      const day = parts.find(p => p.type === 'day').value;

      const normalizedDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
      
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
    if (!date) return null;

    // Si recibimos un objeto Date asumimos que ya es el inicio del día lógico del usuario
    // y simplemente calculamos el final del día a partir de ese inicio.
    if (date instanceof Date) {
      if (isNaN(date.getTime())) return null;
      const end = new Date(date.getTime() + (24 * 60 * 60 * 1000) - 1);
      console.log('[timezoneUtils] normalizeToEndOfDay (desde inicio de día):', {
        input: date.toISOString(),
        timezone: timezone,
        endOfDay: end.toISOString()
      });
      return end;
    }

    // Si recibimos 'YYYY-MM-DD', construir directamente las 23:59:59.999Z
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const end = new Date(`${date}T23:59:59.999Z`);
      console.log('[timezoneUtils] normalizeToEndOfDay (YYYY-MM-DD):', {
        input: date,
        timezone: timezone,
        endOfDay: end.toISOString()
      });
      return end;
    }

    // Para otros casos (string ISO, etc.), normalizar al inicio y sumar 24h - 1ms
    const startOfDay = timezoneUtils.normalizeToStartOfDay(date, timezone);
    if (!startOfDay) return null;
    const end = new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000) - 1);
    console.log('[timezoneUtils] normalizeToEndOfDay (normalizado):', {
      input: date,
      timezone: timezone,
      startOfDay: startOfDay.toISOString(),
      endOfDay: end.toISOString()
    });
    return end;
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