// Utilidades centralizadas para propiedades

import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  calcularEstadisticasContrato, 
  calcularAlquilerMesActual, 
  calcularAlquilerMensualPromedio,
  getEstadoContrato as getEstadoContratoFromUtils,
  getCuentaYMoneda as getCuentaYMonedaFromUtils,
  calcularProgresoFinancieroContrato
} from './contratos';

// Función para pluralizar palabras
export function pluralizar(cantidad, singular, plural) {
  return cantidad === 1 ? singular : plural;
}

// Estado de contrato - ahora reutiliza la función de contratoUtils
export function getEstadoContrato(contrato) {
  return getEstadoContratoFromUtils(contrato);
}

// Función centralizada para obtener cuenta y moneda - reutiliza contratoUtils
export function getCuentaYMoneda(contrato, relatedData) {
  return getCuentaYMonedaFromUtils(contrato, relatedData);
}

// Nota: Las funciones de colores e iconos de estado se han movido a StatusSystem.js
// para unificar el sistema de estados en toda la aplicación





// STATUS_COLORS movido a StatusSystem.js

// Calcula el progreso del contrato - ahora reutiliza contratoUtils
export function calcularProgresoContrato(contratos, montoMensual) {
  if (!contratos || contratos.length === 0 || !montoMensual) {
    return {
      porcentaje: 0,
      mesesTranscurridos: 0,
      mesTotales: 0,
      montoAcumulado: 0,
      montoTotal: 0,
      tieneContrato: false
    };
  }

  // Buscar contrato activo
  const contratoActivo = contratos.find(contrato => {
    const estado = getEstadoContrato(contrato);
    return estado === 'ACTIVO';
  });

  if (!contratoActivo) {
    return {
      porcentaje: 0,
      mesesTranscurridos: 0,
      mesTotales: 0,
      montoAcumulado: 0,
      montoTotal: 0,
      tieneContrato: false
    };
  }

  // Usar las funciones de contratoUtils para progreso financiero real
  const progresoFinanciero = calcularProgresoFinancieroContrato(contratoActivo);
  
  return {
    porcentaje: progresoFinanciero.porcentaje,
    mesesTranscurridos: progresoFinanciero.cuotasPagadas,
    mesTotales: progresoFinanciero.cuotasTotales,
    montoAcumulado: progresoFinanciero.montoAcumulado,
    montoTotal: progresoFinanciero.montoTotal,
    tieneContrato: true,
    contrato: contratoActivo
  };
}

// Devuelve el nombre legible del tipo de habitación
export function getNombreTipoHabitacion(tipo) {
  const tipos = {
    'BAÑO': 'Baño',
    'TOILETTE': 'Toilette',
    'DORMITORIO_DOBLE': 'Dormitorio doble',
    'DORMITORIO_SIMPLE': 'Dormitorio simple',
    'ESTUDIO': 'Estudio',
    'COCINA': 'Cocina',
    'DESPENSA': 'Despensa',
    'SALA_PRINCIPAL': 'Sala principal',
    'PATIO': 'Patio',
    'JARDIN': 'Jardín',
    'TERRAZA': 'Terraza',
    'LAVADERO': 'Lavadero'
  };
  return tipos[tipo] || tipo;
}

// Agrupa habitaciones por tipo
export function agruparHabitaciones(habitaciones) {
  return (habitaciones || []).reduce((acc, hab) => {
    const tipo = hab.tipo === 'OTRO' ? hab.nombrePersonalizado : hab.tipo;
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(hab);
    return acc;
  }, {});
}

// Función para calcular el monto mensual promedio desde contratos activos
const calcularMontoMensualDesdeContratos = (contratos = []) => {
  if (!contratos || contratos.length === 0) return 0;
  
  // Buscar contrato activo (no de mantenimiento)
  let contratoReferencia = contratos.find(contrato => 
    contrato.estado === 'ACTIVO' && 
    !contrato.esMantenimiento && 
    contrato.tipoContrato === 'ALQUILER'
  );
  
  // Si no hay activo, buscar planeado
  if (!contratoReferencia) {
    contratoReferencia = contratos.find(contrato => 
      contrato.estado === 'PLANEADO' && 
      !contrato.esMantenimiento && 
      contrato.tipoContrato === 'ALQUILER'
    );
  }
  
  // Si no hay planeado, buscar cualquier contrato de alquiler
  if (!contratoReferencia) {
    contratoReferencia = contratos.find(contrato => 
      !contrato.esMantenimiento && 
      contrato.tipoContrato === 'ALQUILER'
    );
  }
  
  if (!contratoReferencia) return 0;
  
  // Usar la función centralizada de contratoUtils
  return calcularAlquilerMensualPromedio(contratoReferencia);
};

