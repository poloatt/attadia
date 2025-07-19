import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { getStatusIconComponent, getEstadoColor, getEstadoText } from '../common/StatusSystem';

const EstadoChip = ({ estado, tipo = 'PROPIEDAD', sx = {} }) => (
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
      minWidth: 'fit-content',
      ...sx
    }}
  >
    {getStatusIconComponent(estado, tipo)}
    <span>{getEstadoText(estado, tipo)}</span>
  </Box>
);

const EntityDetails = ({ 
  title, 
  children, 
  action,
  elevation = 0,
  showTitle = false
}) => {
  return (
    <Paper 
      elevation={elevation}
      sx={{ 
        backgroundColor: 'background.default',
        height: '100%',
        border: 'none'
      }}
    >
      {showTitle && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: 'text.secondary',
              fontWeight: 500
            }}
          >
            {title}
          </Typography>
          {action && (
            <Box>
              {action}
            </Box>
          )}
        </Box>
      )}
      <Box sx={{ 
        p: 1,
        minHeight: 100
      }}>
        {children || (
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary',
              textAlign: 'center',
              py: 4
            }}
          >
            No hay datos para mostrar
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default EntityDetails;
