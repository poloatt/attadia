import React, { useState, useEffect, useMemo } from 'react';
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
  CircularProgress,
  Tooltip,
  TextField,
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Google as GoogleIcon,
  Sync as SyncIcon,
  Close as CloseIcon,
  CloudDone as CloudDoneIcon,
  CloudOff as CloudOffIcon,
  DeleteSweep as DeleteSweepIcon,
  ExpandMore as ExpandMoreIcon,
  Build as BuildIcon,
  ArrowDownward as ImportIcon,
  ArrowUpward as ExportIcon,
  FolderOutlined as FolderIcon,
  Schedule as ScheduleIcon,
  LinkOff as LinkOffIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSnackbar } from 'notistack';
import clienteAxios from '@shared/config/axios';

const SYNC_DIRECTION_LABELS = {
  bidirectional: 'Bidireccional (Google ↔ Attadia)',
  to_google: 'Solo hacia Google',
  from_google: 'Solo desde Google',
};

function parseSyncResults(results) {
  if (!results) return null;
  return {
    objetivosCreated: results.objetivos?.created || 0,
    objetivosUpdated: results.objetivos?.updated || 0,
    toGoogle: results.tareas?.toGoogle?.success || 0,
    fromCreated: results.tareas?.fromGoogle?.created || 0,
    fromUpdated: results.tareas?.fromGoogle?.updated || 0,
    fromSkipped: results.tareas?.fromGoogle?.skipped || 0,
    seriesCreated: results.series?.seriesCreated || results.tareas?.fromGoogle?.series?.seriesCreated || 0,
    seriesUpdated: results.series?.seriesUpdated || results.tareas?.fromGoogle?.series?.seriesUpdated || 0,
    instancesLinked: results.series?.instancesLinked || results.tareas?.fromGoogle?.series?.instancesLinked || 0,
    expandCreated:
      (results.seriesExpandLocal?.instancesCreated || 0)
      + (results.seriesExpand?.instancesCreated || 0),
    expandSynced: results.seriesExpand?.instancesSynced || 0,
    expandLocalCreated: results.seriesExpandLocal?.instancesCreated || 0,
    errors: [
      ...(results.objetivos?.errors || []),
      ...(results.tareas?.toGoogle?.errors || []),
      ...(results.tareas?.fromGoogle?.errors || []),
    ],
  };
}

