import { useMemo } from 'react';
import {
  pluralizar,
  getEstadoContrato,
  agruparHabitaciones,
  calcularProgresoOcupacion,
  getCuentaYMoneda,
  calcularYearToDate,
  calcularYearToGo,
  getNombreTipoHabitacion
} from '../utils/propiedadUtils';
import { calcularAlquilerMensualPromedio, calcularEstadoCuotasContrato } from '../utils/contratoUtils';

/**
 * Hook para centralizar toda la lógica derivada de una propiedad
 * @param {object} propiedad - Objeto de la propiedad
 * @returns {object} - Datos derivados y agrupados
 */
export default function usePropiedadDatos(propiedad) {
  return useMemo(() => {
    if (!propiedad) return {};

    // Estado y helpers
    const estado = propiedad.estado || 'DISPONIBLE';
    const contratos = propiedad.contratos || [];
    const habitaciones = propiedad.habitaciones || [];
    const inquilinos = propiedad.inquilinos || [];
    const documentos = propiedad.documentos || [];
    const cuenta = propiedad.cuenta;
    const monedaProp = propiedad.moneda;

    // Contrato activo
    const contratoActivo = contratos.find(contrato =>
      getEstadoContrato(contrato) === 'ACTIVO' &&
      !contrato.esMantenimiento &&
      contrato.tipoContrato === 'ALQUILER'
    );

    // Cálculos de cuenta y moneda
    let simbolo = '$';
    let nombreCuenta = 'No especificada';
    if (contratoActivo) {
      const cuentaYMoneda = getCuentaYMoneda(contratoActivo, {});
      simbolo = cuentaYMoneda.simbolo;
      nombreCuenta = cuentaYMoneda.nombreCuenta;
    } else if (cuenta) {
      if (typeof cuenta === 'object') {
        nombreCuenta = cuenta.nombre || nombreCuenta;
        if (cuenta.moneda && typeof cuenta.moneda === 'object') {
          simbolo = cuenta.moneda.simbolo || simbolo;
        }
      }
    }
    // Nombre de moneda
    const moneda = (() => {
      if (contratoActivo?.cuenta?.moneda?.nombre) return contratoActivo.cuenta.moneda.nombre;
      if (contratoActivo?.moneda?.nombre) return contratoActivo.moneda.nombre;
      if (cuenta?.moneda?.nombre) return cuenta.moneda.nombre;
      if (monedaProp?.nombre) return monedaProp.nombre;
      return '';
    })();

    // Habitaciones agrupadas
    const habitacionesAgrupadas = agruparHabitaciones(habitaciones);
    // Dormitorios y baños
    const numDormitorios = habitaciones.filter(h => h.tipo === 'DORMITORIO_SIMPLE' || h.tipo === 'DORMITORIO_DOBLE').length;
    const dormitoriosSimples = habitaciones.filter(h => h.tipo === 'DORMITORIO_SIMPLE').length;
    const dormitoriosDobles = habitaciones.filter(h => h.tipo === 'DORMITORIO_DOBLE').length;
    const banos = habitaciones.filter(h => h.tipo === 'BAÑO' || h.tipo === 'TOILETTE').length;

    // Inquilinos agrupados
    const inquilinosActivos = inquilinos.filter(i => i.estado === 'ACTIVO');
    const inquilinosFinalizados = inquilinos.filter(i => i.estado !== 'ACTIVO');
    const inquilinosPorEstado = inquilinos.reduce((acc, inquilino) => {
      if (!acc[inquilino.estado]) acc[inquilino.estado] = [];
      acc[inquilino.estado].push(inquilino);
      return acc;
    }, {});

    // Contratos agrupados
    const contratosActivos = contratos.filter(c => c.estado === 'ACTIVO');
    const contratosFinalizados = contratos.filter(c => c.estado !== 'ACTIVO');

    // Progreso y finanzas
    const montoMensual = calcularAlquilerMensualPromedio(contratoActivo);
    const progresoOcupacion = calcularProgresoOcupacion(propiedad);
    const estadoCuotas = contratoActivo ? calcularEstadoCuotasContrato(contratoActivo) : {
      montoPagado: 0,
      cuotasPagadas: 0,
      cuotasTotales: 0
    };
    const ytd = calcularYearToDate(propiedad);
    const ytg = calcularYearToGo(propiedad);

    // Documentos combinados (contratos con documentoUrl)
    const documentosCombinados = [
      ...documentos,
      ...contratos
        .filter(contrato => contrato.documentoUrl)
        .map(contrato => ({
          nombre: `Contrato ${contrato._id}`,
          categoria: 'CONTRATO',
          url: contrato.documentoUrl,
          fechaCreacion: contrato.fechaInicio,
        }))
    ];

    // Pluralización
    const tituloInquilinosContratos = `${inquilinosActivos.length} ${pluralizar(inquilinosActivos.length, 'inquilino', 'inquilinos')} - ${contratosActivos.length} ${pluralizar(contratosActivos.length, 'contrato activo', 'contratos activos')}`;

    return {
      estado,
      contratos,
      habitaciones,
      inquilinos,
      documentos,
      cuenta,
      monedaProp,
      contratoActivo,
      simbolo,
      nombreCuenta,
      moneda,
      habitacionesAgrupadas,
      numDormitorios,
      dormitoriosSimples,
      dormitoriosDobles,
      banos,
      inquilinosActivos,
      inquilinosFinalizados,
      inquilinosPorEstado,
      contratosActivos,
      contratosFinalizados,
      montoMensual,
      progresoOcupacion,
      estadoCuotas,
      ytd,
      ytg,
      documentosCombinados,
      tituloInquilinosContratos,
      getNombreTipoHabitacion
    };
  }, [propiedad]);
} 