import { startOfWeek, endOfWeek, parseISO, isSameWeek, isToday, startOfDay, addDays, startOfMonth, endOfMonth, subDays, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import rutinasService from '../services/rutinasService';
import { format } from 'date-fns';

// Cache para almacenar resultados de historial y evitar múltiples peticiones
const historialCache = {};

/**
 * Obtiene el historial de completaciones según la configuración de cadencia del usuario
 * @param {string} section - Sección del ítem (bodyCare, ejercicio, etc)
 * @param {string} itemId - Identificador del ítem
 * @param {Date} fechaRutina - Fecha de la rutina para la que se busca el historial
 * @param {boolean} esCompletacionHistorica - Indica si la completación es histórica
 * @param {Object} itemConfig - Configuración del ítem (opcional)
 * @returns {Promise<{total: number, completacionesPorDia: object, periodoActual: object}>}
 */
export async function obtenerHistorialCompletaciones(section, itemId, fechaRutina, esCompletacionHistorica = false, itemConfig = null) {
  try {
    if (!section || !itemId || !fechaRutina) {
      console.error('[historialUtils] ❌ Parámetros inválidos:', { section, itemId, fechaRutina });
      return {
        total: 0,
        completacionesPorDia: {},
        periodoActual: null
      };
    }

  // Normalizar la fecha de rutina
    const fechaRutinaObj = typeof fechaRutina === 'string' ? parseISO(fechaRutina) : new Date(fechaRutina);
    
    if (isNaN(fechaRutinaObj.getTime())) {
      console.error('[historialUtils] ❌ Fecha de rutina inválida:', fechaRutina);
      return {
        total: 0,
        completacionesPorDia: {},
        periodoActual: null
      };
    }

    // Obtener configuración del ítem
    let config;
    try {
      if (itemConfig) {
        config = itemConfig;
      } else {
        // Intentar obtener la configuración del servicio
        config = await rutinasService.obtenerConfiguracionItem(section, itemId).catch(() => null);
      }
    } catch (error) {
      console.warn('[historialUtils] No se pudo obtener configuración, usando valores por defecto');
    }

    // Si no se pudo obtener configuración, usar valores por defecto
    config = config || {
      tipo: 'DIARIO',
      periodo: 'CADA_DIA',
      frecuencia: 1,
      diasSemana: [],
      diasMes: [],
      activo: true
    };

    // Determinar el período según la configuración
    const { tipo, periodo } = config;
    let fechaInicio, fechaFin;

    switch (periodo) {
      case 'CADA_SEMANA':
        fechaInicio = startOfWeek(fechaRutinaObj, { locale: es });
        fechaFin = endOfWeek(fechaRutinaObj, { locale: es });
        break;
      case 'CADA_MES':
        fechaInicio = startOfMonth(fechaRutinaObj);
        fechaFin = endOfMonth(fechaRutinaObj);
        break;
      case 'PERSONALIZADO':
        const { intervalo = 1 } = config;
        fechaInicio = subDays(startOfDay(fechaRutinaObj), intervalo - 1);
        fechaFin = endOfDay(fechaRutinaObj);
        break;
      default: // CADA_DIA y otros casos
        fechaInicio = startOfDay(fechaRutinaObj);
        fechaFin = endOfDay(fechaRutinaObj);
    }

    // Obtener historial del servicio
    const historial = await rutinasService.obtenerHistorialCompletaciones(section, itemId, fechaInicio, fechaFin);

    // Procesar el historial
    const completacionesPorDia = {};
    let total = 0;

    if (Array.isArray(historial)) {
      historial.forEach(completacion => {
        const fecha = completacion.fecha.split('T')[0];
        if (!completacionesPorDia[fecha]) {
          completacionesPorDia[fecha] = [];
        }
        completacionesPorDia[fecha].push(completacion);
        total++;
      });
    }

    return {
      total,
      completacionesPorDia,
      periodoActual: {
        inicio: fechaInicio,
        fin: fechaFin
      }
    };

  } catch (error) {
    console.error('[historialUtils] ❌ Error al obtener historial:', error);
    return {
      total: 0,
      completacionesPorDia: {},
      periodoActual: null
    };
  }
}

/**
 * Verifica si una fecha corresponde a un día permitido según la configuración
 * @param {Date} fecha - Fecha a verificar
 * @param {Array} diasPermitidos - Array de días permitidos (números para días del mes, o strings para días de la semana)
 * @returns {boolean}
 */
function esDiaPermitido(fecha, diasPermitidos) {
  if (!Array.isArray(diasPermitidos) || diasPermitidos.length === 0) {
    return false;
  }
  
  // Si son números, son días del mes
  if (typeof diasPermitidos[0] === 'number') {
    return diasPermitidos.includes(fecha.getDate());
  }
  
  // Si son strings, son días de la semana
  const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const diaActual = diasSemana[fecha.getDay()];
  return diasPermitidos.includes(diaActual);
}

/**
 * Encuentra el último día específico antes de una fecha dada
 * @param {Date} fecha - Fecha de referencia
 * @param {Array} diasPermitidos - Array de días permitidos
 * @returns {Date}
 */
function encontrarUltimoDiaEspecifico(fecha, diasPermitidos) {
  let fechaActual = new Date(fecha);
  while (!esDiaPermitido(fechaActual, diasPermitidos)) {
    fechaActual = subDays(fechaActual, 1);
  }
  return startOfDay(fechaActual);
}

/**
 * Encuentra el siguiente día específico después de una fecha dada
 * @param {Date} fecha - Fecha de referencia
 * @param {Array} diasPermitidos - Array de días permitidos
 * @returns {Date}
 */
function encontrarSiguienteDiaEspecifico(fecha, diasPermitidos) {
  let fechaActual = new Date(fecha);
  while (!esDiaPermitido(fechaActual, diasPermitidos)) {
    fechaActual = addDays(fechaActual, 1);
  }
  return endOfDay(fechaActual);
}

/**
 * Calcula el período personalizado según la configuración del usuario
 * @param {Date} fecha - Fecha de referencia
 * @param {Object} config - Configuración del ítem
 * @returns {{inicio: Date, fin: Date}}
 */
function calcularPeriodoPersonalizado(fecha, config) {
  // Implementar lógica personalizada según la configuración del usuario
  // Por ejemplo, si el usuario quiere contar cada 3 días
  const { intervalo = 1 } = config;
  
  const inicio = startOfDay(fecha);
  const fin = endOfDay(addDays(fecha, intervalo - 1));
  
  return { inicio, fin };
}

/**
 * Filtra las completaciones que ocurrieron hasta (e incluyendo) una fecha específica
 * @param {Object} historial - Datos de historial recibidos del backend
 * @param {Date} fechaLimite - Fecha límite hasta la que contar completaciones
 * @returns {number} - Número de completaciones hasta la fecha límite
 */
function filtrarCompletacionesHastaFecha(historial, fechaLimite) {
  // Si no hay historial, retornar 0
  if (!historial) {
    return 0;
  }
  
  const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];
  console.log(`[historialUtils] Filtrando completaciones hasta fecha ${fechaLimiteStr}`);
  
  // Determinar si el historial es un array o un objeto con propiedad completaciones
  const completaciones = Array.isArray(historial) ? historial : 
                        (historial.completaciones && Array.isArray(historial.completaciones)) ? 
                        historial.completaciones : [];
  
  // Filtrar completaciones que ocurrieron hasta (e incluyendo) la fecha límite
  const completacionesHastaFecha = completaciones.filter(comp => {
    const fechaComp = new Date(comp.fecha);
    const fechaCompStr = fechaComp.toISOString().split('T')[0];
    
    // Verificar si la fecha de completación es anterior o igual a la fecha límite
    const esAnteriorOIgual = fechaCompStr <= fechaLimiteStr;
    
    if (esAnteriorOIgual) {
      console.log(`[historialUtils] ✅ Contabilizando completación: ${fechaCompStr}`);
    }
    
    return esAnteriorOIgual;
  });
  
  console.log(`[historialUtils] Total acumulado: ${completacionesHastaFecha.length}`);
  return completacionesHastaFecha.length;
}

