import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  Stack,
  LinearProgress,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Divider
} from '@mui/material';
import {
  Google as GoogleIcon,
  Sync as SyncIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
  CloudSync as CloudSyncIcon,
  Task as TaskIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import clienteAxios from '../../config/axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const GoogleTasksConfig = ({ open, onClose }) => {
  const [config, setConfig] = useState({
    enabled: false,
    lastSync: null,
    syncDirection: 'bidirectional'
  });

  // Debug del estado del config
  console.log('🔧 Estado actual del config:', config);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (open) {
      loadConfig();
      loadStats();
    }
  }, [open]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await clienteAxios.get('/api/google-tasks/status');
      console.log('📊 Configuración recibida del backend:', response.data);
      console.log('📊 Status específico:', response.data.status);
      setConfig(response.data.status);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      enqueueSnackbar('Error al cargar configuración de Google Tasks', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await clienteAxios.get('/api/google-tasks/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const handleEnableGoogleTasks = async () => {
    try {
      console.log('🔄 Iniciando conexión con Google Tasks...');
      setLoading(true);
      
      // Obtener URL de autorización (evitar cache)
      console.log('📡 Solicitando URL de autorización...');
      const response = await clienteAxios.get('/api/google-tasks/auth-url', {
        params: { _t: Date.now() },
        headers: { 'Cache-Control': 'no-cache' }
      });
      console.log('✅ Respuesta del servidor:', response.data);

      // Si se habilitó directamente usando sesión existente
      if (response.data.directEnable) {
        console.log('🎉 Google Tasks habilitado directamente');
        enqueueSnackbar(response.data.message || 'Google Tasks conectado usando tu sesión de Google', { variant: 'success' });
        
        // Recargar configuración y estadísticas
        setTimeout(() => {
          loadConfig();
          loadStats();
        }, 500);
        return;
      }
      
      // Si necesita OAuth, abrir ventana de autorización
      if (!response.data.authUrl) {
        enqueueSnackbar('No se pudo generar URL de autorización', { variant: 'error' });
        return;
      }

      const authWindow = window.open(
        response.data.authUrl,
        'google-tasks-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!authWindow) {
        enqueueSnackbar('No se pudo abrir la ventana de autorización. Verifica que no esté bloqueada por el navegador.', { variant: 'error' });
        return;
      }

      enqueueSnackbar('Completa la autorización en la ventana emergente', { variant: 'info' });

      // Escuchar mensajes del popup de autorización
      const handleAuthMessage = (event) => {
        if (event.data && event.data.type === 'google_tasks_auth') {
          console.log('📨 Mensaje recibido del popup:', event.data);
          
          if (event.data.status === 'success') {
            enqueueSnackbar(event.data.message || 'Google Tasks conectado exitosamente', { variant: 'success' });
            // Recargar configuración y estadísticas
            setTimeout(() => {
              loadConfig();
              loadStats();
            }, 500);
          } else if (event.data.status === 'error') {
            enqueueSnackbar(event.data.message || 'Error en la autorización', { variant: 'error' });
          }
          
          // Limpiar el listener
          window.removeEventListener('message', handleAuthMessage);
          setLoading(false);
        }
      };

      window.addEventListener('message', handleAuthMessage);

      // Limpiar el listener después de 5 minutos si no se recibe respuesta
      setTimeout(() => {
        window.removeEventListener('message', handleAuthMessage);
        setLoading(false);
      }, 300000);
    } catch (error) {
      console.error('Error al habilitar Google Tasks:', error);
      
      // Mostrar mensaje de error más específico
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Error al conectar con Google Tasks';
      
      console.log('📋 Mensaje de error:', errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisableGoogleTasks = async () => {
    try {
      setLoading(true);
      await clienteAxios.delete('/api/google-tasks/disable');
      
      setConfig(prev => ({
        ...prev,
        enabled: false,
        lastSync: null
      }));
      
      setStats(null);
      enqueueSnackbar('Google Tasks deshabilitado exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error al deshabilitar Google Tasks:', error);
      enqueueSnackbar('Error al deshabilitar Google Tasks', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncDirectionChange = async (event) => {
    const newDirection = event.target.value;
    
    try {
      await clienteAxios.put('/api/google-tasks/config', {
        syncDirection: newDirection
      });
      
      setConfig(prev => ({
        ...prev,
        syncDirection: newDirection
      }));
      
      enqueueSnackbar('Dirección de sincronización actualizada', { variant: 'success' });
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      enqueueSnackbar('Error al actualizar configuración', { variant: 'error' });
    }
  };

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      const response = await clienteAxios.post('/api/google-tasks/sync');
      
      const { results } = response.data;
      
      let message = 'Sincronización completada: ';
      message += `${results.toGoogle.success} tareas enviadas a Google`;
      if (results.fromGoogle) {
        message += `, ${results.fromGoogle.created} creadas, ${results.fromGoogle.updated} actualizadas desde Google`;
      }
      
      enqueueSnackbar(message, { variant: 'success' });
      
      // Recargar estadísticas
      await loadStats();
      await loadConfig();
      
      // Notificar a la página de Tareas para que se actualice
      window.dispatchEvent(new CustomEvent('googleTasksSyncCompleted', {
        detail: { results }
      }));
      
    } catch (error) {
      console.error('Error en sincronización:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error en la sincronización', 
        { variant: 'error' }
      );
    } finally {
      setSyncing(false);
    }
  };

  const getSyncDirectionLabel = (direction) => {
    switch (direction) {
      case 'bidirectional':
        return 'Bidireccional';
      case 'to_google':
        return 'Solo hacia Google';
      case 'from_google':
        return 'Solo desde Google';
      default:
        return direction;
    }
  };

  const getSyncDirectionDescription = (direction) => {
    switch (direction) {
      case 'bidirectional':
        return 'Las tareas se sincronizan en ambas direcciones';
      case 'to_google':
        return 'Solo se envían tareas de Attadia a Google Tasks';
      case 'from_google':
        return 'Solo se importan tareas desde Google Tasks';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <GoogleIcon color="primary" />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Configuración de Google Tasks
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        <Stack spacing={3}>
          {/* Estado de conexión */}
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CloudSyncIcon color={config.enabled ? 'success' : 'disabled'} />
                  <Typography variant="h6">
                    Estado de Conexión
                  </Typography>
                </Box>
                <Chip
                  icon={config.enabled ? <CheckCircleIcon /> : <ErrorIcon />}
                  label={config.enabled ? 'Conectado' : 'Desconectado'}
                  color={config.enabled ? 'success' : 'default'}
                  variant="outlined"
                />
              </Box>

              {config.enabled ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Tu cuenta está conectada con Google Tasks. Las tareas se sincronizarán automáticamente.
                  </Typography>
                  
                  {config.lastSync && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <ScheduleIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Última sincronización: {format(new Date(config.lastSync), 'dd MMM yyyy HH:mm', { locale: es })}
                      </Typography>
                    </Box>
                  )}

                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDisableGoogleTasks}
                    disabled={loading}
                    startIcon={<CloseIcon />}
                  >
                    Desconectar Google Tasks
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Conecta tu cuenta de Google para sincronizar automáticamente tus tareas con Google Tasks.
                  </Typography>
                  
                  <Button
                    variant="contained"
                    startIcon={<GoogleIcon />}
                    onClick={handleEnableGoogleTasks}
                    disabled={loading}
                  >
                    Conectar con Google Tasks
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Configuración de sincronización */}
          {config.enabled && (
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <SettingsIcon color="primary" />
                  <Typography variant="h6">
                    Configuración de Sincronización
                  </Typography>
                </Box>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Dirección de Sincronización</InputLabel>
                  <Select
                    value={config.syncDirection}
                    label="Dirección de Sincronización"
                    onChange={handleSyncDirectionChange}
                  >
                    <MenuItem value="bidirectional">
                      <Box>
                        <Typography variant="body1">Bidireccional</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Sincroniza en ambas direcciones
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="to_google">
                      <Box>
                        <Typography variant="body1">Solo hacia Google</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Solo envía tareas a Google Tasks
                        </Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="from_google">
                      <Box>
                        <Typography variant="body1">Solo desde Google</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Solo importa tareas desde Google Tasks
                        </Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    {getSyncDirectionDescription(config.syncDirection)}
                  </Typography>
                </Alert>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={syncing ? <SyncIcon className="animate-spin" /> : <SyncIcon />}
                    onClick={handleSyncNow}
                    disabled={syncing || loading}
                  >
                    {syncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Estadísticas */}
          {stats && stats.enabled && (
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TaskIcon color="primary" />
                  <Typography variant="h6">
                    Estadísticas de Sincronización
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {stats.tasks.synced}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Sincronizadas
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {stats.tasks.pending}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Pendientes
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="error.main">
                        {stats.tasks.errors}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Con Errores
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary.main">
                        {stats.tasks.total}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {stats.lastSync && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                      Última sincronización: {format(new Date(stats.lastSync), 'dd MMM yyyy HH:mm', { locale: es })}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GoogleTasksConfig;
