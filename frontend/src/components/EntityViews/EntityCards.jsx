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
  config,
  gridProps = {
    xs: 12,
    sm: 6,
    md: 4,
    lg: 3
  }
}) => {
  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      {data.map((item) => (
        <Grid item key={item.id || item._id} {...gridProps}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 2,
              height: '100%',
              border: 'none',
              backgroundColor: 'background.default',
              transition: 'all 0.2s ease',
              position: 'relative',
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
                  {config.renderIcon(item)}
                </Box>
              ) : config.getAvatarText ? (
                <Avatar sx={{ width: 40, height: 40 }}>
                  {config.getAvatarText(item)}
                </Avatar>
              ) : null}

              {/* Contenido Principal */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                  {config.getTitle(item)}
                </Typography>
                
                {/* Lista de Detalles */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {config.getDetails(item).map((detail, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {detail.icon && React.cloneElement(detail.icon, { 
                        sx: { fontSize: 16, color: 'text.secondary' }
                      })}
                      <Typography variant="body2" color="text.secondary" noWrap={detail.noWrap}>
                        {detail.text}
                      </Typography>
                    </Box>
                  ))}
                </Box>
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
              {config.getStatus && (
                <Chip
                  label={config.getStatus(item).label}
                  color={config.getStatus(item).color}
                  size="small"
                  sx={{ 
                    borderRadius: 0,
                    minWidth: 80,
                    justifyContent: 'center'
                  }}
                />
              )}
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
      ))}
    </Grid>
  );
}

export default EntityCards; 