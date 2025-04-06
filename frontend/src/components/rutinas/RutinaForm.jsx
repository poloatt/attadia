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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import DateRangeIcon from '@mui/icons-material/DateRange';
import EventIcon from '@mui/icons-material/Event';
import SettingsIcon from '@mui/icons-material/Settings';
import clienteAxios from '../../config/axios';
import useCustomSnackbar from '../common/CustomSnackbar.jsx';
import { useDebounce } from './utils/hooks';
import { defaultFormData, formatDate, iconConfig } from './utils/iconConfig';
import { useNavigate, useParams } from 'react-router-dom';
import { useRutinasCRUD } from '../../hooks/useRutinasCRUD';
import { useAuth } from '../../hooks/useAuth';
import ChecklistSection from './ChecklistSection';
import TextField from "@mui/material/TextField";
import SaveIcon from '@mui/icons-material/Save';

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
  const { enqueueSnackbar } = useCustomSnackbar();
  const { user } = useAuth();
  const submitButtonRef = useRef(null);
  const submitInProgress = useRef(false);
  const { syncRutinaWithGlobal, updateGlobalFromRutina } = useRutinasCRUD();
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
    // Si estamos editando, usar la fecha de la rutina existente
    if (initialData && initialData.fecha) {
      return {
        fecha: new Date(initialData.fecha).toISOString().split('T')[0],
        useGlobalConfig: true
      };
    }
    
    // Si no, siempre usar la fecha actual (hoy) usando la hora local
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    return { 
      fecha: `${year}-${month}-${day}`,
      useGlobalConfig: true
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
    if (!newDate) return;
    
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const day = String(newDate.getDate()).padStart(2, '0');
    
    setFormData(prev => ({
      ...prev,
      fecha: `${year}-${month}-${day}`
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
          
          // Disparar evento para actualizar la lista
          window.dispatchEvent(new CustomEvent('rutina-updated', { 
            detail: { 
              rutina: response.data,
              action: 'update'
            } 
          }));
          
          // Cerrar el formulario
          onClose();
        } else {
          console.log('[RutinaForm] Enviando petición de creación a /api/rutinas');
          response = await clienteAxios.post('/api/rutinas', rutinaToSubmit);
          console.log('[RutinaForm] Respuesta exitosa al crear rutina:', response.status, response.statusText);
          console.log('[RutinaForm] Datos de respuesta:', response.data);
          
          // Asegurar que tenemos un ID válido
          const rutinaId = response.data?._id;
          
          if (!rutinaId) {
            console.error('[RutinaForm] No se pudo obtener un ID válido de la rutina creada:', response.data);
            enqueueSnackbar('Rutina creada, pero hubo un problema al redirigir', { variant: 'warning' });
            onClose();
            return;
          }
          
          enqueueSnackbar('Rutina creada con éxito', { variant: 'success' });
          
          // Disparar evento para actualizar la lista
          window.dispatchEvent(new CustomEvent('rutina-updated', { 
            detail: { 
              rutina: response.data,
              action: 'create'
            } 
          }));
          
          // Cerrar el formulario y luego redireccionar
          onClose();
          
          // Esperar un breve momento para asegurar que el cierre del formulario se complete
          setTimeout(() => {
            console.log('[RutinaForm] Redireccionando a la rutina recién creada:', rutinaId);
            navigate(`/rutinas/${rutinaId}`);
          }, 50);
        }
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
          p: 1.5,
          bgcolor: theme.palette.background.default,
          color: 'text.primary',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'action.selected',
            borderRadius: '50%',
            width: 38,
            height: 38,
          }}>
            <EventIcon sx={{ fontSize: 24, color: 'primary.main' }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            {isEditing ? 'Editar Rutina' : 'Nueva Rutina'}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ 
            color: 'text.secondary',
            '&:hover': { 
              color: 'text.primary',
              bgcolor: 'action.hover',
            },
            borderRadius: '50%',
          }}
        >
          <CloseIcon sx={{ fontSize: 21.6 }} />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 3, bgcolor: theme.palette.background.default }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" gutterBottom fontWeight={500}>
                Fecha
              </Typography>
              
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Selecciona una fecha"
                  value={formData.fecha ? new Date(formData.fecha) : new Date()}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  disablePast={false}
                  maxDate={new Date(new Date().setMonth(new Date().getMonth() + 6))}
                  minDate={new Date(new Date().setMonth(new Date().getMonth() - 6))}
                  inputFormat="dd/MM/yyyy"
                  views={['day', 'month', 'year']}
                  showToolbar={false}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 0,
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                        borderWidth: 1
                      }
                    }
                  }}
                />
              </LocalizationProvider>
              
              {fechaError && (
                <Alert 
                  severity="warning" 
                  sx={{ 
                    mt: 2, 
                    borderRadius: 0,
                    bgcolor: 'warning.light', 
                    color: 'warning.dark'
                  }}
                >
                  {fechaError}
                </Alert>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={7}>
            <Typography variant="body1" gutterBottom fontWeight={500}>
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
                  sx={{ 
                    borderRadius: 19.2, 
                    textTransform: 'none',
                    borderColor: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      bgcolor: 'action.hover',
                    }
                  }}
                >
                  Sincronizar desde global
                </Button>
                
                <Button
                  variant="outlined"
                  color="primary"
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
                  sx={{ 
                    borderRadius: 19.2, 
                    textTransform: 'none',
                    borderColor: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      bgcolor: 'action.hover',
                    }
                  }}
                >
                  Guardar como global
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, bgcolor: theme.palette.background.default, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button 
          onClick={onClose} 
          color="inherit"
          sx={{ 
            borderRadius: 19.2, 
            textTransform: 'none',
            color: 'text.secondary',
            '&:hover': {
              bgcolor: 'action.hover',
            }
          }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="outlined"
          disabled={isSubmitting || isValidating || !!fechaError}
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon sx={{ fontSize: 20 }} />}
          ref={submitButtonRef}
          sx={{ 
            borderRadius: 19.2, 
            textTransform: 'none',
            borderColor: 'primary.main',
            '&:hover': {
              borderColor: 'primary.dark',
              bgcolor: 'action.hover',
            }
          }}
        >
          {isEditing ? 'Guardar Cambios' : 'Crear Rutina'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 