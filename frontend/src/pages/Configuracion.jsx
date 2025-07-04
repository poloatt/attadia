import React from 'react';
import { Container, Box, Typography, useTheme, Paper, Switch, FormControl, FormControlLabel, Divider } from '@mui/material';
import { useUISettings } from '../context/UISettingsContext';
import UnderConstruction from '../components/UnderConstruction';

export function Configuracion() {
  const theme = useTheme();
  const { 
    showEntityToolbarNavigation, 
    showSidebar, 
    toggleEntityToolbarNavigation, 
    toggleSidebar 
  } = useUISettings();

  return (
    <Box sx={{ px: 0, width: '100%' }}>
      <Box
        sx={{
          p: 3,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          mt: 2
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          sx={{
            mb: 3,
            fontWeight: 500,
            color: theme.palette.text.primary,
            textTransform: 'uppercase',
            letterSpacing: '0.02em'
          }}
        >
          Configuración del Sistema
        </Typography>

        {/* Configuraciones de Interfaz */}
        <Paper
          sx={{
            p: 2,
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.default'
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              fontWeight: 500,
              color: theme.palette.text.primary
            }}
          >
            Configuración de Interfaz
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl component="fieldset">
              <FormControlLabel
                control={
                  <Switch
                    checked={showSidebar}
                    onChange={toggleSidebar}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Habilitar Sidebar
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Muestra u oculta la barra lateral de navegación
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: 'flex-start', m: 0 }}
              />
            </FormControl>

            <Divider />

            <FormControl component="fieldset">
              <FormControlLabel
                control={
                  <Switch
                    checked={showEntityToolbarNavigation}
                    onChange={toggleEntityToolbarNavigation}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Habilitar Navigation Toolbar
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Muestra u oculta la barra de navegación superior en páginas de entidades
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: 'flex-start', m: 0 }}
              />
            </FormControl>
          </Box>
        </Paper>

        <UnderConstruction />
      </Box>
    </Box>
  );
}

export default Configuracion;
