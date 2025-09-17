import { format, parseISO, startOfDay, endOfDay, isToday, 
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  isSameDay, isSameWeek, isSameMonth, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Obtener el timezone del usuario desde el contexto de autenticación
// Este valor se actualizará dinámicamente cuando el usuario configure su timezone
let userTimezone = 'America/Santiago'; // Timezone por defecto

/**
 * Configura el timezone del usuario para las utilidades de fecha
 * @param {string} timezone - Timezone del usuario (ej: 'America/Santiago')
 */
export const setUserTimezone = (timezone) => {
  if (timezone) {
    userTimezone = timezone;
    console.log('[dateUtils] Timezone configurado:', timezone);
  }
};

/**
 * Obtiene el timezone actual del usuario
 * @returns {string} Timezone del usuario
 */
export const getUserTimezone = () => userTimezone;

/**
 * Formatea una fecha para la API usando el timezone del usuario
 * Maneja específicamente el caso donde el usuario selecciona una fecha en el date picker
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const formatDateForAPI = (date) => {
  if (!date) return null;
  
  try {
    let inputDate;
    
    // Manejar diferentes tipos de entrada
    if (typeof date === 'string') {
      // Si ya es formato YYYY-MM-DD, devolverlo tal como está
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        console.debug('[dateUtils] formatDateForAPI - String en formato YYYY-MM-DD:', date);
        return date;
      }
      inputDate = new Date(date);
    } else if (date instanceof Date) {
      inputDate = date;
    } else {
      console.warn('[dateUtils] formatDateForAPI - Tipo de fecha no soportado:', typeof date, date);
      return null;
    }
    
    // Verificar que la fecha es válida
    if (isNaN(inputDate.getTime())) {
      console.warn('[dateUtils] formatDateForAPI - Fecha inválida:', date);
      return null;
    }
    
    // Cuando el usuario selecciona una fecha en el date picker, queremos usar exactamente
    // los componentes de fecha (año, mes, día) que el usuario vio y seleccionó
    const year = inputDate.getFullYear();
    const month = String(inputDate.getMonth() + 1).padStart(2, '0'); // Mes 1-12
    const day = String(inputDate.getDate()).padStart(2, '0');
    
    const formatted = `${year}-${month}-${day}`;
    
    console.debug('[dateUtils] formatDateForAPI:', {
      input: date,
      inputType: typeof date,
      inputDate: inputDate.toISOString(),
      localComponents: { year, month, day },
      result: formatted,
      timezone: userTimezone
    });
    
    return formatted;
  } catch (error) {
    console.error('[dateUtils] Error en formatDateForAPI:', error);
    return null;
  }
};

/**
 * Obtiene la fecha actual normalizada (inicio del día en timezone del usuario)
 * @returns {Date} Fecha actual normalizada
 */
export const getNormalizedToday = () => {
  try {
    const now = new Date();
    
    // Obtener la fecha actual en el timezone del usuario
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const parts = formatter.formatToParts(now);
    const year = parseInt(parts.find(part => part.type === 'year').value);
    const month = parseInt(parts.find(part => part.type === 'month').value) - 1; // Mes 0-indexado
    const day = parseInt(parts.find(part => part.type === 'day').value);
    
    // Crear fecha normalizada al inicio del día
    const normalized = new Date(year, month, day, 0, 0, 0, 0);
    
    console.debug('[dateUtils] getNormalizedToday:', {
      original: now.toISOString(),
      normalized: normalized.toISOString(),
      timezone: userTimezone,
      components: { year, month, day }
    });
    
    return normalized;
  } catch (error) {
    console.error('[dateUtils] Error en getNormalizedToday:', error);
    return new Date();
  }
};

/**
 * Parsea una fecha de la API como fecha "naive" (sin conversiones de timezone)
 * Para rutinas, las fechas representan días específicos, no momentos en el tiempo
 * @param {string|Date|any} date - Fecha a parsear
 * @returns {Date} Fecha parseada como fecha local
 */
export const parseAPIDate = (date) => {
  if (!date) return null;
  
  try {
    let year, month, day;
    
    // Si ya es un objeto Date, NO hacer conversiones de timezone
    if (date instanceof Date) {
      // Usar getUTC* para extraer los componentes de fecha como fueron guardados
      year = date.getUTCFullYear();
      month = date.getUTCMonth();
      day = date.getUTCDate();
    }
    // Si es string, parsear directamente sin conversiones
    else {
      const dateStr = String(date);
      
      // Para formato YYYY-MM-DD (más común desde el backend)
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [y, m, d] = dateStr.split('-').map(Number);
        year = y;
        month = m - 1; // Ajustar mes (0-11)
        day = d;
      }
      // Para formato ISO (desde el backend: 2025-07-01T00:00:00.000Z)
      else if (dateStr.includes('T')) {
        // Extraer solo la parte de la fecha, ignorar la parte de tiempo y timezone
        const datePart = dateStr.split('T')[0];
        if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [y, m, d] = datePart.split('-').map(Number);
          year = y;
          month = m - 1; // Ajustar mes (0-11)
          day = d;
        } else {
          // Fallback: usar Date constructor pero extraer como UTC
          const d = new Date(dateStr);
          year = d.getUTCFullYear();
          month = d.getUTCMonth();
          day = d.getUTCDate();
        }
      }
      // Último recurso: parseo directo
      else {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) {
          console.warn('[dateUtils] Formato de fecha no reconocido:', dateStr);
          return null;
        }
        
        // Usar componentes UTC para evitar conversiones de timezone
        year = d.getUTCFullYear();
        month = d.getUTCMonth();
        day = d.getUTCDate();
      }
    }
    
    // Crear fecha local a mediodía para evitar problemas con DST
    // Esta fecha representará el día específico sin importar el timezone
    const parsed = new Date(year, month, day, 12, 0, 0, 0);
    
    // Logs eliminados para mejor rendimiento
    
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

// --- FUNCIONES CENTRALIZADAS DE RUTINADATEUTILS ---

/**
 * Normaliza cualquier fecha al inicio del día
 * @param {Date|string} date - Fecha a normalizar
 * @returns {Date} Fecha normalizada
 */
export const normalizeDate = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

/**
 * Convierte una fecha a formato ISO sin tiempo
 * @param {Date|string} date - Fecha a convertir
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const toISODateString = (date) => {
  const normalized = normalizeDate(date);
  return normalized.toISOString().split('T')[0];
}; 