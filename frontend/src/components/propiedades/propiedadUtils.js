// Utilidades centralizadas para propiedades

import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

// Pluralización
export function pluralizar(cantidad, singular, plural) {
  return cantidad === 1 ? singular : plural;
}

// Estado de contrato
export function getEstadoContrato(contrato) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicio = new Date(contrato.fechaInicio);
  const fin = new Date(contrato.fechaFin);
  if (inicio <= hoy && fin >= hoy) {
    return 'ACTIVO';
  } else if (inicio > hoy) {
    return contrato.estado === 'RESERVADO' ? 'RESERVADO' : 'PLANEADO';
  } else if (fin < hoy) {
    return 'FINALIZADO';
  }
  return contrato.estado || 'PENDIENTE';
}

// Color de estado de inquilino
export function getInquilinoStatusColor(estado) {
  const statusColors = {
    'ACTIVO': '#4caf50',
    'RESERVADO': '#ff9800',
    'PENDIENTE': '#2196f3',
    'INACTIVO': '#9e9e9e'
  };
  return statusColors[estado] || '#9e9e9e';
}

// Mapeo de iconos para estados
export const STATUS_ICONS = {
  'DISPONIBLE': 'PendingActions',
  'OCUPADA': 'CheckCircle',
  'MANTENIMIENTO': 'Engineering',
  'RESERVADA': 'BookmarkAdded'
};

// Mapeo de colores para estados
export const STATUS_COLORS = {
  'DISPONIBLE': '#4caf50',
  'OCUPADA': '#2196f3',
  'MANTENIMIENTO': '#ff9800',
  'RESERVADA': '#9c27b0'
};