function SyncResultPanel({ summary, onDismiss }) {
  const b = summary.breakdown;
  const hasChanges =
    b.ObjetivosCreated + b.ObjetivosUpdated + b.tareasToGoogle
    + b.tareasFromGoogleCreated + b.tareasFromGoogleUpdated > 0;
  const severity = summary.totalErrors > 0 ? 'warning' : hasChanges ? 'success' : 'info';

  const rows = [
    b.ObjetivosCreated > 0 && { icon: <FolderIcon fontSize="small" />, text: `${b.ObjetivosCreated} objetivo(s) creado(s) en Attadia` },
    b.ObjetivosUpdated > 0 && { icon: <FolderIcon fontSize="small" />, text: `${b.ObjetivosUpdated} objetivo(s) actualizado(s)` },
    b.tareasFromGoogleCreated > 0 && { icon: <ImportIcon fontSize="small" />, text: `${b.tareasFromGoogleCreated} tarea(s) importada(s) desde Google` },
    b.tareasFromGoogleUpdated > 0 && { icon: <ImportIcon fontSize="small" />, text: `${b.tareasFromGoogleUpdated} tarea(s) actualizada(s) desde Google` },
    b.tareasToGoogle > 0 && { icon: <ExportIcon fontSize="small" />, text: `${b.tareasToGoogle} tarea(s) enviada(s) a Google` },
    b.tareasFromGoogleSkipped > 0 && {
      icon: <CloudOffIcon fontSize="small" color="info" />,
      text: `${b.tareasFromGoogleSkipped} lista(s) de Google omitida(s) (sin objetivo vinculado)`,
    },
    (b.seriesCreated + b.seriesUpdated) > 0 && {
      icon: <FolderIcon fontSize="small" />,
      text: `${b.seriesCreated + b.seriesUpdated} serie(s) recurrente(s) detectada(s)`,
    },
    b.instancesLinked > 0 && {
      icon: <ImportIcon fontSize="small" />,
      text: `${b.instancesLinked} instancia(s) vinculada(s) a series`,
    },
    b.expandLocalCreated > 0 && {
      icon: <ImportIcon fontSize="small" />,
      text: `${b.expandLocalCreated} ocurrencia(s) en calendario (series recurrentes)`,
    },
    b.expandCreated > b.expandLocalCreated && {
      icon: <ExportIcon fontSize="small" />,
      text: `${b.expandCreated - (b.expandLocalCreated || 0)} ocurrencia(s) adicionales materializadas`,
    },
    b.expandSynced > 0 && {
      icon: <ExportIcon fontSize="small" />,
      text: `${b.expandSynced} ocurrencia(s) exportada(s) a Google`,
    },
  ].filter(Boolean);

  return (
    <Alert
      severity={severity}
      onClose={onDismiss}
      sx={{ '& .MuiAlert-message': { width: '100%' } }}
    >
      <Typography variant="subtitle2" sx={{ mb: rows.length ? 1 : 0 }}>
        {hasChanges ? 'Sincronización completada' : 'Sin cambios en esta sincronización'}
      </Typography>
      {rows.length > 0 ? (
        <List dense disablePadding>
          {rows.map((row, i) => (
            <ListItem key={i} disableGutters sx={{ py: 0.25 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>{row.icon}</ListItemIcon>
              <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary={row.text} />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Vincula cada lista de Google a un objetivo en Attadia, o revisa la semana correcta en el calendario.
        </Typography>
      )}
      {!hasChanges && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          La agenda muestra tareas en el día/semana seleccionados. Las completadas aparecen atenuadas.
        </Typography>
      )}
      {summary.totalErrors > 0 && (
        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
          {summary.totalErrors} error(es). Revisa el detalle arriba en el panel de avisos.
        </Typography>
      )}
    </Alert>
  );
}

const GoogleTasksConfig = ({ open, onClose }) => {
  const [config, setConfig] = useState({
    enabled: false,
    lastSync: null,
    syncDirection: 'bidirectional',
  });
  const [autoSync, setAutoSync] = useState({ isRunning: false, nextRun: null });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [objetivoName, setObjetivoName] = useState('');
  const [applyCleanup, setApplyCleanup] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (open) {
      loadConfig();
      loadAutoSyncStatus();
      setError(null);
    }
  }, [open]);

  const lastSyncLabel = useMemo(() => {
    if (!config.lastSync) return 'Nunca';
    try {
      const d = new Date(config.lastSync);
      if (isNaN(d.getTime())) return 'Nunca';
      return `${formatDistanceToNow(d, { addSuffix: true, locale: es })} · ${format(d, "d MMM HH:mm", { locale: es })}`;
    } catch {
      return 'Nunca';
    }
  }, [config.lastSync]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await clienteAxios.get('/api/google-tasks/status');
      setConfig(response.data.status);
    } catch (err) {
      console.error('Error al cargar configuración:', err);
      enqueueSnackbar('Error al cargar configuración de Google Tasks', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadAutoSyncStatus = async () => {
    try {
      const response = await clienteAxios.get('/api/google-tasks/auto-sync/status');
      setAutoSync(response.data.autoSync);
    } catch (err) {
      console.error('Error al cargar auto-sync:', err);
    }
  };

  const handleEnableGoogleTasks = async () => {
    try {
      setLoading(true);
      const response = await clienteAxios.get('/api/google-tasks/auth-url', {
        params: { _t: Date.now() },
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (response.data.directEnable) {
        enqueueSnackbar('Google Tasks conectado', { variant: 'success' });
        setTimeout(() => { loadConfig(); loadAutoSyncStatus(); }, 500);
        return;
      }

      if (!response.data.authUrl) {
        enqueueSnackbar('No se pudo generar la URL de autorización', { variant: 'error' });
        return;
      }

      const authWindow = window.open(
        response.data.authUrl,
        'google-tasks-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes',
      );

      if (!authWindow) {
        enqueueSnackbar('Permite ventanas emergentes para conectar Google', { variant: 'warning' });
        return;
      }

      enqueueSnackbar('Completa la autorización en la ventana de Google', { variant: 'info' });

      const handleAuthMessage = (event) => {
        if (event.data?.type === 'google_tasks_auth') {
          if (event.data.status === 'success') {
            enqueueSnackbar('Google Tasks conectado', { variant: 'success' });
            setTimeout(() => { loadConfig(); loadAutoSyncStatus(); }, 500);
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
    } catch (err) {
      console.error('Error al conectar Google Tasks:', err);
      enqueueSnackbar(
        err.response?.data?.error || err.message || 'Error al conectar con Google',
        { variant: 'error' },
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDisableGoogleTasks = async () => {
    if (!window.confirm('¿Desconectar Google Tasks? Las tareas locales se conservan.')) return;
    try {
      setLoading(true);
      await clienteAxios.delete('/api/google-tasks/disable');
      setConfig((prev) => ({ ...prev, enabled: false, lastSync: null }));
      setAutoSync({ isRunning: false, nextRun: null });
      setSummary(null);
      enqueueSnackbar('Google Tasks desconectado', { variant: 'info' });
    } catch (err) {
      enqueueSnackbar('Error al desconectar', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncDirectionChange = async (event) => {
    const syncDirection = event.target.value;
    try {
      setLoading(true);
      await clienteAxios.put('/api/google-tasks/config', { syncDirection });
      setConfig((prev) => ({ ...prev, syncDirection }));
      enqueueSnackbar('Dirección de sincronización guardada', { variant: 'success' });
    } catch {
      enqueueSnackbar('No se pudo guardar la dirección de sync', { variant: 'error' });
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
        `${data.localFixed} título(s) normalizado(s) de ${data.totalProcessed} revisadas`,
        { variant: 'success' },
      );
      await loadConfig();
    } catch {
      enqueueSnackbar('Error al normalizar títulos', { variant: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  const handleAuditProject = async () => {
    if (!objetivoName.trim()) {
      enqueueSnackbar('Escribe el nombre del objetivo', { variant: 'warning' });
      return;
    }
    try {
      setSyncing(true);
      const resp = await clienteAxios.post('/api/google-tasks/audit-project', { objetivoName: objetivoName.trim() });
      enqueueSnackbar('Auditoría completada (ver consola del navegador)', { variant: 'info' });
      setError({
        type: resp.data.success ? 'info' : 'warning',
        title: 'Auditoría',
        message: 'Resultado en la consola de desarrollo (F12).',
        details: (resp.data.output || '').split('\n').filter(Boolean).slice(-4),
      });
      console.log('[AUDIT]', resp.data.output);
    } catch {
      enqueueSnackbar('Error al auditar', { variant: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  const handleCleanupProject = async () => {
    if (!objetivoName.trim()) {
      enqueueSnackbar('Escribe el nombre del objetivo', { variant: 'warning' });
      return;
    }
    try {
      setSyncing(true);
      const resp = await clienteAxios.post('/api/google-tasks/cleanup-project', {
        objetivoName: objetivoName.trim(),
        apply: applyCleanup,
      });
      enqueueSnackbar(applyCleanup ? 'Limpieza aplicada' : 'Simulación ejecutada', { variant: 'success' });
      setError({
        type: resp.data.success ? 'info' : 'warning',
        title: applyCleanup ? 'Limpieza' : 'Simulación',
        message: 'Resultado en la consola de desarrollo (F12).',
        details: (resp.data.output || '').split('\n').filter(Boolean).slice(-4),
      });
      console.log('[CLEANUP]', resp.data.output);
    } catch {
      enqueueSnackbar('Error en limpieza', { variant: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  const applySyncResults = (results) => {
    const parsed = parseSyncResults(results);
    if (!parsed) return;

    const totalSuccess =
      parsed.objetivosCreated + parsed.objetivosUpdated + parsed.toGoogle
      + parsed.fromCreated + parsed.fromUpdated;
    const totalErrors = parsed.errors.length;

    setSummary({
      totalSuccess,
      totalErrors,
        breakdown: {
          ObjetivosCreated: parsed.objetivosCreated,
          ObjetivosUpdated: parsed.objetivosUpdated,
          tareasToGoogle: parsed.toGoogle,
          tareasFromGoogleCreated: parsed.fromCreated,
          tareasFromGoogleUpdated: parsed.fromUpdated,
          tareasFromGoogleSkipped: parsed.fromSkipped,
          seriesCreated: parsed.seriesCreated,
          seriesUpdated: parsed.seriesUpdated,
          instancesLinked: parsed.instancesLinked,
          expandCreated: parsed.expandCreated,
          expandLocalCreated: parsed.expandLocalCreated,
          expandSynced: parsed.expandSynced,
        },
      });

    if (totalSuccess === 0 && parsed.fromSkipped > 0) {
      enqueueSnackbar(
        `${parsed.fromSkipped} lista(s) sin objetivo vinculado. Crea el objetivo con el mismo nombre que en Google.`,
        { variant: 'info', autoHideDuration: 8000 },
      );
    } else if (totalSuccess > 0) {
      enqueueSnackbar('Sincronización completada', { variant: 'success' });
    }

    if (totalErrors > 0) {
      setError({
        type: 'warning',
        title: 'Algunas operaciones fallaron',
        message: `${totalErrors} error(es) durante la sincronización.`,
        details: parsed.errors.slice(0, 5),
      });
    }
  };

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSummary(null);

      const response = await clienteAxios.post('/api/google-tasks/sync');
      applySyncResults(response.data.results);
      await loadConfig();

      window.dispatchEvent(new CustomEvent('googleTasksSyncCompleted', {
        detail: { results: response.data.results },
      }));
    } catch (err) {
      let errorMessage = err.response?.data?.error || 'Error en la sincronización';
      let errorType = 'error';

      if (errorMessage.includes('Permisos insuficientes')) {
        errorType = 'warning';
        errorMessage += ' Revisa los permisos de Google Tasks en tu cuenta.';
      } else if (errorMessage.includes('Token') || errorMessage.includes('credentials')) {
        errorMessage = 'Sesión de Google expirada. Vuelve a conectar.';
      } else if (errorMessage.includes('Límite') || errorMessage.includes('cuota')) {
        errorType = 'warning';
        errorMessage = 'Límite de Google alcanzado. Espera unos minutos.';
      }

      setError({ type: errorType, title: 'No se pudo sincronizar', message: errorMessage });
      enqueueSnackbar(errorMessage, { variant: errorType });
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleAutoSync = async () => {
    try {
      if (autoSync.isRunning) {
        await clienteAxios.post('/api/google-tasks/auto-sync/stop');
        enqueueSnackbar('Sincronización automática desactivada', { variant: 'info' });
      } else {
        await clienteAxios.post('/api/google-tasks/auto-sync/start');
        enqueueSnackbar('Sincronización automática activada (cada ~10 min)', { variant: 'success' });
      }
      await loadAutoSyncStatus();
    } catch {
      enqueueSnackbar('Error al cambiar auto-sync', { variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <GoogleIcon color="primary" />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="div" lineHeight={1.2}>
            Google Tasks
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Objetivos ↔ listas · Tareas ↔ tasks
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="Cerrar">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Stack spacing={2}>
          {error && (
            <Alert
              severity={error.type}
              onClose={() => setError(null)}
            >
              <Typography variant="subtitle2">{error.title}</Typography>
              <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>
                {error.message}
              </Typography>
              {error.details?.length > 0 && (
                <Box sx={{ mt: 1, maxHeight: 80, overflow: 'auto' }}>
                  {error.details.map((d, i) => (
                    <Typography key={i} variant="caption" display="block" color="text.secondary">
                      · {d}
                    </Typography>
                  ))}
                </Box>
              )}
            </Alert>
          )}

          {syncing && (
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  Sincronizando con Google Tasks…
                </Typography>
              </Stack>
              <LinearProgress />
            </Box>
          )}

          {!syncing && summary && (
            <SyncResultPanel summary={summary} onDismiss={() => setSummary(null)} />
          )}

          {config.enabled ? (
            <>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                  <CloudDoneIcon color="success" sx={{ mt: 0.25 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2">Conectado</Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.25 }}>
                      <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        Última sync: {lastSyncLabel}
                      </Typography>
                    </Stack>
                    <FormControl size="small" fullWidth sx={{ mt: 1 }}>
                      <InputLabel id="gtasks-sync-direction-label">Dirección</InputLabel>
                      <Select
                        labelId="gtasks-sync-direction-label"
                        label="Dirección"
                        value={config.syncDirection || 'bidirectional'}
                        onChange={handleSyncDirectionChange}
                        disabled={loading || syncing}
                      >
                        {Object.entries(SYNC_DIRECTION_LABELS).map(([value, label]) => (
                          <MenuItem key={value} value={value}>
                            {label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Tooltip title="Desconectar cuenta de Google">
                    <IconButton size="small" onClick={handleDisableGoogleTasks} disabled={loading || syncing}>
                      <LinkOffIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ pl: 4.25 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    <strong>Alcance:</strong> solo tareas y eventos con <strong>objetivo</strong> asignado
                    se sincronizan con Google Tasks (Objetivo ↔ lista, tarea ↔ task).
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Las <strong>subtareas</strong> se guardan en el campo <em>notas</em> de Google, no como
                    tareas hijas.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Los hábitos del día (Rutinas / franja de iconos en Foco) no se exportan a Google Tasks.
                  </Typography>
                </Box>
              </Paper>

              <Button
                variant="contained"
                size="medium"
                fullWidth
                startIcon={syncing ? <CircularProgress size={18} color="inherit" /> : <SyncIcon />}
                onClick={handleSyncNow}
                disabled={syncing || loading}
                sx={{ py: 1.25 }}
              >
                {syncing ? 'Sincronizando…' : 'Sincronizar ahora'}
              </Button>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 0.5,
                }}
              >
                <Box>
                  <Typography variant="body2">Sincronización automática</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cada ~10–15 min en este servidor (afecta a todos los usuarios conectados en la instancia)
                  </Typography>
                </Box>
                <Switch
                  checked={autoSync.isRunning}
                  onChange={handleToggleAutoSync}
                  disabled={loading || syncing}
                  size="small"
                />
              </Box>

              <Divider />

              <Accordion
                expanded={showAdvanced}
                onChange={(_, exp) => setShowAdvanced(exp)}
                disableGutters
                elevation={0}
                sx={{
                  bgcolor: 'transparent',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0, minHeight: 40 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <BuildIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Herramientas avanzadas
                    </Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0, pt: 0 }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Normalizar títulos
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        Quita prefijos [entre corchetes] en tareas locales. No modifica Google.
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        startIcon={<DeleteSweepIcon />}
                        onClick={handleCleanupDuplicates}
                        disabled={syncing || loading}
                      >
                        Normalizar títulos locales
                      </Button>
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Por objetivo
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        Auditoría y limpieza para soporte (salida en consola F12).
                      </Typography>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="Nombre del objetivo, ej. Salud"
                        value={objetivoName}
                        onChange={(e) => setObjetivoName(e.target.value)}
                        disabled={syncing}
                        sx={{ mb: 1 }}
                      />
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleAuditProject}
                          disabled={syncing || !objetivoName.trim()}
                        >
                          Auditar
                        </Button>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={applyCleanup}
                              onChange={(e) => setApplyCleanup(e.target.checked)}
                              disabled={syncing}
                            />
                          }
                          label={<Typography variant="caption">Aplicar cambios</Typography>}
                        />
                        <Button
                          variant="outlined"
                          color="warning"
                          size="small"
                          onClick={handleCleanupProject}
                          disabled={syncing || !objetivoName.trim()}
                        >
                          {applyCleanup ? 'Limpiar' : 'Simular'}
                        </Button>
                      </Stack>
                    </Box>
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </>
          ) : (
            <Stack spacing={2} alignItems="stretch">
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                <CloudOffIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Conecta tu cuenta de Google para sincronizar listas y tareas con tus objetivos en Attadia.
                </Typography>
              </Paper>
              <Button
                variant="contained"
                size="large"
                startIcon={<GoogleIcon />}
                onClick={handleEnableGoogleTasks}
                disabled={loading}
                fullWidth
              >
                Conectar con Google
              </Button>
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2, pt: 0 }}>
        <Button onClick={onClose} size="medium">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GoogleTasksConfig;
