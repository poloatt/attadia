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
    return meses;
  } else {
    return diferenciaDias;
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

// Función para obtener el apellido del primer inquilino de un contrato
export const getApellidoInquilinoContrato = (contrato) => {
  if (!contrato) return '';
  // Puede ser array o un solo objeto
  if (Array.isArray(contrato.inquilino) && contrato.inquilino.length > 0) {
    return contrato.inquilino[0]?.apellido || '';
  } else if (contrato.inquilino && typeof contrato.inquilino === 'object') {
    return contrato.inquilino.apellido || '';
  }
  return '';
};

// Función para calcular duración del contrato en formato 'mes YYYY - mes YYYY'
export const calcularRangoMesesContrato = (fechaInicio, fechaFin) => {
  if (!fechaInicio || !fechaFin) return '';
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${meses[inicio.getMonth()]} ${inicio.getFullYear()} - ${meses[fin.getMonth()]} ${fin.getFullYear()}`;
};

// Función centralizada para calcular meses entre dos fechas
export const calcularMesesEntreFechas = (fechaInicio, fechaFin) => {
  if (!fechaInicio || !fechaFin) return 0;
  
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  
  // Normalizar fechas al primer día del mes para cálculos consistentes
  inicio.setDate(1);
  fin.setDate(1);
  
  // Calcular diferencia en meses
  const meses = (fin.getFullYear() - inicio.getFullYear()) * 12 + 
                (fin.getMonth() - inicio.getMonth());
  
  // Si la fecha fin es posterior o igual a la fecha inicio, sumar 1 para incluir ambos meses
  return fin >= inicio ? meses + 1 : 0;
};

// Función para calcular el alquiler mensual promedio basado en precio total y duración
export const calcularAlquilerMensualPromedio = (contrato) => {
  if (!contrato || !contrato.precioTotal || contrato.esMantenimiento) return 0;
  
  const mesesTotales = calcularMesesEntreFechas(contrato.fechaInicio, contrato.fechaFin);
  if (mesesTotales === 0) return 0;
  
  return Math.round((contrato.precioTotal / mesesTotales) * 100) / 100;
};

// Función para calcular el precio total del contrato (ahora es un campo directo)
export const calcularPrecioTotalContrato = (contrato) => {
  if (!contrato) return 0;
  return contrato.precioTotal || 0;
};

// Función para calcular el precio transcurrido en días
export const calcularPrecioTranscurridoDias = (contrato) => {
  if (!contrato || !contrato.precioTotal || contrato.esMantenimiento) return 0;
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicio = new Date(contrato.fechaInicio);
  const fin = new Date(contrato.fechaFin);
  
  // Si el contrato no ha comenzado
  if (hoy < inicio) return 0;
  
  // Si el contrato ya terminó
  if (hoy > fin) {
    return contrato.precioTotal;
  }
  
  // Si el contrato está activo
  const diasTranscurridos = Math.ceil((hoy - inicio) / (1000 * 60 * 60 * 24)) + 1;
  const diasTotales = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
  const montoPorDia = contrato.precioTotal / diasTotales;
  
  return Math.round((diasTranscurridos * montoPorDia) * 100) / 100;
};

// Función para calcular el precio transcurrido en meses
export const calcularPrecioTranscurridoMeses = (contrato) => {
  if (!contrato || !contrato.precioTotal || contrato.esMantenimiento) return 0;
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicio = new Date(contrato.fechaInicio);
  const fin = new Date(contrato.fechaFin);
  
  // Si el contrato no ha comenzado
  if (hoy < inicio) return 0;
  
  // Si el contrato ya terminó
  if (hoy > fin) {
    return contrato.precioTotal;
  }
  
  // Si el contrato está activo
  const mesesTranscurridos = calcularMesesEntreFechas(contrato.fechaInicio, hoy);
  const alquilerMensual = calcularAlquilerMensualPromedio(contrato);
  
  return mesesTranscurridos * alquilerMensual;
};

// Función para calcular el dinero de alquiler mensual recibido según el mes actual
export const calcularAlquilerMesActual = (contrato) => {
  if (!contrato || !contrato.precioTotal || contrato.esMantenimiento) return 0;
  
  const hoy = new Date();
  const inicio = new Date(contrato.fechaInicio);
  const fin = new Date(contrato.fechaFin);
  
  // Verificar si el contrato está activo en el mes actual
  const mesActual = hoy.getMonth();
  const añoActual = hoy.getFullYear();
  
  // Calcular si el mes actual está dentro del período del contrato
  const fechaInicioMes = new Date(añoActual, mesActual, 1);
  const fechaFinMes = new Date(añoActual, mesActual + 1, 0);
  
  // Si el contrato no cubre el mes actual
  if (inicio > fechaFinMes || fin < fechaInicioMes) {
    return 0;
  }
  
  // Si el contrato cubre todo el mes actual
  if (inicio <= fechaInicioMes && fin >= fechaFinMes) {
    return calcularAlquilerMensualPromedio(contrato);
  }
  
  // Si el contrato cubre parcialmente el mes actual
  const diasEnMes = new Date(añoActual, mesActual + 1, 0).getDate();
  const alquilerMensual = calcularAlquilerMensualPromedio(contrato);
  const montoPorDia = alquilerMensual / diasEnMes;
  
  let diasCubiertos = 0;
  
  // Calcular días cubiertos en el mes actual
  if (inicio <= fechaInicioMes && fin < fechaFinMes) {
    // El contrato termina en este mes
    diasCubiertos = fin.getDate();
  } else if (inicio > fechaInicioMes && fin >= fechaFinMes) {
    // El contrato comienza en este mes
    diasCubiertos = diasEnMes - inicio.getDate() + 1;
  } else if (inicio > fechaInicioMes && fin < fechaFinMes) {
    // El contrato está completamente dentro de este mes
    diasCubiertos = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
  }
  
  return Math.round((diasCubiertos * montoPorDia) * 100) / 100;
};

// Función para calcular el estado de una cuota específica
export const calcularEstadoCuota = (cuota, contrato) => {
  if (!cuota || !contrato) return 'PENDIENTE';
  if (cuota.estado === 'PAGADO') return 'PAGADO';

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaVencimiento = new Date(cuota.fechaVencimiento);
  fechaVencimiento.setHours(0, 0, 0, 0);

  if (hoy > fechaVencimiento) {
    return 'VENCIDA';
  }
  if (hoy.getTime() === fechaVencimiento.getTime()) {
    return 'VENCE_HOY';
  }
  if (hoy < fechaVencimiento) {
    return 'PENDIENTE';
  }
  return 'PENDIENTE';
};

// Función para calcular cuotas pagadas vs totales
export const calcularEstadoCuotasContrato = (contrato) => {
  if (!contrato || !contrato.precioTotal || contrato.esMantenimiento) {
    return {
      cuotasPagadas: 0,
      cuotasTotales: 0,
      montoPagado: 0,
      montoTotal: 0,
      porcentajePagado: 0,
      proximaCuota: null,
      cuotasVencidas: 0,
      cuotasMensuales: []
    };
  }

  const cuotas = contrato.cuotasMensuales || generarCuotasMensuales(contrato);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let cuotasPagadas = 0;
  let montoPagado = 0;
  let cuotasVencidas = 0;
  let proximaCuota = null;

  cuotas.forEach((cuota, index) => {
    // El estado real de la cuota depende de su estado y la fecha
    let estadoCuota = cuota.estado;
    if (cuota.estado !== 'PAGADO') {
      const fechaVencimiento = new Date(cuota.fechaVencimiento);
      fechaVencimiento.setHours(0, 0, 0, 0);
      if (hoy > fechaVencimiento) {
        estadoCuota = 'VENCIDA';
      } else if (hoy.getTime() === fechaVencimiento.getTime()) {
        estadoCuota = 'VENCE_HOY';
      } else {
        estadoCuota = 'PENDIENTE';
      }
    }
    // Contar pagadas
    if (estadoCuota === 'PAGADO') {
      cuotasPagadas++;
      montoPagado += cuota.monto;
    }
    // Contar vencidas
    if (estadoCuota === 'VENCIDA') {
      cuotasVencidas++;
    }
    // Próxima cuota pendiente
    if (!proximaCuota && estadoCuota === 'PENDIENTE') {
      const fechaVencimiento = new Date(cuota.fechaVencimiento);
      proximaCuota = {
        ...cuota,
        index: index + 1,
        diasRestantes: Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24))
      };
    }
  });

  const montoTotal = contrato.precioTotal;
  const porcentajePagado = montoTotal > 0 ? Math.round((montoPagado / montoTotal) * 100) : 0;

  // Actualizar el estado de cada cuota para la UI
  const cuotasMensuales = cuotas.map(cuota => {
    let estadoCuota = cuota.estado;
    if (cuota.estado !== 'PAGADO') {
      const fechaVencimiento = new Date(cuota.fechaVencimiento);
      fechaVencimiento.setHours(0, 0, 0, 0);
      if (hoy > fechaVencimiento) {
        estadoCuota = 'VENCIDA';
      } else if (hoy.getTime() === fechaVencimiento.getTime()) {
        estadoCuota = 'VENCE_HOY';
      } else {
        estadoCuota = 'PENDIENTE';
      }
    }
    return { ...cuota, estado: estadoCuota };
  });

  return {
    cuotasPagadas,
    cuotasTotales: cuotas.length,
    montoPagado: Math.round(montoPagado * 100) / 100,
    montoTotal,
    porcentajePagado,
    proximaCuota,
    cuotasVencidas,
    cuotasMensuales
  };
};

// Función para generar cuotas mensuales basadas en precio total y duración
export const generarCuotasMensuales = (contrato) => {
  if (!contrato || !contrato.precioTotal || contrato.esMantenimiento) return [];
  
  const inicio = new Date(contrato.fechaInicio);
  const fin = new Date(contrato.fechaFin);
  const mesesTotales = calcularMesesEntreFechas(contrato.fechaInicio, contrato.fechaFin);
  
  const alquilerMensual = calcularAlquilerMensualPromedio(contrato);
  const cuotas = [];
  
  for (let i = 0; i < mesesTotales; i++) {
    const fechaCuota = new Date(inicio);
    fechaCuota.setMonth(inicio.getMonth() + i);
    
    // Ajustar el monto de la última cuota para compensar redondeos
    let montoCuota = alquilerMensual;
    if (i === mesesTotales - 1) {
      const montoAcumulado = alquilerMensual * (mesesTotales - 1);
      montoCuota = contrato.precioTotal - montoAcumulado;
    }
    
    const cuota = {
      mes: fechaCuota.getMonth() + 1,
      año: fechaCuota.getFullYear(),
      monto: Math.round(montoCuota * 100) / 100,
      fechaVencimiento: new Date(fechaCuota.getFullYear(), fechaCuota.getMonth(), 1),
      estado: 'PENDIENTE',
      numero: i + 1
    };
    
    // Calcular el estado actual de la cuota
    cuota.estado = calcularEstadoCuota(cuota, contrato);
    
    cuotas.push(cuota);
  }
  
  return cuotas;
};

// Función para calcular estadísticas completas del contrato
export const calcularEstadisticasContrato = (contrato) => {
  if (!contrato || contrato.esMantenimiento) {
    return {
      precioTotal: 0,
      precioTranscurridoDias: 0,
      precioTranscurridoMeses: 0,
      alquilerMesActual: 0,
      alquilerMensualPromedio: 0,
      diasTranscurridos: 0,
      diasTotales: 0,
      mesesTranscurridos: 0,
      mesesTotales: 0,
      porcentajeCompletado: 0,
      tieneContrato: false,
      cuotasMensuales: []
    };
  }
  
  const precioTotal = calcularPrecioTotalContrato(contrato);
  const precioTranscurridoDias = calcularPrecioTranscurridoDias(contrato);
  const precioTranscurridoMeses = calcularPrecioTranscurridoMeses(contrato);
  const alquilerMesActual = calcularAlquilerMesActual(contrato);
  const alquilerMensualPromedio = calcularAlquilerMensualPromedio(contrato);
  
  // Normalizar fechas a medianoche para cálculos consistentes
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicio = new Date(contrato.fechaInicio);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(contrato.fechaFin);
  fin.setHours(0, 0, 0, 0);
  
  // Usar la misma lógica que calcularProgresoContrato para consistencia
  const diasTotales = Math.max(0, Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)));
  const diasTranscurridos = Math.max(0, Math.min(diasTotales, Math.ceil((hoy - inicio) / (1000 * 60 * 60 * 24))));
  
  const mesesTotales = calcularMesesEntreFechas(contrato.fechaInicio, contrato.fechaFin);
  
  let mesesTranscurridos = 0;
  if (hoy >= inicio) {
    if (hoy <= fin) {
      // Contrato activo
      mesesTranscurridos = calcularMesesEntreFechas(contrato.fechaInicio, hoy);
    } else {
      // Contrato finalizado
      mesesTranscurridos = mesesTotales;
    }
  }
  
  const porcentajeCompletado = diasTotales > 0 ? Math.min(100, (diasTranscurridos / diasTotales) * 100) : 0;
  const cuotasMensuales = contrato.cuotasMensuales || generarCuotasMensuales(contrato);
  
  return {
    precioTotal,
    precioTranscurridoDias,
    precioTranscurridoMeses,
    alquilerMesActual,
    alquilerMensualPromedio,
    diasTranscurridos,
    diasTotales,
    mesesTranscurridos,
    mesesTotales,
    porcentajeCompletado,
    tieneContrato: true,
    cuotasMensuales
  };
};

// Función para calcular el progreso y tiempos del contrato
export const calcularProgresoContrato = (contrato) => {
  if (!contrato.fechaInicio || !contrato.fechaFin) {
    return {
      porcentaje: 0,
      diasTranscurridos: 0,
      diasTotales: 0,
      diasRestantes: 0,
      estadoTiempo: 'Sin fechas',
      montoAcumulado: 0,
      montoTotal: 0,
      tieneContrato: false
    };
  }

  // Normalizar fechas a medianoche
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicio = new Date(contrato.fechaInicio);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(contrato.fechaFin);
  fin.setHours(0, 0, 0, 0);

  // Calcular días totales
  const diasTotales = Math.max(0, Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)));
  // Calcular días transcurridos
  const diasTranscurridos = Math.max(0, Math.min(diasTotales, Math.ceil((hoy - inicio) / (1000 * 60 * 60 * 24))));
  // Calcular días restantes
  const diasRestantes = Math.max(0, Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24)));

  // Estado textual
  let estadoTiempo = '';
  if (hoy < inicio) {
    estadoTiempo = 'No iniciado';
  } else if (hoy > fin) {
    estadoTiempo = 'Finalizado';
  } else {
    estadoTiempo = `${diasRestantes} días restantes`;
  }

  // Calcular porcentaje
  const porcentaje = diasTotales > 0 ? Math.min(100, (diasTranscurridos / diasTotales) * 100) : 0;

  // Calcular montos
  const montoMensual = calcularAlquilerMensualPromedio(contrato);
  const montoAcumulado = (diasTranscurridos / 30) * montoMensual;
  const montoTotal = (diasTotales / 30) * montoMensual;

  return {
    porcentaje,
    diasTranscurridos,
    diasTotales,
    diasRestantes,
    estadoTiempo,
    montoAcumulado,
    montoTotal,
    tieneContrato: true
  };
}; 

// Crea las secciones de información para un contrato, usando datos relacionados y permitiendo extensión
export const crearSeccionesContrato = (contrato, relatedData = {}, extraSections = []) => {
  // Asegurar que extraSections sea siempre un array
  const sectionsToAdd = Array.isArray(extraSections) ? extraSections : [];
  
  const secciones = [
    {
      label: 'Propiedad',
      value: contrato.propiedad?.direccion || contrato.propiedad?.nombre || 'Sin propiedad',
    },
    {
      label: 'Inquilino',
      value: Array.isArray(contrato.inquilino)
        ? contrato.inquilino.map(i => i.nombre || i.email || i).join(', ')
        : contrato.inquilino?.nombre || contrato.inquilino?.email || 'Sin inquilino',
    },
    {
      label: 'Monto mensual',
      value: calcularAlquilerMensualPromedio(contrato) || 'N/A',
    },
    {
      label: 'Precio total',
      value: contrato.precioTotal || 'N/A',
    },
    {
      label: 'Estado',
      value: contrato.estado || contrato.estadoActual || 'N/A',
    },
    {
      label: 'Fecha inicio',
      value: contrato.fechaInicio ? formatFecha(contrato.fechaInicio) : 'N/A',
    },
    {
      label: 'Fecha fin',
      value: contrato.fechaFin ? formatFecha(contrato.fechaFin) : 'N/A',
    },
  ];
  return [...secciones, ...sectionsToAdd];
}; 

// Función para calcular el estado completo de finanzas de un contrato
export const calcularEstadoFinanzasContrato = (contrato, simboloMoneda = '$') => {
  if (!contrato || !contrato.precioTotal || contrato.esMantenimiento) {
    return {
      tieneContrato: false,
      estadoCuotas: null,
      montoMensual: 0,
      simboloMoneda,
      resumen: {
        cuotasPagadas: 0,
        cuotasTotales: 0,
        montoPagado: 0,
        montoTotal: 0,
        porcentajePagado: 0,
        proximaCuota: null,
        cuotasVencidas: 0
      }
    };
  }

  const estadoCuotas = calcularEstadoCuotasContrato(contrato);
  const montoMensual = calcularAlquilerMensualPromedio(contrato);

  return {
    tieneContrato: true,
    estadoCuotas,
    montoMensual,
    simboloMoneda,
    resumen: {
      cuotasPagadas: estadoCuotas.cuotasPagadas,
      cuotasTotales: estadoCuotas.cuotasTotales,
      montoPagado: estadoCuotas.montoPagado,
      montoTotal: estadoCuotas.montoTotal,
      porcentajePagado: estadoCuotas.porcentajePagado,
      proximaCuota: estadoCuotas.proximaCuota,
      cuotasVencidas: estadoCuotas.cuotasVencidas
    }
  };
}; 

// Función para calcular el período de un contrato
export const calcularPeriodo = (fechaInicio, fechaFin) => {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const meses = (fin.getFullYear() - inicio.getFullYear()) * 12 + 
               (fin.getMonth() - inicio.getMonth());
  return `${meses} meses`;
};

// Función para calcular el monto total estimado del contrato (basado en monto mensual)
export const calcularMontoTotalEstimado = (contrato) => {
  const montoMensual = calcularAlquilerMensualPromedio(contrato);
  const inicio = new Date(contrato.fechaInicio);
  const fin = new Date(contrato.fechaFin);
  const meses = calcularMesesEntreFechas(contrato.fechaInicio, contrato.fechaFin);
  const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
  
  if (meses > 0) {
    return montoMensual * meses;
  } else {
    return montoMensual * (dias / 30);
  }
};

// Función para obtener datos relacionados de un contrato
export const obtenerDatosRelacionados = (contrato, relatedData) => {
  // Obtener datos de propiedad
  const propiedadData = (() => {
    if (contrato.propiedad && typeof contrato.propiedad === 'object' && contrato.propiedad.alias) {
      return contrato.propiedad;
    }
    return relatedData.propiedades?.find(p => p._id === contrato.propiedad);
  })();

  // Obtener datos de inquilinos
  const inquilinosData = (() => {
    if (!contrato.inquilino || contrato.inquilino.length === 0) return [];
    if (contrato.inquilino[0] && typeof contrato.inquilino[0] === 'object' && contrato.inquilino[0].nombre) {
      return contrato.inquilino;
    }
    return contrato.inquilino?.map(inquilinoId => 
      relatedData.inquilinos?.find(i => i._id === inquilinoId)
    ).filter(Boolean) || [];
  })();

  // Obtener datos de cuenta
  const cuentaData = (() => {
    if (contrato.cuenta && typeof contrato.cuenta === 'object' && contrato.cuenta.nombre) {
      return contrato.cuenta;
    }
    return relatedData.cuentas?.find(c => c._id === contrato.cuenta);
  })();

  // Obtener datos de moneda
  const monedaData = (() => {
    if (cuentaData?.moneda) {
      if (typeof cuentaData.moneda === 'object') {
        return cuentaData.moneda;
      }
      return relatedData.monedas?.find(m => m._id === cuentaData.moneda);
    }
    if (contrato.moneda) {
      if (typeof contrato.moneda === 'object') {
        return contrato.moneda;
      }
      return relatedData.monedas?.find(m => m._id === contrato.moneda);
    }
    return null;
  })();

  return {
    propiedad: propiedadData,
    inquilinos: inquilinosData,
    cuenta: cuentaData,
    moneda: monedaData
  };
};

// Función utilitaria para obtener el símbolo de moneda y nombre de cuenta de un contrato
export function getCuentaYMoneda(contrato, relatedData = {}) {
  let simbolo = '$';
  let nombreCuenta = 'No especificada';
  let cuentaObj = null;
  let monedaObj = null;

  // 1. Si la cuenta está populada como objeto
  if (contrato.cuenta && typeof contrato.cuenta === 'object') {
    cuentaObj = contrato.cuenta;
    nombreCuenta = cuentaObj.nombre || nombreCuenta;
    if (cuentaObj.moneda && typeof cuentaObj.moneda === 'object') {
      monedaObj = cuentaObj.moneda;
      simbolo = monedaObj.simbolo || simbolo;
    }
  }

  // 2. Si la cuenta es un ID, buscar en relatedData.cuentas
  if (!cuentaObj && relatedData.cuentas && contrato.cuenta) {
    cuentaObj = relatedData.cuentas.find(c => c._id === contrato.cuenta || c.id === contrato.cuenta);
    if (cuentaObj) {
      nombreCuenta = cuentaObj.nombre || nombreCuenta;
      if (cuentaObj.moneda && typeof cuentaObj.moneda === 'object') {
        monedaObj = cuentaObj.moneda;
        simbolo = monedaObj.simbolo || simbolo;
      } else if (cuentaObj.moneda && relatedData.monedas) {
        monedaObj = relatedData.monedas.find(m => m._id === cuentaObj.moneda);
        if (monedaObj) simbolo = monedaObj.simbolo || simbolo;
      }
    }
  }

  // 3. Si la moneda está populada como objeto
  if (!monedaObj && contrato.moneda && typeof contrato.moneda === 'object') {
    monedaObj = contrato.moneda;
    simbolo = monedaObj.simbolo || simbolo;
  }

  // 4. Si la moneda es un ID, buscar en relatedData.monedas
  if (!monedaObj && relatedData.monedas && contrato.moneda) {
    monedaObj = relatedData.monedas.find(m => m._id === contrato.moneda);
    if (monedaObj) simbolo = monedaObj.simbolo || simbolo;
  }

  return { simbolo, nombreCuenta, monedaObj, cuentaObj };
} 