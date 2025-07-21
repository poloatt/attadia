import React from 'react';
import { Box, Typography, Paper, IconButton, Dialog, Button } from '@mui/material';
import { getStatusIconComponent, getEstadoColor, getEstadoText } from '../common/StatusSystem';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { EntityActions } from './EntityActions';

export const EstadoChip = ({ estado, tipo = 'PROPIEDAD', sx = {} }) => (
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

// Estilo geométrico para papeles
export const GeometricPaper = styled(Paper)(({ theme }) => ({
  borderRadius: 0,
  padding: theme.spacing(1.5),
  border: 'none',
  backgroundColor: '#181818',
  boxShadow: '0 1px 0 0 rgba(0,0,0,0.18)',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: '#181818',
  }
}));

// Header geométrico para modales
export const GeometricModalHeader = ({
  icon: Icon,
  title,
  chip,
  onClose,
  children
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, backgroundColor: '#181818', p: 2, pb: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {Icon && <Icon sx={{ fontSize: 32, color: 'primary.main' }} />}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.05rem' }}>
          {title}
        </Typography>
        {children}
      </Box>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {chip}
      {onClose && (
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      )}
    </Box>
  </Box>
);

// Dialog geométrico reutilizable
export const GeometricDialog = ({
  open,
  onClose,
  fullScreen = false,
  maxWidth = 'md',
  fullWidth = true,
  actions = null, // acciones para el footer (ej: <EntityActions ... />)
  children,
  ...rest
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: 0,
          backgroundColor: '#181818',
          minHeight: fullScreen ? '100vh' : 'auto',
          color: '#fff',
        }
      }}
      {...rest}
    >
      {children}
      {/* Footer modular: acciones a la izquierda, cerrar a la derecha */}
      <Box sx={{ p: 2, pt: 1, borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#181818', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>{actions}</Box>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 0 }}>
          Cerrar
        </Button>
      </Box>
    </Dialog>
  );
};

export { styled };
export { EntityActions };

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
