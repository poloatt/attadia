import { es } from 'date-fns/locale';

/**
 * Obtiene la fecha actual normalizada (inicio del día)
 * @returns {Date} Fecha normalizada
 */
export const getNormalizedToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

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

/**
 * Verifica si dos fechas son el mismo día
 * @param {Date|string} date1 
 * @param {Date|string} date2 
 * @returns {boolean}
 */
export const isSameDay = (date1, date2) => {
  const d1 = normalizeDate(date1);
  const d2 = normalizeDate(date2);
  return d1.getTime() === d2.getTime();
}; 