/**
 * Determina si una rutina es histórica (anterior a hoy)
 * @param {Object} rutina - Objeto de rutina
 * @returns {boolean} - Verdadero si la rutina es histórica
 */
export function esRutinaHistorica(rutina) {
  if (!rutina || !rutina.fecha) {
    return false;
  }
  
  const fechaRutina = typeof rutina.fecha === 'string' ? parseISO(rutina.fecha) : rutina.fecha;
  const fechaHoy = new Date();
  
  // Comparar solo las fechas sin la hora
  const fechaRutinaStr = fechaRutina.toISOString().split('T')[0];
  const fechaHoyStr = fechaHoy.toISOString().split('T')[0];
  
  return fechaRutinaStr < fechaHoyStr;
}

/**
 * Verifica si una rutina es de hoy
 * @param {Object} rutina - Objeto de rutina
 * @returns {boolean} - Verdadero si la rutina es de hoy
 */
export function esRutinaHoy(rutina) {
  if (!rutina || !rutina.fecha) {
    return false;
  }
  
  const fechaRutina = typeof rutina.fecha === 'string' ? parseISO(rutina.fecha) : rutina.fecha;
  const fechaHoy = new Date();
  
  // Comparar solo las fechas sin la hora
  const fechaRutinaStr = fechaRutina.toISOString().split('T')[0];
  const fechaHoyStr = fechaHoy.toISOString().split('T')[0];
  
  return fechaRutinaStr === fechaHoyStr;
}

