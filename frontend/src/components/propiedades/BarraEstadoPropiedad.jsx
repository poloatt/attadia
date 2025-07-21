import React from 'react';
import CommonProgressBar from '../common/CommonProgressBar';

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
  isAssets = false,
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
  
  // Siempre mostrar días a la izquierda
  const dataType = 'days';

  // Calcular label derecha con info de cuotas en $ si está disponible
  let rightLabel = null;
  if (cuotasPagadas !== null && cuotasTotales !== null && montoAcumulado !== null && cuotasPagadas > 0 && montoTotal) {
    rightLabel = `${simboloMoneda} ${montoAcumulado.toLocaleString()}/${montoTotal.toLocaleString()}`;
  }

  return (
    <CommonProgressBar
      dataType={dataType}
      diasTranscurridos={diasTranscurridosNum}
      diasTotales={diasTotalesNum}
      simboloMoneda={simboloMoneda}
      montoMensual={montoMensualNum}
      montoTotal={montoTotalNum}
      percentage={porcentajeNum}
      color={finalColor}
      variant={isCompact ? "compact" : "default"}
      // Mostrar datos de cuotas solo para la derecha
      cuotasPagadas={null}
      cuotasTotales={null}
      montoPagado={null}
      montoTotalCuotas={null}
      rightLabel={rightLabel}
      isAssets={isAssets}
      sx={sx}
    />
  );
};

export default BarraEstadoPropiedad; 
