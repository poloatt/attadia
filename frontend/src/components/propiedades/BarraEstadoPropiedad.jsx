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
  
  return (
    <ProgressBar
      dataType="days"
      diasTranscurridos={diasTranscurridosNum}
      diasTotales={diasTotalesNum}
      simboloMoneda={simboloMoneda}
      montoMensual={montoMensualNum}
      montoTotal={montoTotalNum}
      percentage={porcentajeNum}
      color={finalColor}
      variant="default"
      sx={sx}
    />
  );
};

export default BarraEstadoPropiedad; 