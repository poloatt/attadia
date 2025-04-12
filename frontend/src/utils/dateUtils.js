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
  
  // Crear una nueva fecha y ajustar a la zona horaria local
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Obtiene la fecha actual normalizada (inicio del día)
 * @returns {Date} Fecha actual normalizada
 */
export const getNormalizedToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  return new Date(year, month, day);
};

/**
 * Parsea una fecha de la API manteniendo zona horaria local
 * @param {string|Date|any} date - Fecha a parsear
 * @returns {Date} Fecha parseada
 */
export const parseAPIDate = (date) => {
  if (!date) return null;
  
  try {
    // Si ya es un objeto Date, normalizarlo
    if (date instanceof Date) {
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        12, // Usar mediodía para evitar problemas de DST
        0,
        0,
        0
      );
    }
    
    // Convertir a string si no lo es
    const dateString = String(date);
    
    // Si es una fecha ISO completa
    if (dateString.includes('T')) {
      const parsed = parseISO(dateString);
      return new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate(),
        12,
        0,
        0,
        0
      );
    }
    
    // Si es YYYY-MM-DD
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day, 12, 0, 0, 0);
    }
    
    // Intentar parseo directo como último recurso
    const fallbackDate = new Date(dateString);
    if (!isNaN(fallbackDate.getTime())) {
      return new Date(
        fallbackDate.getFullYear(),
        fallbackDate.getMonth(),
        fallbackDate.getDate(),
        12,
        0,
        0,
        0
      );
    }
    
    console.warn('[dateUtils] Formato de fecha no reconocido:', dateString);
    return null;
  } catch (error) {
    console.error('[dateUtils] Error al parsear fecha:', error);
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