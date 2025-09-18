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
  LinearProgress,
  IconButton,
  Stack
} from '@mui/material';
import {
  Google as GoogleIcon,
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  CloudSync as CloudSyncIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import clienteAxios from '../../config/axios';

const GoogleTasksConfig = ({ open, onClose }) => {
  const [config, setConfig] = useState({
    enabled: false,
    lastSync: null
  });
  const [autoSync, setAutoSync] = useState({
    isRunning: false,
    nextRun: null
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (open) {
      loadConfig();
      loadAutoSyncStatus();
    }
  }, [open]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await clienteAxios.get('/api/google-tasks/status');
      setConfig(response.data.status);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      enqueueSnackbar('Error al cargar configuración de Google Tasks', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadAutoSyncStatus = async () => {
    try {
      const response = await clienteAxios.get('/api/google-tasks/auto-sync/status');
      setAutoSync(response.data.autoSync);
    } catch (error) {
      console.error('Error al cargar estado de sincronización automática:', error);
    }
  };

  const handleEnableGoogleTasks = async () => {
    try {
      setLoading(true);
      
      const response = await clienteAxios.get('/api/google-tasks/auth-url', {
        params: { _t: Date.now() },
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (response.data.directEnable) {
        enqueueSnackbar('Google Tasks conectado exitosamente', { variant: 'success' });
        setTimeout(() => {
          loadConfig();
          loadAutoSyncStatus();
        }, 500);
        return;
      }
      
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
        enqueueSnackbar('No se pudo abrir la ventana de autorización', { variant: 'error' });
        return;
      }

      enqueueSnackbar('Completa la autorización en la ventana emergente', { variant: 'info' });

      const handleAuthMessage = (event) => {
        if (event.data && event.data.type === 'google_tasks_auth') {
          if (event.data.status === 'success') {
            enqueueSnackbar('Google Tasks conectado exitosamente', { variant: 'success' });
            setTimeout(() => {
              loadConfig();
              loadAutoSyncStatus();
            }, 500);
          } else if (event.data.status === 'error') {
            enqueueSnackbar('Error en la autorización', { variant: 'error' });
          }
          window.removeEventListener('message', handleAuthMessage);
          setLoading(false);
        }
      };

      window.addEventListener('message', handleAuthMessage);
      setTimeout(() => {
        window.removeEventListener('message', handleAuthMessage);
        setLoading(false);
      }, 300000);
    } catch (error) {
      console.error('Error al habilitar Google Tasks:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Error al conectar con Google Tasks';
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
      setAutoSync({ isRunning: false, nextRun: null });
      enqueueSnackbar('Google Tasks deshabilitado exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error al deshabilitar Google Tasks:', error);
      enqueueSnackbar('Error al deshabilitar Google Tasks', { variant: 'error' });
    } finally {
      setLoading(false);
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
      
      await loadConfig();
      
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

  const handleToggleAutoSync = async () => {
    try {
      if (autoSync.isRunning) {
        await clienteAxios.post('/api/google-tasks/auto-sync/stop');
        enqueueSnackbar('Sincronización automática detenida', { variant: 'info' });
      } else {
        await clienteAxios.post('/api/google-tasks/auto-sync/start');
        enqueueSnackbar('Sincronización automática iniciada', { variant: 'success' });
      }
      await loadAutoSyncStatus();
    } catch (error) {
      console.error('Error al cambiar estado de sincronización automática:', error);
      enqueueSnackbar('Error al cambiar configuración de sincronización automática', { variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <GoogleIcon color="primary" />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Google Tasks
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        <Stack spacing={2}>
          {/* Estado de conexión - Mínimo */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudSyncIcon color={config.enabled ? 'success' : 'disabled'} />
              <Typography variant="body1">
                Conexión
              </Typography>
            </Box>
            {config.enabled ? (
              <CheckCircleIcon color="success" />
            ) : (
              <CloseIcon color="disabled" />
            )}
          </Box>

          {/* Controles de sincronización - Mínimos */}
          {config.enabled ? (
            <>
              {/* Auto-sync switch */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2">
                  Auto-sync
                </Typography>
                <Switch
                  checked={autoSync.isRunning}
                  onChange={handleToggleAutoSync}
                  disabled={loading}
                  size="small"
                />
              </Box>

              {/* Botón de sync manual */}
              <Button
                variant="contained"
                startIcon={syncing ? <SyncIcon className="animate-spin" /> : <SyncIcon />}
                onClick={handleSyncNow}
                disabled={syncing || loading}
                size="small"
                fullWidth
              >
                {syncing ? 'Sincronizando...' : 'Sync Manual'}
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<GoogleIcon />}
              onClick={handleEnableGoogleTasks}
              disabled={loading}
              size="small"
              fullWidth
            >
              Conectar Google
            </Button>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 1 }}>
        <Button onClick={onClose} variant="outlined" size="small">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GoogleTasksConfig;