// Optimizador de estados para el frontend - Usa StatusSystem
import { getEstadoInfo, getStatusIconComponent, getEstadoColor, getEstadoText } from '../components/common/StatusSystem.js';

// Cache para estados calculados
const estadoCache = new Map();

// Función optimizada para calcular estado de contrato
export function calcularEstadoContratoOptimizado(contrato) {
  if (!contrato) return 'PLANEADO';
  
  // Usar estadoActual si ya está calculado
  if (contrato.estadoActual) {
    return contrato.estadoActual;
  }
  
  // Generar clave única para cache
  const key = generarClaveContrato(contrato);
  
  if (estadoCache.has(key)) {
    return estadoCache.get(key);
  }
  
  // Calcular estado
  const estado = calcularEstadoContrato(contrato);
  estadoCache.set(key, estado);
  
  return estado;
}

// Función para generar clave única de contrato
function generarClaveContrato(contrato) {
  const fechaInicio = contrato.fechaInicio ? new Date(contrato.fechaInicio).toISOString().split('T')[0] : 'null';
  const fechaFin = contrato.fechaFin ? new Date(contrato.fechaFin).toISOString().split('T')[0] : 'null';
  const tipoContrato = contrato.tipoContrato || 'ALQUILER';
  const esMantenimiento = contrato.esMantenimiento || false;
  
  return `${fechaInicio}_${fechaFin}_${tipoContrato}_${esMantenimiento}`;
}

// Función para calcular estado de contrato
function calcularEstadoContrato(contrato) {
  if (!contrato.fechaInicio) {
    return contrato.estado || 'PLANEADO';
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicio = new Date(contrato.fechaInicio);
  inicio.setHours(0, 0, 0, 0);
  
  if (!contrato.fechaFin) {
    if (inicio <= hoy) {
      return contrato.esMantenimiento || contrato.tipoContrato === 'MANTENIMIENTO' ? 'MANTENIMIENTO' : 'ACTIVO';
    } else {
      return 'PLANEADO';
    }
  }
  
  const fin = new Date(contrato.fechaFin);
  fin.setHours(0, 0, 0, 0);
  
  if (contrato.esMantenimiento || contrato.tipoContrato === 'MANTENIMIENTO') {
    if (inicio <= hoy && fin > hoy) {
      return 'MANTENIMIENTO';
    } else if (inicio > hoy) {
      return 'PLANEADO';
    } else {
      return 'FINALIZADO';
    }
  }
  
  if (inicio <= hoy && fin > hoy) {
    return 'ACTIVO';
  } else if (inicio > hoy) {
    return 'PLANEADO';
  } else {
    return 'FINALIZADO';
  }
}

// Función para obtener información completa de estado usando StatusSystem
export function getEstadoCompleto(contrato, tipo = 'CONTRATO') {
  const estado = calcularEstadoContratoOptimizado(contrato);
  return {
    estado,
    info: getEstadoInfo(estado, tipo),
    icon: getStatusIconComponent(estado, tipo),
    color: getEstadoColor(estado, tipo),
    text: getEstadoText(estado, tipo)
  };
}

// Función para procesar múltiples contratos de una vez
export function procesarContratosOptimizado(contratos) {
  return contratos.map(contrato => ({
    ...contrato,
    estadoActual: calcularEstadoContratoOptimizado(contrato),
    estadoInfo: getEstadoCompleto(contrato, 'CONTRATO')
  }));
}

// Función para limpiar cache
export function limpiarCacheEstados() {
  estadoCache.clear();
}

// Función para obtener estadísticas del cache
export function getCacheStats() {
  return {
    size: estadoCache.size,
    keys: Array.from(estadoCache.keys())
  };
}

// Limpiar cache cada 5 minutos
setInterval(limpiarCacheEstados, 5 * 60 * 1000); 