// Calcula el progreso del contrato
export function calcularProgresoContrato(contratos, montoMensual) {
  const contratoActivo = contratos.find(contrato => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicio = new Date(contrato.fechaInicio);
    const fin = new Date(contrato.fechaFin);
    return inicio <= hoy && fin >= hoy && contrato.estado === 'ACTIVO';
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
  const hoy = new Date();
  const inicio = new Date(contratoActivo.fechaInicio);
  const fin = new Date(contratoActivo.fechaFin);
  const mesTotales = (fin.getFullYear() - inicio.getFullYear()) * 12 + (fin.getMonth() - inicio.getMonth()) + 1;
  const mesesTranscurridos = Math.min(
    Math.max(0, (hoy.getFullYear() - inicio.getFullYear()) * 12 + (hoy.getMonth() - inicio.getMonth()) + 1),
    mesTotales
  );
  const porcentaje = Math.min(100, (mesesTranscurridos / mesTotales) * 100);
  montoMensual = montoMensual || 0;
  const montoAcumulado = mesesTranscurridos * montoMensual;
  const montoTotal = mesTotales * montoMensual;
  return {
    porcentaje,
    mesesTranscurridos,
    mesTotales,
    montoAcumulado,
    montoTotal,
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

// Calcular progreso de ocupación
export function calcularProgresoOcupacion(propiedad) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const contratos = propiedad.contratos || [];
  const montoMensual = propiedad.montoMensual || 0;
  const montoPorDia = montoMensual / 30;

  // Buscar contrato activo
  let contratoActivo = contratos.find(contrato => {
    const inicio = new Date(contrato.fechaInicio);
    const fin = new Date(contrato.fechaFin);
    return inicio <= hoy && fin >= hoy && contrato.estado === 'ACTIVO';
  });

  // Buscar contrato de referencia si no hay activo
  let contratoReferencia = contratoActivo;
  if (!contratoActivo && contratos.length > 0) {
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

  // Si hay contrato de referencia, usar sus fechas
  let inicio, fin, diasTotales = 30, diasTranscurridos = 0, diasRestantes = 0;
  let montoTotal = 0, montoAcumulado = 0;
  if (contratoReferencia) {
    inicio = new Date(contratoReferencia.fechaInicio);
    fin = new Date(contratoReferencia.fechaFin);
    // Sumar 1 día para incluir el día de fin
    diasTotales = Math.max(1, Math.round((fin - inicio) / (1000 * 60 * 60 * 24)) + 1);
    montoTotal = Math.round((diasTotales * montoPorDia) * 100) / 100;

    if (hoy < inicio) {
      diasTranscurridos = 0;
      diasRestantes = diasTotales;
    } else if (hoy > fin) {
      diasTranscurridos = diasTotales;
      diasRestantes = 0;
    } else {
      diasTranscurridos = Math.round((hoy - inicio) / (1000 * 60 * 60 * 24)) + 1;
      diasRestantes = Math.max(0, diasTotales - diasTranscurridos);
    }
    montoAcumulado = Math.round((diasTranscurridos * montoPorDia) * 100) / 100;
  } else {
    // Sin contratos, estimado de un mes si hay precio
    montoTotal = Math.round(montoMensual * 100) / 100;
    diasTotales = 30;
    diasTranscurridos = 0;
    diasRestantes = 0;
    montoAcumulado = 0;
  }

  // Si no hay precio, todo es 0
  if (montoMensual === 0) {
    return {
      porcentaje: 0,
      diasTranscurridos,
      diasTotales,
      diasRestantes,
      estadoTiempo: 'Sin precio',
      montoMensual: 0,
      montoPorDia: 0,
      montoAcumulado: 0,
      montoTotal: 0,
      tieneContrato: !!contratoReferencia,
      estado: propiedad.estado || 'DISPONIBLE',
      contrato: contratoReferencia || null
    };
  }

  // Estado textual
  let estadoTiempo = '';
  if (contratoReferencia) {
    if (hoy < inicio) {
      estadoTiempo = 'No iniciado';
    } else if (hoy > fin) {
      estadoTiempo = 'Finalizado';
    } else {
      estadoTiempo = `${diasRestantes} días restantes`;
    }
  } else {
    estadoTiempo = 'Sin contrato';
  }

  // Porcentaje
  const porcentaje = diasTotales > 0 ? Math.min(100, (diasTranscurridos / diasTotales) * 100) : 0;

  // Estado
  let estado = propiedad.estado || 'DISPONIBLE';
  if (contratoActivo) {
    estado = 'OCUPADA';
    if (contratoActivo.esMantenimiento || contratoActivo.tipoContrato === 'MANTENIMIENTO') {
      estado = 'MANTENIMIENTO';
    }
  }

  return {
    porcentaje,
    diasTranscurridos,
    diasTotales,
    diasRestantes,
    estadoTiempo,
    montoMensual,
    montoPorDia: Math.round(montoPorDia * 100) / 100,
    montoAcumulado,
    montoTotal,
    tieneContrato: !!contratoReferencia,
    estado,
    contrato: contratoReferencia || null
  };
}

// Calcula los días restantes de un contrato activo
export function calcularDiasRestantes(contratos) {
  if (!contratos || contratos.length === 0) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const contratoActivo = contratos.find(contrato => {
    const fechaInicio = new Date(contrato.fechaInicio);
    const fechaFin = new Date(contrato.fechaFin);
    return fechaInicio <= hoy && fechaFin >= hoy && contrato.estado === 'ACTIVO';
  });
  if (!contratoActivo) return null;
  const fechaFin = new Date(contratoActivo.fechaFin);
  const diferenciaTiempo = fechaFin.getTime() - hoy.getTime();
  return Math.ceil(diferenciaTiempo / (1000 * 3600 * 24));
}

// Calcula estadísticas de la propiedad
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
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const contratos = propiedad.contratos || [];
  let tieneContratoActivo = false;
  let tieneContratoReservado = false;
  for (const contrato of contratos) {
    const inicio = new Date(contrato.fechaInicio);
    const fin = new Date(contrato.fechaFin);
    const estado = getEstadoContrato(contrato);
    if (estado === 'ACTIVO') {
      tieneContratoActivo = true;
      break;
    } else if (estado === 'RESERVADO') {
      tieneContratoReservado = true;
    }
  }
  if (tieneContratoActivo) {
    stats.ocupadas = 1;
    stats.disponibles = 0;
    stats.estado = 'OCUPADA';
    stats.porcentajeOcupacion = 100;
  } else if (propiedad.estado === 'MANTENIMIENTO') {
    stats.mantenimiento = 1;
    stats.disponibles = 0;
    stats.estado = 'MANTENIMIENTO';
    stats.porcentajeOcupacion = 0;
  } else if (tieneContratoReservado || propiedad.estado === 'RESERVADA') {
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

// Devuelve el ícono del estado del inquilino
export function getInquilinoStatusIcon(estado) {
  const statusIcons = {
    'ACTIVO': 'CheckCircle',
    'RESERVADO': 'BookmarkAdded',
    'PENDIENTE': 'PendingActions',
    'INACTIVO': 'DescriptionIcon'
  };
  return statusIcons[estado] || statusIcons['INACTIVO'];
}

// Chip de estado estilizado
export const StatusChip = styled(Box)(({ theme, customcolor }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 4px',
  fontSize: '0.75rem',
  color: customcolor || theme.palette.text.secondary,
  height: 20,
  marginLeft: theme.spacing(1),
  '& .MuiSvgIcon-root': {
    fontSize: '0.9rem'
  }
})); 