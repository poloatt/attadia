import React from 'react';
import { Box, Typography } from '@mui/material';
import EstadoIcon from './EstadoIcon';
import { getEstadoColor, getEstadoText } from './StatusSystem';

const CommonHeader = ({
  icon: Icon,
  iconProps = {},
  title,
  subtitle,
  estado,
  tipo = 'PROPIEDAD',
  showEstado = true,
  iconSize = '1.1rem',
  titleSize = 'subtitle1',
  titleWeight = 500,
  gap = 1,
  actions = null,
  ...props
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap, ...props }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap }}>
      {Icon && <Icon {...iconProps} sx={{ fontSize: iconSize, ...iconProps.sx }} />}
      <Box>
        <Typography
          variant={titleSize}
          sx={{
            fontWeight: titleWeight,
            fontSize: titleSize === 'subtitle1' ? '0.9rem' : undefined,
            lineHeight: titleSize === 'subtitle1' ? 1.2 : undefined
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
    {showEstado && estado && (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.5,
          fontSize: '0.75rem',
          color: getEstadoColor(estado, tipo),
          bgcolor: 'transparent',
          borderRadius: 0,
          fontWeight: 600,
          height: 24,
          minWidth: 'fit-content'
        }}
      >
        <EstadoIcon estado={estado} tipo={tipo} />
      </Box>
    )}
    {actions}
  </Box>
);

export default CommonHeader; 
