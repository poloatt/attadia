// Función para obtener la etiqueta del estado
export const getEstadoLabel = (estado) => {
  switch (estado) {
    case 'ACTIVO': return 'Contrato activo';
    case 'FINALIZADO': return 'Contrato finalizado';
    case 'PLANEADO': return 'Contrato planeado';
    case 'MANTENIMIENTO': return 'Contrato de mantenimiento';
    case 'RESERVADO': return 'Contrato reservado';
    default: return estado;
  }
};

// Función para obtener el color del estado
export const getEstadoColor = (estado) => {
  switch (estado) {
    case 'ACTIVO': return '#4caf50';
    case 'RESERVADO': return '#ff9800';
    case 'PLANEADO': return '#2196f3';
    case 'FINALIZADO': return '#9e9e9e';
    case 'PENDIENTE': return '#f44336';
    case 'MANTENIMIENTO': return '#ff9800';
    default: return '#9e9e9e';
  }
};

// Función para obtener el color del estado (versión para tema)
export const getEstadoColorTheme = (estado) => {
  switch (estado) {
    case 'ACTIVO': return 'success.main';
    case 'RESERVADO': return 'warning.main';
    case 'PLANEADO': return 'info.main';
    case 'FINALIZADO': return 'text.secondary';
    case 'PENDIENTE': return 'error.main';
    case 'MANTENIMIENTO': return 'warning.main';
    default: return 'text.secondary';
  }
};

// Función para determinar el estado del contrato
export const getEstadoContrato = (contrato) => {
  // Usar estadoActual si está disponible
  if (contrato.estadoActual) {
    return contrato.estadoActual;
  }
  
  // Fallback al cálculo manual si no hay estadoActual
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
};

// Función para calcular tiempo restante
export const calcularTiempoRestante = (fechaFin) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fin = new Date(fechaFin);
  const diferenciaDias = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));
  
  if (diferenciaDias < 0) {
    return null;
  } else if (diferenciaDias > 90) {
    const meses = Math.floor(diferenciaDias / 30);
    return `${meses} meses`;
  } else {
    return `${diferenciaDias} días`;
  }
};

// Función para calcular duración total
export const calcularDuracionTotal = (fechaInicio, fechaFin) => {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const meses = (fin.getFullYear() - inicio.getFullYear()) * 12 + 
               (fin.getMonth() - inicio.getMonth());
  const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
  
  if (meses > 0) {
    return `${meses} meses`;
  } else {
    return `${dias} días`;
  }
};

// Función para formatear fecha
export const formatFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}; 