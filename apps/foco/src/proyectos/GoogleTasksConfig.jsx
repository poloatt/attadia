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
  Stack,
  Alert,
  Chip,
  CircularProgress,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  Google as GoogleIcon,
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  CloudSync as CloudSyncIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  DeleteSweep as DeleteSweepIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import clienteAxios from '@shared/config/axios';

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
  const [syncProgress, setSyncProgress] = useState({
    current: 0,
    total: 0,
    message: ''
  });
  const [error, setError] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
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

  const handleCleanupDuplicates = async () => {
    try {
      setSyncing(true);
      setError(null);
      
      const response = await clienteAxios.post('/api/google-tasks/cleanup');
      const { data } = response.data;
      
      enqueueSnackbar(
        `✅ Limpieza completada: ${data.localFixed} títulos limpiados de ${data.totalProcessed} procesadas`,
        { variant: 'success', autoHideDuration: 5000 }
      );
      
      await loadConfig();
      
    } catch (error) {
      console.error('Error en limpieza de duplicados:', error);
      enqueueSnackbar(
        '❌ Error al limpiar duplicados',
        { variant: 'error', autoHideDuration: 5000 }
      );
    } finally {
      setSyncing(false);
    }
  };

  // Acciones de auditoría/limpieza por proyecto
  const [projectName, setProjectName] = useState('');
  const [applyCleanup, setApplyCleanup] = useState(false);

  const handleAuditProject = async () => {
    try {
      if (!projectName) {
        enqueueSnackbar('Ingresa un nombre de proyecto', { variant: 'warning' });
        return;
      }
      setSyncing(true);
      const resp = await clienteAxios.post('/api/google-tasks/audit-project', { projectName });
      enqueueSnackbar('Auditoría completada', { variant: 'info' });
      setError({
        type: resp.data.success ? 'info' : 'warning',
        title: `Auditoría ${resp.data.success ? 'exitosa' : 'con advertencias'}`,
        message: 'Revisa la salida (consola).',
        details: (resp.data.output || '').split('\n').filter(Boolean).slice(-5)
      });
      // eslint-disable-next-line no-console
      console.log('[AUDIT OUTPUT]', resp.data.output);
    } catch (e) {
      enqueueSnackbar('Error al auditar proyecto', { variant: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  const handleCleanupProject = async () => {
    try {
      if (!projectName) {
        enqueueSnackbar('Ingresa un nombre de proyecto', { variant: 'warning' });
        return;
      }
      setSyncing(true);
      const resp = await clienteAxios.post('/api/google-tasks/cleanup-project', { projectName, apply: applyCleanup });
      enqueueSnackbar(applyCleanup ? 'Limpieza aplicada' : 'Simulación de limpieza ejecutada', { variant: 'success' });
      setError({
        type: resp.data.success ? 'info' : 'warning',
        title: `Limpieza ${resp.data.success ? 'completada' : 'con advertencias'}`,
        message: 'Revisa la salida (consola).',
        details: (resp.data.output || '').split('\n').filter(Boolean).slice(-5)
      });
      // eslint-disable-next-line no-console
      console.log('[CLEANUP OUTPUT]', resp.data.output);
    } catch (e) {
      enqueueSnackbar('Error al limpiar proyecto', { variant: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSyncProgress({ current: 0, total: 0, message: 'Iniciando sincronización...' });
      
      // Simular progreso para mejor UX
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => ({
          ...prev,
          current: Math.min(prev.current + 1, prev.total || 10),
          message: prev.current < 5 ? 'Sincronizando tareas hacia Google...' : 
                   prev.current < 8 ? 'Sincronizando tareas desde Google...' :
                   'Finalizando sincronización...'
        }));
      }, 500);
      
      const response = await clienteAxios.post('/api/google-tasks/sync');
      clearInterval(progressInterval);
      
      const { results } = response.data;
      
      // Mostrar resultados con el nuevo formato
      const proyectosCreated = results.proyectos?.created || 0;
      const proyectosUpdated = results.proyectos?.updated || 0;
      const tareasToGoogle = results.tareas?.toGoogle?.success || 0;
      const tareasFromGoogleCreated = results.tareas?.fromGoogle?.created || 0;
      const tareasFromGoogleUpdated = results.tareas?.fromGoogle?.updated || 0;
      
      const totalSuccess = proyectosCreated + proyectosUpdated + tareasToGoogle + tareasFromGoogleCreated + tareasFromGoogleUpdated;
      const totalErrors = (results.proyectos?.errors?.length || 0) + 
                         (results.tareas?.toGoogle?.errors?.length || 0) + 
                         (results.tareas?.fromGoogle?.errors?.length || 0);
      
      if (totalSuccess > 0) {
        let message = `✅ Sincronización exitosa: `;
        const parts = [];
        
        if (proyectosCreated > 0) parts.push(`${proyectosCreated} proyectos creados`);
        if (proyectosUpdated > 0) parts.push(`${proyectosUpdated} proyectos actualizados`);
        if (tareasToGoogle > 0) parts.push(`${tareasToGoogle} tareas enviadas a Google`);
        if (tareasFromGoogleCreated > 0) parts.push(`${tareasFromGoogleCreated} tareas importadas`);
        if (tareasFromGoogleUpdated > 0) parts.push(`${tareasFromGoogleUpdated} tareas actualizadas`);
        
        message += parts.join(', ');
        if (totalErrors > 0) message += `, ${totalErrors} errores`;
        
        enqueueSnackbar(message, { variant: 'success', autoHideDuration: 6000 });
      }
      
      if (totalErrors > 0) {
        setError({
          type: 'warning',
          title: 'Sincronización completada con errores',
          message: `${totalErrors} operaciones fallaron. Revisa los detalles.`,
          details: [
            ...(results.proyectos?.errors || []),
            ...(results.tareas?.toGoogle?.errors || []),
            ...(results.tareas?.fromGoogle?.errors || [])
          ]
        });
      }
      
      await loadConfig();
      
      window.dispatchEvent(new CustomEvent('googleTasksSyncCompleted', {
        detail: { results }
      }));
      
    } catch (error) {
      console.error('Error en sincronización:', error);
      
      let errorMessage = 'Error en la sincronización';
      let errorType = 'error';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
        
        // Clasificar errores según las mejores prácticas de Google
        if (errorMessage.includes('Permisos insuficientes')) {
          errorType = 'warning';
          errorMessage += '\n\nSolución: Verifica que la aplicación tenga los permisos necesarios en tu cuenta de Google.';
        } else if (errorMessage.includes('Token de acceso inválido')) {
          errorType = 'error';
          errorMessage += '\n\nSolución: Reconecta tu cuenta de Google desde la configuración.';
        } else if (errorMessage.includes('Límite de solicitudes')) {
          errorType = 'warning';
          errorMessage += '\n\nSolución: Espera unos minutos antes de intentar nuevamente.';
        } else if (errorMessage.includes('Error temporal del servidor')) {
          errorType = 'warning';
          errorMessage += '\n\nSolución: Intenta nuevamente en unos minutos.';
        }
      }
      
      setError({
        type: errorType,
        title: 'Error en sincronización',
        message: errorMessage
      });
      
      enqueueSnackbar(errorMessage, { variant: errorType, autoHideDuration: 8000 });
    } finally {
      setSyncing(false);
      setSyncProgress({ current: 0, total: 0, message: '' });
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
          {/* Botón para mostrar información */}
          {config.enabled && (
            <Button
              variant="text"
              size="small"
              startIcon={showInfo ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowInfo(!showInfo)}
              sx={{ 
                color: 'text.secondary',
                justifyContent: 'flex-start',
                textTransform: 'none',
                fontSize: '0.875rem'
              }}
            >
              {showInfo ? 'Ocultar información' : 'Ver cómo funciona'}
            </Button>
          )}

          {/* Información explicativa */}
          {config.enabled && (
            <Collapse in={showInfo} timeout="auto" unmountOnExit>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>ℹ️ Sincronización:</strong> Proyectos → TaskLists, Tareas → Tasks, Subtareas → Tasks con parent
                </Typography>
              </Alert>
            </Collapse>
          )}

          {/* Mostrar errores */}
          {error && (
            <Alert 
              severity={error.type} 
              sx={{ mb: 2 }}
              action={
                <IconButton
                  size="small"
                  onClick={() => setError(null)}
                  color="inherit"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              }
            >
              <Typography variant="body2">
                <strong>{error.title}</strong><br/>
                {error.message}
              </Typography>
              {error.details && error.details.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Detalles:
                  </Typography>
                  {error.details.slice(0, 3).map((detail, index) => (
                    <Chip 
                      key={index}
                      label={detail}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 0.5, mt: 0.5 }}
                    />
                  ))}
                  {error.details.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      ... y {error.details.length - 3} más
                    </Typography>
                  )}
                </Box>
              )}
            </Alert>
          )}

          {/* Progreso de sincronización */}
          {syncing && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {syncProgress.message}
                </Typography>
              </Box>
              {syncProgress.total > 0 && (
                <LinearProgress 
                  variant="determinate" 
                  value={(syncProgress.current / syncProgress.total) * 100}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              )}
            </Box>
          )}
          
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
              <Tooltip title={syncing ? "Sincronización en progreso..." : "Sincronizar tareas con Google Tasks"}>
                <Button
                  variant="contained"
                  startIcon={
                    syncing ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <SyncIcon />
                    )
                  }
                  onClick={handleSyncNow}
                  disabled={syncing || loading}
                  size="small"
                  fullWidth
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: syncing ? 'none' : 'translateY(-1px)',
                      boxShadow: syncing ? 'none' : 2
                    },
                    transition: 'all 0.2s ease-in-out',
                    mb: 1
                  }}
                >
                  {syncing ? 'Sincronizando...' : 'Sync Manual'}
                </Button>
              </Tooltip>

              {/* Botón de limpieza de duplicados */}
              <Tooltip title="Limpiar tareas duplicadas y spam de Google Sync">
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={
                    syncing ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <DeleteSweepIcon />
                    )
                  }
                  onClick={handleCleanupDuplicates}
                  disabled={syncing || loading}
                  size="small"
                  fullWidth
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: syncing ? 'none' : 'translateY(-1px)',
                      boxShadow: syncing ? 'none' : 2,
                      backgroundColor: 'warning.light',
                      color: 'warning.contrastText'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  {syncing ? 'Limpiando...' : 'Limpiar Duplicados'}
                </Button>
              </Tooltip>

              {/* Auditoría/Limpieza por proyecto */}
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Auditoría/Limpieza por proyecto
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <input
                    type="text"
                    placeholder="Nombre del proyecto (ej: Salud)"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid #ccc' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleAuditProject}
                    disabled={syncing || !projectName}
                  >
                    Auditar proyecto
                  </Button>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={applyCleanup}
                        onChange={(e) => setApplyCleanup(e.target.checked)}
                      />
                    }
                    label={<Typography variant="caption">Aplicar cambios</Typography>}
                    sx={{ ml: 1 }}
                  />
                  <Button
                    variant="contained"
                    color="warning"
                    size="small"
                    onClick={handleCleanupProject}
                    disabled={syncing || !projectName}
                  >
                    {applyCleanup ? 'Limpiar proyecto' : 'Simular limpieza'}
                  </Button>
                </Box>
              </Box>
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