/**
 * Verifica si un ítem está completado en una rutina
 * @param {Object} rutina - Objeto de rutina
 * @param {string} section - Sección del ítem
 * @param {string} itemId - Identificador del ítem
 * @returns {boolean} - Verdadero si el ítem está completado
 */
export function isItemCompletado(rutina, section, itemId) {
  if (!rutina || !section || !itemId) {
    return false;
  }
  
  return !!rutina[section]?.[itemId];
}

// Función para calcular días consecutivos
export const calcularDiasConsecutivos = (historial = []) => {
  if (!historial || !Array.isArray(historial) || historial.length === 0) {
    return 0;
  }

  // Ordenar fechas de más reciente a más antigua
  const fechasOrdenadas = historial
    .map(fecha => new Date(fecha))
    .sort((a, b) => b - a);

  let diasConsecutivos = 1;
  let maxDiasConsecutivos = 1;

  for (let i = 1; i < fechasOrdenadas.length; i++) {
    const diaActual = fechasOrdenadas[i - 1];
    const diaAnterior = fechasOrdenadas[i];
    
    // Calcular diferencia en días
    const diffTime = Math.abs(diaActual - diaAnterior);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      diasConsecutivos++;
      maxDiasConsecutivos = Math.max(maxDiasConsecutivos, diasConsecutivos);
    } else {
      diasConsecutivos = 1;
    }
  }

  return maxDiasConsecutivos;
};

// Función para normalizar fechas
export const normalizarFecha = (fecha) => {
  if (!fecha) return new Date();
  
  const fechaObj = new Date(fecha);
  if (isNaN(fechaObj.getTime())) return new Date();
  
  // Corregir año futuro
  const maxYear = 2024;
  if (fechaObj.getFullYear() > maxYear) {
    fechaObj.setFullYear(maxYear);
  }
  
  return fechaObj;
};

// Función para obtener rango de fechas
export const obtenerRangoFechas = (tipo, fecha = new Date()) => {
  const fechaBase = normalizarFecha(fecha);
  let inicio = new Date(fechaBase);
  let fin = new Date(fechaBase);
  
  switch (tipo.toUpperCase()) {
    case 'DIARIO':
      inicio.setHours(0, 0, 0, 0);
      fin.setHours(23, 59, 59, 999);
      break;
    case 'SEMANAL':
      inicio.setDate(fechaBase.getDate() - fechaBase.getDay());
      fin.setDate(inicio.getDate() + 6);
      break;
    case 'MENSUAL':
      inicio.setDate(1);
      fin.setMonth(inicio.getMonth() + 1, 0);
      break;
    default:
      inicio.setHours(0, 0, 0, 0);
      fin.setHours(23, 59, 59, 999);
  }
  
  return { inicio, fin };
};

// Función para verificar si una fecha está en rango
export const estaEnRango = (fecha, inicio, fin) => {
  const fechaObj = normalizarFecha(fecha);
  return fechaObj >= inicio && fechaObj <= fin;
};

// Función para calcular progreso en periodo
export const calcularProgresoPeriodo = (historial = [], config = {}) => {
  if (!historial || !Array.isArray(historial)) return 0;
  
  const { tipo = 'DIARIO', frecuencia = 1 } = config;
  const fechaActual = new Date();
  const { inicio, fin } = obtenerRangoFechas(tipo, fechaActual);
  
  const completadosEnPeriodo = historial.filter(fecha => 
    estaEnRango(fecha, inicio, fin)
  ).length;
  
  return Math.min(completadosEnPeriodo / frecuencia, 1);
};

// Función para generar datos simulados (para testing)
export const generarHistorialSimulado = (dias = 30) => {
  const historial = [];
  const hoy = new Date();
  
  for (let i = 0; i < dias; i++) {
    if (Math.random() > 0.3) { // 70% de probabilidad de completar
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - i);
      historial.push(fecha.toISOString());
    }
  }
  
  return historial;
};

// Función para formatear fecha en español
export const formatearFecha = (fecha, formato = 'dd MMM yyyy') => {
  try {
    return format(new Date(fecha), formato, { locale: es });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return '';
  }
}; 