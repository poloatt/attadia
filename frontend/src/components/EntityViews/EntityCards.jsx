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
                    <Chip
                      label={config.getStatus(item).label}
                      color={config.getStatus(item).color}
                      size="small"
                      icon={null}
                      sx={{ 
                        borderRadius: 0,
                        minWidth: 80,
                        justifyContent: 'center',
                        mt: 0.2
                      }}
                    />
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