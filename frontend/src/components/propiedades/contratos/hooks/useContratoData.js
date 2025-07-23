import { useMemo } from 'react';
import { obtenerDatosRelacionados, getEstadoContrato } from '../../../../utils/contratoUtils';

export const useContratoData = (contratos = [], relatedData = {}) => {
  const contratosConDatos = useMemo(() => {
    return contratos.map(contrato => ({
      ...contrato,
      datosRelacionados: obtenerDatosRelacionados(contrato, relatedData),
      estado: getEstadoContrato(contrato)
    }));
  }, [contratos, relatedData]);

  const contratosOrdenados = useMemo(() => {
    return [...contratosConDatos].sort((a, b) => {
      // Priorizar contratos activos
      if (a.estado === 'ACTIVO' && b.estado !== 'ACTIVO') return -1;
      if (b.estado === 'ACTIVO' && a.estado !== 'ACTIVO') return 1;
      
      // Luego por fecha de inicio
      const fechaA = new Date(a.fechaInicio);
      const fechaB = new Date(b.fechaInicio);
      return fechaB - fechaA;
    });
  }, [contratosConDatos]);

  const contratosPorEstado = useMemo(() => {
    return contratosConDatos.reduce((acc, contrato) => {
      const estado = contrato.estado;
      if (!acc[estado]) {
        acc[estado] = [];
      }
      acc[estado].push(contrato);
      return acc;
    }, {});
  }, [contratosConDatos]);

  const estadisticas = useMemo(() => {
    const total = contratosConDatos.length;
    const activos = contratosConDatos.filter(c => c.estado === 'ACTIVO').length;
    const planeados = contratosConDatos.filter(c => c.estado === 'PLANEADO').length;
    const finalizados = contratosConDatos.filter(c => c.estado === 'FINALIZADO').length;
    const mantenimiento = contratosConDatos.filter(c => c.estado === 'MANTENIMIENTO').length;

    return {
      total,
      activos,
      planeados,
      finalizados,
      mantenimiento,
      porcentajeActivos: total > 0 ? Math.round((activos / total) * 100) : 0
    };
  }, [contratosConDatos]);

  return {
    contratosConDatos,
    contratosOrdenados,
    contratosPorEstado,
    estadisticas
  };
}; 