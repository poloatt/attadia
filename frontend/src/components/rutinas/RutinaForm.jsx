import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Grid,
  Chip,
  Divider,
  Card,
  CardContent,
  Fab,
  Tooltip
} from '@mui/material';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import DateRangeIcon from '@mui/icons-material/DateRange';
import EventIcon from '@mui/icons-material/Event';
import SettingsIcon from '@mui/icons-material/Settings';
import clienteAxios from '../../config/axios';
import { useSnackbar } from 'notistack';
import { useDebounce } from './utils/hooks';
import { defaultFormData, formatDate, iconConfig } from './utils/iconConfig';
import { useNavigate, useParams } from 'react-router-dom';
import { useRutinas } from '../../hooks/useRutinas';
import { useAuth } from '../../hooks/useAuth';
import ChecklistSection from './ChecklistSection';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import TextField from "@mui/material/TextField";
import { format } from 'date-fns';
import SyncIcon from '@mui/icons-material/Sync';
import PublishIcon from '@mui/icons-material/Publish';
import SaveIcon from '@mui/icons-material/Save';
import UserHabitsPreferences from './UserHabitsPreferences';
import TuneIcon from '@mui/icons-material/Tune';

export const RutinaForm = ({ open = true, onClose, initialData, isEditing }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [fechaError, setFechaError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [disabledDates, setDisabledDates] = useState([]);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const submitButtonRef = useRef(null);
  const submitInProgress = useRef(false);
  const { syncRutinaWithGlobal, updateGlobalFromRutina } = useRutinas();
  const navigate = useNavigate();
  const autoSaveTimeout = useRef(null);
  
  const [rutinaData, setRutinaData] = useState({
    bodyCare: {},
    nutricion: {},
    ejercicio: {},
    cleaning: {},
    config: {
      bodyCare: {},
      nutricion: {},
      ejercicio: {},
      cleaning: {}
    }
  });

  const [formData, setFormData] = useState(() => {
    if (!initialData) return { 
      fecha: defaultFormData.fecha,
      useGlobalConfig: true // Siempre usar configuración global por defecto
    };
    
    return {
      fecha: initialData.fecha ? new Date(initialData.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      useGlobalConfig: true // Siempre usar configuración global por defecto
    };
  });

  // Usar debounce para la validación de fechas
  const debouncedFecha = useDebounce(formData.fecha, 500);

  // Cargar datos de la rutina cuando se reciben como prop
  useEffect(() => {
    if (initialData) {
      setRutinaData(initialData);
      setFormData({ 
        fecha: initialData.fecha ? new Date(initialData.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        useGlobalConfig: true // Siempre usar configuración global por defecto
      });
      
      // Añadir logs para depurar el valor de completitud
      console.log('[RutinaForm] Datos recibidos del backend:', {
        id: initialData._id,
        fecha: initialData.fecha,
        completitud: initialData.completitud, 
        completitudPorSeccion: initialData.completitudPorSeccion,
        completitudPorcentaje: initialData.completitud ? Math.round(initialData.completitud * 100) : 0
      });
    }
  }, [initialData]);

  // Efecto para validar la fecha cuando cambia (con debounce)
  useEffect(() => {
    if (!debouncedFecha) return;
    
    if (initialData && initialData._id) {
      const fechaOriginal = new Date(initialData.fecha).toISOString().split('T')[0];
      if (fechaOriginal === debouncedFecha) {
        return;
      }
    }
    
    const validateDate = async () => {
      try {
        setIsValidating(true);
        const response = await clienteAxios.get('/api/rutinas/verify', {
          params: { fecha: debouncedFecha }
        });
        
        if (response.data.exists) {
          setFechaError(`Ya existe una rutina para esta fecha`);
        } else {
          setFechaError('');
        }
      } catch (error) {
        console.error('Error al verificar fecha:', error);
      } finally {
        setIsValidating(false);
      }
    };
    
    validateDate();
  }, [debouncedFecha, initialData]);

  const handleDateChange = (newDate) => {
    setFormData(prev => ({
      ...prev,
      fecha: newDate.toISOString().split('T')[0]
    }));
  };

  const handleSectionChange = (section, newData) => {
    setRutinaData(prev => ({
      ...prev,
      [section]: newData
    }));
  };

  const handleConfigChange = (section, itemId, newConfig) => {
    console.log(`[RutinaForm] Actualización de configuración de ${section}.${itemId}`, newConfig);
    
    // Actualizar la configuración en el estado local
    setRutinaData(prev => {
      // Crear una copia profunda para evitar mutar el state original
      const updatedConfig = JSON.parse(JSON.stringify(prev.config || {}));
      
      // Asegurar que la sección existe
      if (!updatedConfig[section]) {
        updatedConfig[section] = {};
      }
      
      // Establecer la nueva configuración
      updatedConfig[section][itemId] = newConfig;
      
      console.log(`[RutinaForm] Nueva configuración para ${section}.${itemId}:`, 
                 JSON.stringify(newConfig, null, 2));
      
      // Retornar un nuevo objeto state con un timestamp para forzar re-renderizado
      return {
        ...prev,
        config: updatedConfig,
        _updated: new Date().getTime() // Timestamp para forzar actualización de la UI
      };
    });
    
    // Guardado automático tras un breve retraso
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }
    
    autoSaveTimeout.current = setTimeout(() => {
      console.log('[RutinaForm] Auto-guardando cambios de configuración...');
      handleSave();
    }, 500);
  };

  // Inicializar configuración por defecto para un elemento si no existe
  const getDefaultItemConfig = () => ({
    tipo: 'DIARIO',
    frecuencia: 1,
    periodo: 'CADA_DIA',
    diasSemana: [],
    diasMes: [],
    activo: true
  });

  const initializeDefaultConfig = () => {
    // Crear una estructura de configuración completa para todas las secciones
    const configCompleta = {
      bodyCare: {},
      nutricion: {},
      ejercicio: {},
      cleaning: {}
    };

    // Para cada sección, inicializar todos los elementos posibles con configuración por defecto
    Object.keys(iconConfig).forEach(section => {
      Object.keys(iconConfig[section]).forEach(item => {
        configCompleta[section][item] = getDefaultItemConfig();
      });
    });

    return configCompleta;
  };

  // Asegurar que rutinaData tiene una configuración completa al inicializarse
  useEffect(() => {
    if (!initialData) {
      // Si es una nueva rutina, inicializar con configuración completa
      const configPorDefecto = initializeDefaultConfig();
      
      setRutinaData(prev => ({
        ...prev,
        config: configPorDefecto
      }));
      
      console.log('[RutinaForm] Configuración por defecto inicializada para nueva rutina');
    }
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (submitInProgress.current) {
      console.log('[RutinaForm] Envío ya en progreso, ignorando petición duplicada');
      return;
    }
    
    if (fechaError) {
      enqueueSnackbar('Por favor selecciona una fecha válida', { variant: 'error' });
      return;
    }
    
    submitInProgress.current = true;
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Normalizar fecha utilizando la función formatDate para asegurar coherencia
      const fechaISO = formatDate(formData.fecha);
      
      console.log(`[RutinaForm] Preparando datos para guardar rutina con fecha normalizada: ${fechaISO}`);
      
      // Crear objeto básico con datos mínimos necesarios
      const rutinaToSubmit = {
        fecha: fechaISO,
        useGlobalConfig: true
      };
      
      // Crear solo la configuración base sin objetos complejos que puedan causar problemas
      if (rutinaData.config) {
        rutinaToSubmit.config = {
          bodyCare: {},
          nutricion: {},
          ejercicio: {},
          cleaning: {}
        };
        
        // Procesar cada sección manualmente para evitar referencias a objetos complejos
        ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'].forEach(section => {
          if (rutinaData.config[section]) {
            Object.keys(rutinaData.config[section]).forEach(itemId => {
              const itemConfig = rutinaData.config[section][itemId];
              
              // Verificar que sea un objeto válido y crear un objeto limpio con solo datos primitivos
              if (itemConfig && typeof itemConfig === 'object') {
                rutinaToSubmit.config[section][itemId] = {
                  tipo: String(itemConfig.tipo || 'DIARIO').toUpperCase(),
                  frecuencia: Number(itemConfig.frecuencia || 1),
                  periodo: String(itemConfig.periodo || 'CADA_DIA'),
                  diasSemana: Array.isArray(itemConfig.diasSemana) ? [...itemConfig.diasSemana] : [],
                  diasMes: Array.isArray(itemConfig.diasMes) ? [...itemConfig.diasMes] : [],
                  activo: Boolean(itemConfig.activo !== false)
                };
                
                // Eliminar cualquier campo que no sea parte del esquema esperado
                const cleanConfig = rutinaToSubmit.config[section][itemId];
                Object.keys(cleanConfig).forEach(key => {
                  // Si hay algún objeto anidado inesperado, convertirlo a string
                  if (typeof cleanConfig[key] === 'object' && !Array.isArray(cleanConfig[key])) {
                    delete cleanConfig[key];
                  }
                });
              }
            });
          }
        });
      }
      
      if (isEditing && initialData?._id) {
        rutinaToSubmit._id = initialData._id;
      }
      
      console.log(`[RutinaForm] Enviando petición ${isEditing ? 'PUT' : 'POST'} para rutina:`);
      console.log(JSON.stringify(rutinaToSubmit, null, 2));
      
      // Crear o actualizar la rutina
      let response;
      try {
        if (isEditing && initialData?._id) {
          response = await clienteAxios.put(`/api/rutinas/${initialData._id}`, rutinaToSubmit);
          console.log('[RutinaForm] Respuesta exitosa al actualizar rutina:', response.status, response.statusText);
          enqueueSnackbar('Rutina actualizada con éxito', { variant: 'success' });
        } else {
          console.log('[RutinaForm] Enviando petición de creación a /api/rutinas');
          response = await clienteAxios.post('/api/rutinas', rutinaToSubmit);
          console.log('[RutinaForm] Respuesta exitosa al crear rutina:', response.status, response.statusText);
          enqueueSnackbar('Rutina creada con éxito', { variant: 'success' });
          
          // Redireccionar a la página de la nueva rutina
          setTimeout(() => {
            console.log('[RutinaForm] Redireccionando a la rutina recién creada:', response.data._id);
            navigate(`/rutinas/${response.data._id}`);
          }, 500);
        }
        
        // Disparar evento para actualizar la lista
        window.dispatchEvent(new CustomEvent('rutina-updated', { 
          detail: { 
            rutina: response.data,
            action: isEditing ? 'update' : 'create'
          } 
        }));
        
        // Cerrar el formulario
        onClose();
      } catch (httpError) {
        console.error('[RutinaForm] Error HTTP al guardar rutina:', {
          status: httpError.response?.status,
          statusText: httpError.response?.statusText,
          data: httpError.response?.data,
          message: httpError.message
        });
        
        let errorMsg = 'Error al guardar la rutina';
        
        if (httpError.response?.status === 409) {
          errorMsg = 'Ya existe una rutina para esta fecha';
        } else if (httpError.response?.data?.error) {
          errorMsg = httpError.response.data.error;
        }
        
        setError(errorMsg);
        enqueueSnackbar(errorMsg, { variant: 'error' });
        throw httpError; // Relanzar para manejo adicional si es necesario
      }
      
    } catch (error) {
      console.error('[RutinaForm] Error general al guardar la rutina:', error);
      const errorMsg = error.message || 'Error al guardar rutina';
      
      if (!error.response) { // Si no es un error HTTP que ya fue manejado
        setError(errorMsg);
        enqueueSnackbar(errorMsg, { variant: 'error' });
      }
    } finally {
      setIsSubmitting(false);
      submitInProgress.current = false;
    }
  };

  const [preferencesDialogOpen, setPreferencesDialogOpen] = useState(false);

  const handleOpenPreferencesDialog = () => {
    setPreferencesDialogOpen(true);
  };

  const handleClosePreferencesDialog = () => {
    setPreferencesDialogOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose || (() => {})}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 0,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          p: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventIcon />
          <Typography variant="h6">
            {isEditing ? 'Editar Rutina' : 'Nueva Rutina'}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DateRangeIcon fontSize="small" />
                  Fecha
                </Typography>
                
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <StaticDatePicker
                    displayStaticWrapperAs="desktop"
                    value={formData.fecha ? new Date(formData.fecha) : null}
                    onChange={handleDateChange}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    maxDate={new Date(new Date().setMonth(new Date().getMonth() + 12))}
                    minDate={new Date(new Date().setMonth(new Date().getMonth() - 12))}
                  />
                </LocalizationProvider>
                
                {fechaError && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    {fechaError}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={7}>
            <Typography variant="h6" gutterBottom>
              Configuración de la rutina
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <ChecklistSection
                  title="Cuidado Personal"
                  section="bodyCare"
                  data={rutinaData.bodyCare}
                  config={rutinaData.config?.bodyCare}
                  onChange={(newData) => handleSectionChange('bodyCare', newData)}
                  onConfigChange={(itemId, newConfig) => handleConfigChange('bodyCare', itemId, newConfig)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ChecklistSection
                  title="Nutrición"
                  section="nutricion"
                  data={rutinaData.nutricion}
                  config={rutinaData.config?.nutricion}
                  onChange={(newData) => handleSectionChange('nutricion', newData)}
                  onConfigChange={(itemId, newConfig) => handleConfigChange('nutricion', itemId, newConfig)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ChecklistSection
                  title="Ejercicio"
                  section="ejercicio"
                  data={rutinaData.ejercicio}
                  config={rutinaData.config?.ejercicio}
                  onChange={(newData) => handleSectionChange('ejercicio', newData)}
                  onConfigChange={(itemId, newConfig) => handleConfigChange('ejercicio', itemId, newConfig)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ChecklistSection
                  title="Limpieza"
                  section="cleaning"
                  data={rutinaData.cleaning}
                  config={rutinaData.config?.cleaning}
                  onChange={(newData) => handleSectionChange('cleaning', newData)}
                  onConfigChange={(itemId, newConfig) => handleConfigChange('cleaning', itemId, newConfig)}
                />
              </Grid>
            </Grid>
            
            {isEditing && (
              <Box sx={{ mt: 3, mb: 1, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<SyncIcon />}
                  onClick={() => {
                    syncRutinaWithGlobal(initialData._id)
                      .then(response => {
                        enqueueSnackbar("Configuración sincronizada con éxito", { variant: "success" });
                        // Actualizar la rutina con la nueva configuración
                        setRutinaData(prev => ({
                          ...prev,
                          config: response.config
                        }));
                      })
                      .catch(err => {
                        console.error("Error al sincronizar:", err);
                        enqueueSnackbar("Error al sincronizar configuración", { variant: "error" });
                      });
                  }}
                >
                  Sincronizar desde global
                </Button>
                
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<PublishIcon />}
                  onClick={() => {
                    updateGlobalFromRutina(initialData._id)
                      .then(() => {
                        enqueueSnackbar("Configuración global actualizada con éxito", { variant: "success" });
                      })
                      .catch(err => {
                        console.error("Error al actualizar global:", err);
                        enqueueSnackbar("Error al actualizar configuración global", { variant: "error" });
                      });
                  }}
                >
                  Guardar como global
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, bgcolor: 'background.paper' }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={isSubmitting || isValidating || !!fechaError}
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          ref={submitButtonRef}
        >
          {isEditing ? 'Guardar Cambios' : 'Crear Rutina'}
        </Button>
      </DialogActions>

      {/* Botón de configuración de preferencias */}
      <Tooltip title="Configurar preferencias de hábitos" arrow>
        <Fab
          color="primary"
          size="small"
          onClick={handleOpenPreferencesDialog}
          sx={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 1000
          }}
        >
          <TuneIcon />
        </Fab>
      </Tooltip>

      {/* Diálogo de preferencias de usuario */}
      <UserHabitsPreferences 
        open={preferencesDialogOpen}
        onClose={handleClosePreferencesDialog}
      />
    </Dialog>
  );
}; 