// Calcular progreso de ocupación - ahora reutiliza contratoUtils
export function calcularProgresoOcupacion(propiedad) {
  const contratos = propiedad.contratos || [];
  const montoMensual = calcularMontoMensualDesdeContratos(contratos);

  // Buscar contrato activo
  let contratoActivo = contratos.find(contrato => {
    const estado = getEstadoContrato(contrato);
    return estado === 'ACTIVO';
  });

  // Buscar contrato de referencia si no hay activo
  let contratoReferencia = contratoActivo;
  if (!contratoActivo && contratos.length > 0) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Futuro más próximo
    const futuros = contratos.filter(c => new Date(c.fechaInicio) > hoy);
    if (futuros.length > 0) {
      contratoReferencia = futuros.sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio))[0];
    } else {
      // Último pasado
      const pasados = contratos.filter(c => new Date(c.fechaFin) < hoy);
      if (pasados.length > 0) {
        contratoReferencia = pasados.sort((a, b) => new Date(b.fechaFin) - new Date(a.fechaFin))[0];
      }
    }
  }

  // Si no hay contrato de referencia
  if (!contratoReferencia) {
    return {
      porcentaje: 0,
      diasTranscurridos: 0,
      diasTotales: 30,
      diasRestantes: 0,
      estadoTiempo: 'Sin contrato',
      montoMensual: 0,
      montoPorDia: 0,
      montoAcumulado: 0,
      montoTotal: 0,
      tieneContrato: false,
      estado: propiedad.estado?.[0] || 'DISPONIBLE',
      contrato: null
    };
  }

  // Usar las funciones de contratoUtils para cálculos precisos
  const stats = calcularEstadisticasContrato(contratoReferencia);
  const alquilerMesActual = calcularAlquilerMesActual(contratoReferencia);

  // Estado textual
  let estadoTiempo = '';
  const hoy = new Date();
  const inicio = new Date(contratoReferencia.fechaInicio);
  const fin = new Date(contratoReferencia.fechaFin);
  
  if (hoy < inicio) {
    estadoTiempo = 'No iniciado';
  } else if (hoy > fin) {
    estadoTiempo = 'Finalizado';
  } else {
    estadoTiempo = `${stats.diasTotales - stats.diasTranscurridos} días restantes`;
  }

  // Estado de la propiedad - RESPETAR el estado real de la propiedad
  let estado = propiedad.estado?.[0] || 'DISPONIBLE';
  
  // Solo cambiar a OCUPADA si la propiedad no está RESERVADA y hay contrato activo
  if (contratoActivo && estado !== 'RESERVADA') {
    estado = 'OCUPADA';
    if (contratoActivo.esMantenimiento || contratoActivo.tipoContrato === 'MANTENIMIENTO') {
      estado = 'MANTENIMIENTO';
    }
  }

  return {
    porcentaje: stats.porcentajeCompletado,
    diasTranscurridos: stats.diasTranscurridos,
    diasTotales: stats.diasTotales,
    diasRestantes: stats.diasTotales - stats.diasTranscurridos,
    estadoTiempo,
    montoMensual,
    montoPorDia: montoMensual / 30,
    montoAcumulado: stats.precioTranscurridoDias,
    montoTotal: stats.precioTotal,
    alquilerMesActual,
    tieneContrato: true,
    estado,
    contrato: contratoReferencia
  };
}

// Calcula los días restantes de un contrato activo - ahora reutiliza contratoUtils
export function calcularDiasRestantes(contratos) {
  if (!contratos || contratos.length === 0) return null;
  
  const contratoActivo = contratos.find(contrato => {
    const estado = getEstadoContrato(contrato);
    return estado === 'ACTIVO';
  });
  
  if (!contratoActivo) return null;
  
  const stats = calcularEstadisticasContrato(contratoActivo); // Solo necesitamos los días
  return stats.diasTotales - stats.diasTranscurridos;
}

// Calcula estadísticas de la propiedad - ahora reutiliza contratoUtils
export function calcularEstadisticasPropiedad(propiedad) {
  
  const stats = {
    total: 1,
    ocupadas: 0,
    disponibles: 0,
    mantenimiento: 0,
    reservadas: 0,
    porcentajeOcupacion: 0,
    estado: 'DISPONIBLE'
  };

  const contratos = propiedad.contratos || [];
  let tieneContratoActivo = false;

  for (const contrato of contratos) {
    const estado = getEstadoContrato(contrato);
    if (estado === 'ACTIVO') {
      tieneContratoActivo = true;
      break;
    }
  }

  if (tieneContratoActivo && !propiedad.estado?.includes('RESERVADA')) {
    stats.ocupadas = 1;
    stats.disponibles = 0;
    stats.estado = 'OCUPADA';
    stats.porcentajeOcupacion = 100;
  } else if (propiedad.estado?.includes('MANTENIMIENTO')) {
    stats.mantenimiento = 1;
    stats.disponibles = 0;
    stats.estado = 'MANTENIMIENTO';
    stats.porcentajeOcupacion = 0;
  } else if (propiedad.estado?.includes('RESERVADA')) {
    stats.reservadas = 1;
    stats.disponibles = 0;
    stats.estado = 'RESERVADA';
    stats.porcentajeOcupacion = 0;
  } else {
    stats.disponibles = 1;
    stats.estado = 'DISPONIBLE';
    stats.porcentajeOcupacion = 0;
  }

  return stats;
}

// StatusChip movido a PropiedadStyles.jsx 

// Función para contar items de inventario por habitación
export function contarItemsPorHabitacion(habitaciones = [], inventarios = []) {
  return habitaciones.map(habitacion => {
    const itemsEnHabitacion = inventarios.filter(inv => 
      inv.habitacion && String(inv.habitacion._id || inv.habitacion) === String(habitacion._id)
    ).length;
    
    return {
      ...habitacion,
      itemsCount: itemsEnHabitacion
    };
  });
}

// Función para obtener estadísticas de inventario por habitación
export function obtenerEstadisticasInventarioPorHabitacion(habitaciones = [], inventarios = []) {
  const habitacionesConItems = contarItemsPorHabitacion(habitaciones, inventarios);
  
  return {
    habitaciones: habitacionesConItems,
    totalItems: inventarios.length,
    habitacionesConItems: habitacionesConItems.filter(h => h.itemsCount > 0).length,
    habitacionesSinItems: habitacionesConItems.filter(h => h.itemsCount === 0).length
  };
}

// Función para obtener el total de items por propiedad
export function obtenerTotalItemsPropiedad(inventarios = []) {
  return inventarios.length;
}

// Función para obtener items por categoría
export function obtenerItemsPorCategoria(inventarios = []) {
  return inventarios.reduce((acc, item) => {
    const categoria = item.categoria || 'Sin categoría';
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(item);
    return acc;
  }, {});
} 