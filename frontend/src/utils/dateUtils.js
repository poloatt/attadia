import { format, parseISO, startOfDay, endOfDay, isToday, 
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  isSameDay, isSameWeek, isSameMonth, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea una fecha para la API sin conversión UTC
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const formatDateForAPI = (date) => {
  if (!date) return null;
  
  try {
    // Asegurar que tenemos un objeto Date
    const d = date instanceof Date ? date : new Date(date);
    
    // Verificar que la fecha es válida
    if (isNaN(d.getTime())) {
      console.warn('[dateUtils] Fecha inválida en formatDateForAPI:', date);
      return null;
    }
    
    // Usar getFullYear, getMonth y getDate para mantener la zona horaria local
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    const formatted = `${year}-${month}-${day}`;
    console.debug('[dateUtils] formatDateForAPI:', {
      input: date,
      inputType: typeof date,
      result: formatted,
      originalDate: d.toISOString()
    });
    
    return formatted;
  } catch (error) {
    console.error('[dateUtils] Error en formatDateForAPI:', error);
    return null;
  }
};

/**
 * Obtiene la fecha actual normalizada (inicio del día en zona horaria local)
 * @returns {Date} Fecha actual normalizada
 */
export const getNormalizedToday = () => {
  try {
    const now = new Date();
    const normalized = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0, 0, 0, 0
    );
    
    console.debug('[dateUtils] getNormalizedToday:', {
      original: now.toISOString(),
      normalized: normalized.toISOString()
    });
    
    return normalized;
  } catch (error) {
    console.error('[dateUtils] Error en getNormalizedToday:', error);
    return new Date();
  }
};

/**
 * Parsea una fecha de la API manteniendo zona horaria local
 * @param {string|Date|any} date - Fecha a parsear
 * @returns {Date} Fecha parseada
 */
export const parseAPIDate = (date) => {
  if (!date) return null;
  
  try {
    let year, month, day;
    
    // Si ya es un objeto Date, extraer los componentes
    if (date instanceof Date) {
      year = date.getFullYear();
      month = date.getMonth();
      day = date.getDate();
    }
    // Si es string, intentar parsear
    else {
      const dateStr = String(date);
      
      // Para formato YYYY-MM-DD
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [y, m, d] = dateStr.split('-').map(Number);
        year = y;
        month = m - 1; // Ajustar mes (0-11)
        day = d;
      }
      // Para formato ISO
      else if (dateStr.includes('T')) {
        const d = new Date(dateStr);
        year = d.getFullYear();
        month = d.getMonth();
        day = d.getDate();
      }
      // Último recurso: parseo directo
      else {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) {
          console.warn('[dateUtils] Formato de fecha no reconocido:', dateStr);
          return null;
        }
        year = d.getFullYear();
        month = d.getMonth();
        day = d.getDate();
      }
    }
    
    // Crear nueva fecha a mediodía para evitar problemas con DST
    const parsed = new Date(year, month, day, 12, 0, 0, 0);
    
    console.debug('[dateUtils] parseAPIDate:', {
      input: date,
      inputType: typeof date,
      result: parsed.toISOString(),
      components: { year, month, day }
    });
    
    return parsed;
  } catch (error) {
    console.error('[dateUtils] Error en parseAPIDate:', error);
    return null;
  }
};

/**
 * Formatea una fecha para mostrar en la UI
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha formateada en español
 */
export const formatDateDisplay = (date) => {
  if (!date) return 'Sin fecha';
  try {
    const d = parseAPIDate(typeof date === 'string' ? date : formatDateForAPI(date));
    if (isToday(d)) return 'Hoy';
    return format(d, "d 'de' MMMM yyyy", { locale: es });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return 'Fecha inválida';
  }
};

/**
 * Obtiene el rango de fechas para una semana
 * @param {Date} date - Fecha de referencia
 * @returns {{start: Date, end: Date}} Inicio y fin de la semana
 */
export const getWeekRange = (date) => {
  const d = parseAPIDate(typeof date === 'string' ? date : formatDateForAPI(date));
  const start = startOfWeek(d, { locale: es });
  const end = endOfWeek(d, { locale: es });
  return { start, end };
};

/**
 * Obtiene el rango de fechas para un mes
 * @param {Date} date - Fecha de referencia
 * @returns {{start: Date, end: Date}} Inicio y fin del mes
 */
export const getMonthRange = (date) => {
  const d = parseAPIDate(typeof date === 'string' ? date : formatDateForAPI(date));
  const start = startOfMonth(d);
  const end = endOfMonth(d);
  return { start, end };
};

/**
 * Verifica si una fecha está en el pasado
 * @param {Date|string} date - Fecha a verificar
 * @returns {boolean} True si la fecha está en el pasado
 */
export const isPastDate = (date) => {
  const today = getNormalizedToday();
  const compareDate = parseAPIDate(typeof date === 'string' ? date : formatDateForAPI(date));
  return compareDate < today;
};

/**
 * Verifica si dos fechas son iguales (mismo día)
 * @param {Date|string} date1 - Primera fecha
 * @param {Date|string} date2 - Segunda fecha
 * @returns {boolean} True si son el mismo día
 */
export const areSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = parseAPIDate(typeof date1 === 'string' ? date1 : formatDateForAPI(date1));
  const d2 = parseAPIDate(typeof date2 === 'string' ? date2 : formatDateForAPI(date2));
  return isSameDay(d1, d2);
}; 