import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

const BarraEstadoPropiedad = ({
  diasTranscurridos = 0,
  diasTotales = 0,
  porcentaje = 0,
  simboloMoneda = '$',
  montoAcumulado = 0,
  montoTotal = 0,
  color = 'primary.main',
  estado = 'OCUPADA',
  sx = {}
}) => (
  <Box sx={{ mb: 1, ...sx }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
        {diasTranscurridos}/{diasTotales} días
      </Typography>
      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
        {Math.round(porcentaje)}%
      </Typography>
    </Box>
    <LinearProgress 
      variant="determinate" 
      value={porcentaje}
      sx={{ 
        height: 3,
        borderRadius: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        '& .MuiLinearProgress-bar': {
          backgroundColor: estado === 'MANTENIMIENTO' ? 'warning.main' : color
        }
      }}
    />
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
        {simboloMoneda} {montoAcumulado.toLocaleString()}
      </Typography>
      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
        {simboloMoneda} {montoTotal.toLocaleString()}
      </Typography>
    </Box>
  </Box>
);

export default BarraEstadoPropiedad; 