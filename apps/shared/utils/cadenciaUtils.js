/**
 * Utilidades para el manejo de cadencia en rutinas
 */

import { addDays, isSameDay, isWithinInterval, getDay, getDate, setDate, 
         startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, 
         differenceInDays, isBefore, parseISO, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Obtiene el historial de completados de un ítem desde una rutina
 * El historial se estructura como: historial[section][itemId][YYYY-MM-DD] = true
 * @param {string} itemId - ID del ítem
 * @param {string} section - Sección del ítem
 * @param {Object} rutina - Objeto de rutina con historial
 * @returns {Array<Date>} - Array de fechas donde el ítem fue completado
 */
export const obtenerHistorialCompletados = (itemId, section, rutina) => {
  if (!rutina || !rutina.historial || !rutina.historial[section]) {
    return [];
  }

  const historialSection = rutina.historial[section];
  const historialItem = historialSection[itemId];
  
  if (!historialItem) {
    return [];
  }

  // El historial viene como objeto { 'YYYY-MM-DD': true }
  if (typeof historialItem === 'object' && !Array.isArray(historialItem)) {
    return Object.keys(historialItem)
      .filter(fecha => historialItem[fecha] === true)
      .map(fecha => {
        // Parsear fecha YYYY-MM-DD a Date
        const [year, month, day] = fecha.split('-').map(Number);
        return new Date(year, month - 1, day, 12, 0, 0, 0);
      });
  } else if (Array.isArray(historialItem)) {
    // Fallback: si viene como array de fechas
    return historialItem.map(fecha => new Date(fecha));
  }
  
  return [];
};

/**
 * Determina si un día específico debe mostrar un hábito según su configuración de cadencia
 * @param {Date} targetDate - Fecha objetivo a evaluar
 * @param {Object} cadenciaConfig - Configuración de cadencia del hábito
 * @param {Array} historialCompletado - Arreglo de fechas donde el hábito fue completado (opcional)
 * @returns {Boolean} - Verdadero si el hábito debe mostrarse en esa fecha
 */
export const debesMostrarHabitoEnFecha = (targetDate, cadenciaConfig, historialCompletado = []) => {
  // Si la configuración está inactiva, no mostrar
  if (!cadenciaConfig || !cadenciaConfig.activo) {
    return false;
  }

  // Normalizar la fecha objetivo a las 12:00 para evitar problemas con horas
  const fechaObjetivo = new Date(targetDate);
  fechaObjetivo.setHours(12, 0, 0, 0);
  
  // Obtener valores normalizados
  const tipo = (cadenciaConfig.tipo || 'DIARIO').toUpperCase();
  const frecuencia = Number(cadenciaConfig.frecuencia || 1);
  const diasSemana = Array.isArray(cadenciaConfig.diasSemana) ? cadenciaConfig.diasSemana : [];
  const diasMes = Array.isArray(cadenciaConfig.diasMes) ? cadenciaConfig.diasMes : [];
  const periodo = cadenciaConfig.periodo || 'CADA_DIA';

  // Verificar cuántas veces se ha completado en el período actual
  const completadosEnPeriodo = contarCompletadosEnPeriodo(
    fechaObjetivo, 
    tipo, 
    periodo, 
    historialCompletado
  );

  // Si ya se ha completado el número requerido, no mostrar más para este período
  if (completadosEnPeriodo >= frecuencia) {
    return false;
  }

  // Lógica específica según el tipo de cadencia
  switch (tipo) {
    case 'DIARIO':
      // Para hábitos diarios, siempre mostrar si no se ha alcanzado la frecuencia
      return true;

    case 'SEMANAL':
      // Para hábitos semanales con días específicos
      if (diasSemana.length > 0) {
        const diaSemana = getDay(fechaObjetivo); // 0 = domingo, 1 = lunes, etc.
        return diasSemana.includes(diaSemana);
      }
      // Si no hay días específicos, mostrar siempre hasta alcanzar la frecuencia
      return true;

    case 'MENSUAL':
      // Para hábitos mensuales con días específicos
      if (diasMes.length > 0) {
        const diaMes = getDate(fechaObjetivo);
        return diasMes.includes(diaMes);
      }
      // Si no hay días específicos, mostrar siempre hasta alcanzar la frecuencia
      return true;

    case 'PERSONALIZADO':
      // Para hábitos con periodos personalizados
      const ultimaCompletacion = obtenerUltimaCompletacion(historialCompletado);
      
      if (!ultimaCompletacion) {
        // Si nunca se ha completado, mostrar
        return true;
      }
      
      // Determinar el intervalo según el periodo
      let diasIntervalo = frecuencia;
      
      switch (periodo) {
        case 'CADA_SEMANA':
          diasIntervalo = frecuencia * 7;
          break;
        case 'CADA_MES':
          // Aproximación simple: considerar un mes como 30 días
          diasIntervalo = frecuencia * 30;
          break;
        case 'CADA_TRIMESTRE':
          diasIntervalo = frecuencia * 90;
          break;
        case 'CADA_SEMESTRE':
          diasIntervalo = frecuencia * 180;
          break;
        case 'CADA_ANO':
          diasIntervalo = frecuencia * 365;
          break;
        // Para CADA_DIA, usar directamente la frecuencia
      }
      
      // Calcular si ya pasó el tiempo suficiente desde la última completación
      const diasDesdeUltimaCompletacion = differenceInDays(
        fechaObjetivo,
        ultimaCompletacion
      );
      
      return diasDesdeUltimaCompletacion >= diasIntervalo;

    default:
      // Para otros tipos no reconocidos, mostrar por defecto
      return true;
  }
};

/**
 * Cuenta cuántas veces se ha completado un hábito en el período actual
 * @param {Date} fechaObjetivo - Fecha de referencia
 * @param {String} tipo - Tipo de cadencia (DIARIO, SEMANAL, etc.)
 * @param {String} periodo - Periodo de cadencia (CADA_DIA, CADA_SEMANA, etc.)
 * @param {Array} historialCompletado - Arreglo de fechas donde el hábito fue completado
 * @returns {Number} - Cantidad de veces completado en el período
 */
export const contarCompletadosEnPeriodo = (fechaObjetivo, tipo, periodo, historialCompletado) => {
  if (!historialCompletado || historialCompletado.length === 0) {
    return 0;
  }

  // Normalizar fechas del historial
  const historialNormalizado = historialCompletado.map(fecha => {
    const fechaNormalizada = new Date(fecha);
    fechaNormalizada.setHours(12, 0, 0, 0);
    return fechaNormalizada;
  });

  let inicioIntervalo, finIntervalo;

  switch (tipo) {
    case 'DIARIO':
      // Para hábitos diarios, contar solo el día actual
      inicioIntervalo = new Date(fechaObjetivo);
      inicioIntervalo.setHours(0, 0, 0, 0);
      finIntervalo = new Date(fechaObjetivo);
      finIntervalo.setHours(23, 59, 59, 999);
      break;

    case 'SEMANAL':
      // Para hábitos semanales, considerar la semana actual
      inicioIntervalo = startOfWeek(fechaObjetivo, { weekStartsOn: 0 });
      finIntervalo = addDays(inicioIntervalo, 6);
      finIntervalo.setHours(23, 59, 59, 999);
      break;

    case 'MENSUAL':
      // Para hábitos mensuales, considerar el mes actual
      inicioIntervalo = startOfMonth(fechaObjetivo);
      finIntervalo = endOfMonth(fechaObjetivo);
      finIntervalo.setHours(23, 59, 59, 999);
      break;

    case 'PERSONALIZADO':
      // Para hábitos personalizados, el intervalo depende del periodo
      const ultimaCompletacion = obtenerUltimaCompletacion(historialCompletado);
      
      if (!ultimaCompletacion) {
        // Si nunca se ha completado, no hay nada que contar
        return 0;
      }
      
      // El intervalo va desde la última completación hasta la fecha objetivo
      inicioIntervalo = ultimaCompletacion;
      finIntervalo = fechaObjetivo;
      break;

    default:
      // Para otros tipos, considerar solo el día actual
      inicioIntervalo = new Date(fechaObjetivo);
      inicioIntervalo.setHours(0, 0, 0, 0);
      finIntervalo = new Date(fechaObjetivo);
      finIntervalo.setHours(23, 59, 59, 999);
  }

  // Contar cuántas fechas del historial están dentro del intervalo
  return historialNormalizado.filter(fecha => 
    isWithinInterval(fecha, { 
      start: inicioIntervalo, 
      end: finIntervalo 
    })
  ).length;
};

/**
 * Obtiene la fecha de la última completación del hábito
 * @param {Array} historialCompletado - Arreglo de fechas donde el hábito fue completado
 * @returns {Date|null} - Fecha de la última completación o null si nunca se ha completado
 */
export const obtenerUltimaCompletacion = (historialCompletado) => {
  if (!historialCompletado || historialCompletado.length === 0) {
    return null;
  }

  // Convertir todas las fechas a objetos Date para comparación
  const fechas = historialCompletado.map(fecha => {
    if (typeof fecha === 'string') {
      return parseISO(fecha);
    }
    return new Date(fecha);
  });

  // Ordenar fechas descendentemente
  fechas.sort((a, b) => b - a);

  // Devolver la fecha más reciente
  return fechas[0];
};

/**
 * Genera un mensaje descriptivo del estado de cadencia
 * @param {Object} cadenciaConfig - Configuración de cadencia
 * @param {Array} historialCompletado - Historial de completados
 * @param {Date} fechaActual - Fecha actual (opcional, por defecto es hoy)
 * @returns {String} - Mensaje descriptivo
 */
export const generarMensajeCadencia = (cadenciaConfig, historialCompletado = [], fechaActual = new Date()) => {
  if (!cadenciaConfig || !cadenciaConfig.activo) {
    return 'Hábito inactivo';
  }

  const tipo = (cadenciaConfig.tipo || 'DIARIO').toUpperCase();
  const frecuencia = Number(cadenciaConfig.frecuencia || 1);
  const completadosEnPeriodo = contarCompletadosEnPeriodo(
    fechaActual, 
    tipo, 
    cadenciaConfig.periodo, 
    historialCompletado
  );

  const ultimaCompletacion = obtenerUltimaCompletacion(historialCompletado);
  const diasDesdeUltima = ultimaCompletacion ? 
    differenceInDays(fechaActual, ultimaCompletacion) : 
    null;

  let mensaje = '';

  switch (tipo) {
    case 'DIARIO':
      mensaje = `${completadosEnPeriodo}/${frecuencia} completados hoy`;
      break;
    case 'SEMANAL':
      mensaje = `${completadosEnPeriodo}/${frecuencia} completados esta semana`;
      break;
    case 'MENSUAL':
      mensaje = `${completadosEnPeriodo}/${frecuencia} completados este mes`;
      break;
    case 'PERSONALIZADO':
      mensaje = `${completadosEnPeriodo}/${frecuencia} completados`;
      if (diasDesdeUltima !== null) {
        mensaje += `, último hace ${diasDesdeUltima} día(s)`;
      }
      break;
    default:
      mensaje = `${completadosEnPeriodo}/${frecuencia} completados en período actual`;
  }

  return mensaje;
};

/**
 * Función para normalizar la frecuencia a un número entero
 */
const normalizeFrecuencia = (value) => {
  const stringValue = String(value || '1');
  const parsed = parseInt(stringValue, 10);
  return Number(isNaN(parsed) ? 1 : Math.max(1, parsed));
};

/**
 * Función para obtener etiqueta descriptiva de la frecuencia
 * @param {Object} config - Configuración de cadencia
 * @returns {String} - Etiqueta descriptiva
 */
export const getFrecuenciaLabel = (config) => {
  if (!config?.activo) return 'Inactivo';
  
  const frecuencia = normalizeFrecuencia(config.frecuencia || 1);
  const plural = frecuencia > 1 ? 'veces' : 'vez';
  
  const tipo = (config?.tipo || 'DIARIO').toUpperCase();
  const periodo = config?.periodo || 'CADA_DIA';
  
  switch (tipo) {
    case 'DIARIO':
      return `${frecuencia} ${plural} por día`;
    case 'SEMANAL':
      // Si hay días específicos de la semana seleccionados, mostrarlos
      if (config.diasSemana && config.diasSemana.length > 0) {
        const diasNames = config.diasSemana
          .map(dia => DIAS_SEMANA.find(d => d.value === dia)?.label.slice(0, 3))
          .filter(Boolean)
          .join(', ');
        return `${frecuencia} ${plural}/sem (${diasNames})`;
      }
      return `${frecuencia} ${plural} por semana`;
    case 'MENSUAL':
      // Si hay días específicos del mes seleccionados, mostrarlos
      if (config.diasMes && config.diasMes.length > 0) {
        if (config.diasMes.length <= 3) {
          return `${frecuencia} ${plural}/mes (días ${config.diasMes.join(', ')})`;
        } else {
          return `${frecuencia} ${plural}/mes (${config.diasMes.length} días)`;
        }
      }
      return `${frecuencia} ${plural} por mes`;
    case 'TRIMESTRAL':
      return `${frecuencia} ${plural} por trimestre`;
    case 'SEMESTRAL':
      return `${frecuencia} ${plural} por semestre`;
    case 'ANUAL':
      return `${frecuencia} ${plural} por año`;
    case 'PERSONALIZADO':
      if (periodo === 'CADA_DIA') {
        return `Cada ${frecuencia} días`;
      } else if (periodo === 'CADA_SEMANA') {
        return `Cada ${frecuencia} semanas`;
      } else if (periodo === 'CADA_MES') {
        return `Cada ${frecuencia} meses`;
      } else if (periodo === 'CADA_TRIMESTRE') {
        return `Cada ${frecuencia} trimestres`;
      } else if (periodo === 'CADA_SEMESTRE') {
        return `Cada ${frecuencia} semestres`;
      } else if (periodo === 'CADA_ANO') {
        return `Cada ${frecuencia} años`;
      }
      return `Personalizado: ${frecuencia} ${periodo.toLowerCase()}`;
    default:
      return `${frecuencia} ${plural} por día`;
  }
};

// Constante con los días de la semana
export const DIAS_SEMANA = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' }
];

/**
 * Formatea correctamente una fecha para mostrar el nombre de la semana
 * @param {Date} fecha - La fecha a formatear
 * @returns {string} - Formato correcto de la semana
 */
export const formatearSemana = (fecha) => {
  if (!fecha) return 'Semana desconocida';
  
  try {
    // Obtener inicio y fin de semana
    const inicio = startOfWeek(fecha, { locale: es });
    const fin = endOfWeek(fecha, { locale: es });
    
    // Formatear como "Semana 23-29 Mar 2025"
    const diaInicio = inicio.getDate();
    const diaFin = fin.getDate();
    const mes = fin.toLocaleDateString('es', { month: 'short' });
    const año = fin.getFullYear();
    
    // Garantizar que el año solo aparezca una vez
    return `Semana ${diaInicio}-${diaFin} ${mes} ${año}`;
  } catch (error) {
    console.error('Error al formatear semana:', error);
    return 'Semana inválida';
  }
};

export default {
  debesMostrarHabitoEnFecha,
  contarCompletadosEnPeriodo,
  obtenerUltimaCompletacion,
  generarMensajeCadencia,
  getFrecuenciaLabel,
  formatearSemana
}; 