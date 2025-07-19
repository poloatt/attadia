import React from 'react';
import {
  Grid,
  Paper,
  Box,
  Typography,
  Chip,
  Avatar
} from '@mui/material';
import { EntityActions } from './EntityActions';
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

const EntityCards = ({ 
  data,
  items,
  config,
  gridProps = {
    xs: 12,
    sm: 6,
    md: 4,
    lg: 3
  }
}) => {
  const itemsToRender = items || data;

  return (
    <Grid container spacing={1}>
      {itemsToRender?.map((item) => {
        const itemId = item.id || item._id;
        return (
          <Grid item key={itemId} {...gridProps} sx={{ width: '100%' }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 1,
                pb: 0,
                height: '100%',
                border: 'none',
                backgroundColor: 'background.default',
                transition: 'all 0.2s ease',
                position: 'relative',
                width: '100%',
                '&:hover': {
                  backgroundColor: 'background.paper',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                {/* Icono o Avatar */}
                {config.renderIcon ? (
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    bgcolor: 'primary.main', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'primary.contrastText'
                  }}>
                    {React.cloneElement(config.renderIcon(item), { sx: { fontSize: '2.2rem' } })}
                  </Box>
                ) : config.getAvatarText ? (
                  <Avatar sx={{ width: 40, height: 40 }}>
                    {config.getAvatarText(item)}
                  </Avatar>
                ) : null}

                {/* Contenido Principal */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 40, gap: 0.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0, textAlign: 'center' }}>
                    {config.getTitle(item)}
                  </Typography>
                  {/* Chip de estado si existe */}
                  {config.getStatus && (
                    <EstadoChip estado={config.getStatus(item).estado} tipo={config.getStatus(item).tipo} />
                  )}
                </Box>
              </Box>
              
              {/* Estado y Acciones Flotantes */}
              <Box sx={{ 
                position: 'absolute',
                top: 8,
                right: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 1
              }}>
                {config.getActions && (
                  <EntityActions
                    {...config.getActions(item)}
                    sx={{ 
                      '& .MuiIconButton-root': {
                        padding: '4px',
                        fontSize: '0.875rem'
                      }
                    }}
                  />
                )}
              </Box>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
}

export default EntityCards; 
