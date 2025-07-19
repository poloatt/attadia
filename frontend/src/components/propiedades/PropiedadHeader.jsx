import React from 'react';
import { Box, Typography } from '@mui/material';
import TipoPropiedadIcon from './TipoPropiedadIcon';
import EstadoIcon from '../common/EstadoIcon';
import { StatusChip } from './PropiedadStyles';
import { getEstadoColor, getEstadoText } from '../common/StatusSystem';

const PropiedadHeader = ({ 
  propiedad, 
  showEstado = true, 
  iconSize = '1.1rem',
  titleSize = 'subtitle1',
  titleWeight = 500,
  gap = 1,
  ...props 
}) => {
  const { tipo, alias, titulo, estado = 'DISPONIBLE' } = propiedad;
  const displayName = alias || titulo || 'Sin alias';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap, ...props }}>
      <TipoPropiedadIcon tipo={tipo} sx={{ fontSize: iconSize }} />
      
      <Typography 
        variant={titleSize} 
        sx={{ 
          fontWeight: titleWeight, 
          fontSize: titleSize === 'subtitle1' ? '0.9rem' : undefined,
          lineHeight: titleSize === 'subtitle1' ? 1.2 : undefined
        }}
      >
        {displayName}
      </Typography>
      
      {showEstado && (
        <StatusChip customcolor={getEstadoColor(estado, 'PROPIEDAD')}>
          <EstadoIcon estado={estado} tipo="PROPIEDAD" />
          <span>{getEstadoText(estado, 'PROPIEDAD')}</span>
        </StatusChip>
      )}
    </Box>
  );
};

export default PropiedadHeader; 