import React from 'react';
import { Container, Box, Typography, useTheme, Paper, Switch, FormControl, FormControlLabel, Divider, Button, useMediaQuery } from '@mui/material';
import { useUISettings } from '../context/UISettingsContext';
import { CommonConstruction } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { Toolbar } from '../navigation';

export function Configuracion() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { 
    showEntityToolbarNavigation, 
    showSidebar, 
    toggleEntityToolbarNavigation, 
    toggleSidebar 
  } = useUISettings();
  const { logout, user } = useAuth();

  return (
    <Box component="main" className="page-main-content" sx={{ width: '100%', flex: 1, px: { xs: 1, sm: 2, md: 3 }, py: 3, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', p: { xs: 1, sm: 2, md: 3 }, backgroundColor: 'background.paper', borderRadius: 0, border: '1px solid', borderColor: 'divider', mt: 2 }}>
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

        <CommonConstruction />

        {/* Botón de cerrar sesión */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="error"
            onClick={logout}
            sx={{
              borderRadius: 0,
              px: 4,
              py: 1.5,
              fontWeight: 600,
              textTransform: 'uppercase',
              boxShadow: 'none',
              letterSpacing: '0.05em',
              fontSize: '1rem',
              border: '1px solid',
              borderColor: 'error.main',
              backgroundColor: 'error.main',
              '&:hover': {
                backgroundColor: 'error.dark',
                borderColor: 'error.dark',
              },
            }}
          >
            Cerrar sesión
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default Configuracion;
