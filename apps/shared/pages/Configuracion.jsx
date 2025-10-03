import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Switch, 
  FormControl, 
  FormControlLabel, 
  Divider, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import { useUISettings } from '../context/UISettingsContext';
import { useSidebar } from '../context/SidebarContext';

import { useAuth } from '../context/AuthContext';
import { Toolbar } from '../navigation';
import useResponsive from '../hooks/useResponsive';

export function Configuracion() {
  const { isMobile, theme } = useResponsive();
  const { 
    showEntityToolbarNavigation, 
    toggleEntityToolbarNavigation,
    showSidebarCollapsed,
    toggleSidebarCollapsed
  } = useUISettings();
  const { isOpen, toggleSidebar } = useSidebar();
  const { logout, user, loading } = useAuth();
  
  // Estados para el diálogo de confirmación y manejo de errores
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [logoutError, setLogoutError] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
                    checked={showSidebarCollapsed}
                    onChange={toggleSidebarCollapsed}
                    color="primary"
                    disabled={!isMobile} // Solo habilitado en móvil
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Habilitar Sidebar
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Muestra u oculta la barra lateral de navegación (solo en móvil)
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
                    disabled={!isMobile} // Solo habilitado en móvil
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Habilitar Navigation Toolbar
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Muestra u oculta la barra de navegación superior en páginas de entidades (solo en móvil)
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: 'flex-start', m: 0 }}
              />
            </FormControl>
          </Box>
        </Paper>



        {/* Sección de Cuenta de Usuario */}
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
            Cuenta de Usuario
          </Typography>

          {user && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Usuario actual:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {user.name || user.email || 'Usuario'}
              </Typography>
              {user.email && (
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              )}
            </Box>
          )}

          {logoutError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {logoutError}
            </Alert>
          )}

          <Button
            variant="outlined"
            color="error"
            onClick={() => setShowLogoutDialog(true)}
            disabled={isLoggingOut || loading}
            startIcon={isLoggingOut ? <CircularProgress size={16} /> : null}
            sx={{
              borderRadius: 0,
              px: 3,
              py: 1,
              fontWeight: 500,
              textTransform: 'none',
              borderWidth: '2px',
              '&:hover': {
                borderWidth: '2px',
                backgroundColor: 'error.main',
                color: 'white',
              },
            }}
          >
            {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
          </Button>
        </Paper>

        {/* Diálogo de confirmación para cerrar sesión */}
        <Dialog
          open={showLogoutDialog}
          onClose={() => setShowLogoutDialog(false)}
          PaperProps={{
            sx: {
              borderRadius: 0,
              bgcolor: 'background.default',
              minWidth: 320
            }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            Confirmar cierre de sesión
          </DialogTitle>
          <DialogContent sx={{ pb: 2 }}>
            <Typography>
              ¿Estás seguro que deseas cerrar tu sesión? 
              Tendrás que volver a iniciar sesión para acceder a la aplicación.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button 
              onClick={() => setShowLogoutDialog(false)}
              variant="outlined"
              sx={{ borderRadius: 0 }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={async () => {
                try {
                  setIsLoggingOut(true);
                  setLogoutError(null);
                  await logout();
                } catch (error) {
                  setLogoutError('Error al cerrar sesión. Inténtalo de nuevo.');
                  console.error('Error en logout:', error);
                } finally {
                  setIsLoggingOut(false);
                  setShowLogoutDialog(false);
                }
              }}
              color="error" 
              variant="contained"
              disabled={isLoggingOut}
              sx={{ 
                borderRadius: 0,
                '&:hover': {
                  backgroundColor: 'error.dark',
                }
              }}
            >
              {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}

export default Configuracion;
