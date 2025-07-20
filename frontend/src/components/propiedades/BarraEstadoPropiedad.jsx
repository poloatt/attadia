import React from 'react';
import ProgressBar from '../common/ProgressBar';

const BarraEstadoPropiedad = ({
  diasTranscurridos = 0,
  diasTotales = 0,
  porcentaje = 0,
  simboloMoneda = '$',
  montoMensual = 0,
  montoTotal = 0,
  color = 'primary',
  estado = 'OCUPADA',
  // Nuevos props para progreso financiero
  montoAcumulado = null,
  cuotasPagadas = null,
  cuotasTotales = null,
  isCompact = false,
  sx = {}
}) => {
  // Asegurar que los valores sean números válidos
  const diasTranscurridosNum = Number(diasTranscurridos) || 0;
  const diasTotalesNum = Number(diasTotales) || 0;
  const porcentajeNum = Math.min(100, Math.max(0, Number(porcentaje) || 0));
  const montoMensualNum = Number(montoMensual) || 0;
  const montoTotalNum = Number(montoTotal) || 0;
  
  // Determinar el color basado en el estado
  const finalColor = estado === 'MANTENIMIENTO' ? 'warning' : color;
  
  // Si tenemos datos de cuotas, usar progreso financiero
  const usarProgresoFinanciero = cuotasPagadas !== null && cuotasTotales !== null && montoAcumulado !== null;
  
  return (
    <ProgressBar
      dataType={usarProgresoFinanciero ? "cuotas" : "days"}
      diasTranscurridos={diasTranscurridosNum}
      diasTotales={diasTotalesNum}
      simboloMoneda={simboloMoneda}
      montoMensual={montoMensualNum}
      montoTotal={usarProgresoFinanciero ? montoTotalNum : montoTotalNum}
      percentage={porcentajeNum}
      color={finalColor}
      variant={isCompact ? "compact" : "default"}
      // Datos de cuotas para progreso financiero
      cuotasPagadas={usarProgresoFinanciero ? cuotasPagadas : null}
      cuotasTotales={usarProgresoFinanciero ? cuotasTotales : null}
      montoPagado={usarProgresoFinanciero ? montoAcumulado : null}
      montoTotalCuotas={usarProgresoFinanciero ? montoTotalNum : null}
      sx={sx}
    />
  );
};

export default BarraEstadoPropiedad; 
