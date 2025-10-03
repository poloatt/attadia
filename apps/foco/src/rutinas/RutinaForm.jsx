import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Grid,
  Chip,
  Divider,
  Card,
  CardContent,
  TextField
} from '@mui/material';
import { useResponsive } from '@shared/hooks';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import SaveIcon from '@mui/icons-material/Save';
import clienteAxios from '@shared/config/axios';
import { snackbar } from '@shared/components/common';
import { useDebounce } from '@shared/hooks';
import { formatDate, iconConfig } from '@shared/utils';
import { useRutinasCRUD } from '@shared/hooks';
import { useAuth } from '@shared/context';
import RutinaCard from './RutinaCard';
import { CommonDate } from '@shared/components/common';
import { formatDateForAPI, getNormalizedToday, parseAPIDate } from '@shared/utils';
import rutinasService from '@shared/services';
import { useRutinas } from '@shared/context';

export const RutinaForm = ({ open = true, onClose, initialData, isEditing }) => {
  const { isMobile, theme } = useResponsive();
  const fullScreen = isMobile;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  // Usar snackbar unificado
  const { user } = useAuth();
  const { syncRutinaWithGlobal, updateGlobalFromRutina } = useRutinasCRUD();
  const navigate = useNavigate();
  const { rutina: rutinaActual } = useRutinas();
  
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

  // Cambiar la inicialización de formData para que fecha sea string YYYY-MM-DD sin desfases de timezone
  const [formData, setFormData] = useState(() => {
    let initialDate;
    if (initialData?.fecha) {
      // Interpretar siempre como día (sin arrastre de timezone)
      const parsed = parseAPIDate(initialData.fecha);
      initialDate = formatDateForAPI(parsed);
    } else {
      // Usar la fecha de hoy normalizada y formateada
      initialDate = formatDateForAPI(getNormalizedToday());
    }
    return {
      fecha: initialDate, // Guardar como string YYYY-MM-DD
      useGlobalConfig: true
    };
  });

  // Cargar datos de la rutina cuando se reciben como prop
  useEffect(() => {
    if (initialData) {
      setRutinaData(initialData);
      // Usar la fecha como string YYYY-MM-DD sin desfases
      const parsedDate = parseAPIDate(initialData.fecha);
      setFormData(prev => ({
        ...prev,
        fecha: parsedDate ? formatDateForAPI(parsedDate) : formatDateForAPI(getNormalizedToday())
      }));
    }
  }, [initialData]);

  // handleDateChange simplificado
  const handleDateChange = (newDate) => {
    if (!newDate || isNaN(newDate.getTime())) return;
    const fechaString = formatDateForAPI(newDate);
    setFormData(prev => ({
      ...prev,
      fecha: fechaString
    }));
  };

  const handleSectionChange = (section, newData) => {
    setRutinaData(prev => ({
      ...prev,
      [section]: newData
    }));
  };

  const handleConfigChange = (section, itemId, newConfig) => {
    // Actualizar la configuración en el estado local
    setRutinaData(prev => {
      const updatedConfig = { ...prev.config };
      
      // Asegurar que la sección existe
      if (!updatedConfig[section]) {
        updatedConfig[section] = {};
      }
      
      // Establecer la nueva configuración
      updatedConfig[section][itemId] = newConfig;
      
      return {
        ...prev,
        config: updatedConfig
      };
    });
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

  // Crear secciones por defecto con todos los ítems en false
  const createDefaultSections = () => {
    const defaultSections = {};
    Object.keys(iconConfig).forEach(section => {
      defaultSections[section] = {};
      Object.keys(iconConfig[section]).forEach(item => {
        defaultSections[section][item] = false;
      });
    });
    return defaultSections;
  };

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

  // Normalizar configuración completa (todas las secciones/ítems)
  const normalizeFullConfig = (config) => {
    if (!config || typeof config !== 'object') return {};
    const sections = ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'];
    const normalized = {};
    sections.forEach(section => {
      const secCfg = config[section] || {};
      normalized[section] = {};
      Object.entries(secCfg).forEach(([itemId, cfg]) => {
        if (!cfg) return;
        normalized[section][itemId] = {
          tipo: (cfg.tipo || 'DIARIO').toUpperCase(),
          frecuencia: Number(cfg.frecuencia || 1),
          periodo: cfg.periodo || 'CADA_DIA',
          activo: cfg.activo !== false
        };
      });
    });
    return normalized;
  };

  // Asegurar que rutinaData tiene una configuración completa al inicializarse
  useEffect(() => {
    if (!initialData) {
      // Si es una nueva rutina, inicializar con configuración por defecto y luego
      // sobrescribir con la última preferencia global si existe
      const configPorDefecto = initializeDefaultConfig();
      const seccionesPorDefecto = createDefaultSections();

      setRutinaData(prev => ({
        ...prev,
        ...seccionesPorDefecto,
        config: configPorDefecto
      }));

      (async () => {
        try {
          const res = await rutinasService.getUserHabitPreferences();
          const prefs = res?.preferences || {};

          const hasPrefs = prefs && Object.keys(prefs).length > 0;
          // Fallback 1: si no hay prefs del servicio, intentar con la rutina actual abierta
          const fallbackFromCurrent = !hasPrefs && rutinaActual?.config ? rutinaActual.config : null;

          const source = hasPrefs ? prefs : (fallbackFromCurrent || {});

          if (Object.keys(source).length > 0) {
            // Merge seguro: normalizar tipos y completar campos mínimos
            const merged = JSON.parse(JSON.stringify(configPorDefecto));
            const sections = ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'];

            sections.forEach(section => {
              if (!merged[section]) merged[section] = {};
              if (source[section]) {
                Object.entries(source[section]).forEach(([itemId, cfg]) => {
                  const norm = {
                    tipo: (cfg?.tipo || 'DIARIO').toUpperCase(),
                    frecuencia: Number(cfg?.frecuencia || 1),
                    periodo: cfg?.periodo || 'CADA_DIA',
                    activo: cfg?.activo !== false
                  };
                  merged[section][itemId] = norm;
                });
              }
            });

            setRutinaData(prev => ({
              ...prev,
              ...seccionesPorDefecto,
              config: merged
            }));
            console.log('[RutinaForm] Configuración aplicada desde', hasPrefs ? 'preferencias de usuario' : 'rutina actual');
          }
        } catch (e) {
          console.warn('[RutinaForm] No se pudieron cargar preferencias globales, usando valores por defecto');
        }
      })();
    }
  }, [initialData, rutinaActual]);

  // Función para auto-guardado simplificada
  const handleAutoSave = async () => {
    // Solo auto-guardar si estamos editando una rutina existente
    if (!isEditing || !initialData?._id) {
      return;
    }
    
    try {
      const rutinaToSubmit = {
        fecha: formData.fecha,
        useGlobalConfig: true,
        config: rutinaData.config
      };
      
      await clienteAxios.put(`/api/rutinas/${initialData._id}`, rutinaToSubmit);
      
    } catch (error) {
      console.error('[RutinaForm] Error en auto-save:', error);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (isSubmitting) {
      return;
    }
    
    // Validación básica de fecha
    if (!formData.fecha) {
      snackbar.error('Por favor selecciona una fecha');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      let response;
      if (isEditing && initialData?._id) {
        // En edición, enviar configuración para persistir cambios
        const rutinaToSubmit = {
          fecha: formData.fecha,
          useGlobalConfig: true,
          config: rutinaData.config
        };
        response = await clienteAxios.put(`/api/rutinas/${initialData._id}`, rutinaToSubmit);
        snackbar.success('Rutina actualizada con éxito');
        // Notificar al contexto para recargar la rutina actualizada
        try {
          const updatedRutina = response?.data;
          if (updatedRutina && updatedRutina._id) {
            window.dispatchEvent(new CustomEvent('rutina-updated', {
              detail: { rutina: updatedRutina, action: 'update' }
            }));
          }
        } catch {}
        onClose();
      } else {
        // En creación: enviar config completa en una sola llamada
        const rutinaToCreate = {
          fecha: formData.fecha,
          useGlobalConfig: true,
          config: normalizeFullConfig(rutinaData.config)  // Config incluida en creación
        };
        response = await clienteAxios.post('/api/rutinas', rutinaToCreate);
        const createdRutina = response.data;

        if (createdRutina?._id) {
          snackbar.success('Rutina creada con éxito');
          // Notificar al contexto con actualización optimista
          try {
            window.dispatchEvent(new CustomEvent('rutina-updated', {
              detail: { rutina: createdRutina, action: 'create' }
            }));
          } catch {}
          onClose();
          navigate('/tiempo/rutinas');
        }
      }
      
    } catch (error) {
      let errorMsg = 'Error al guardar la rutina';
      
      if (error.response?.status === 409) {
        errorMsg = 'Ya existe una rutina para esta fecha';
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      }
      
      setError(errorMsg);
      snackbar.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose || (() => {})}
      fullScreen={fullScreen}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 0,
          maxHeight: '90vh',
          width: '100%',
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
            {/* <EventIcon sx={{ fontSize: 24, color: 'primary.main' }} /> */}
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
              
                             <CommonDate
                 label="Selecciona una fecha"
                 value={formData.fecha}
                 onChange={handleDateChange}
               />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={7}>
            <Typography variant="body1" gutterBottom fontWeight={500}>
              Configuración de la rutina
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <RutinaCard
                  title="Cuidado Personal"
                  section="bodyCare"
                  data={rutinaData.bodyCare}
                  config={rutinaData.config?.bodyCare}
                  onChange={(newData) => handleSectionChange('bodyCare', newData)}
                  onConfigChange={(itemId, newConfig) => handleConfigChange('bodyCare', itemId, newConfig)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <RutinaCard
                  title="Nutrición"
                  section="nutricion"
                  data={rutinaData.nutricion}
                  config={rutinaData.config?.nutricion}
                  onChange={(newData) => handleSectionChange('nutricion', newData)}
                  onConfigChange={(itemId, newConfig) => handleConfigChange('nutricion', itemId, newConfig)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <RutinaCard
                  title="Ejercicio"
                  section="ejercicio"
                  data={rutinaData.ejercicio}
                  config={rutinaData.config?.ejercicio}
                  onChange={(newData) => handleSectionChange('ejercicio', newData)}
                  onConfigChange={(itemId, newConfig) => handleConfigChange('ejercicio', itemId, newConfig)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <RutinaCard
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
                        snackbar.success("Configuración sincronizada con éxito");
                        // Actualizar la rutina con la nueva configuración
                        setRutinaData(prev => ({
                          ...prev,
                          config: response.config
                        }));
                      })
                      .catch(err => {
                        console.error("Error al sincronizar:", err);
                        snackbar.error("Error al sincronizar configuración");
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
                        snackbar.success("Configuración global actualizada con éxito");
                      })
                      .catch(err => {
                        console.error("Error al actualizar global:", err);
                        snackbar.error("Error al actualizar configuración global");
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
                     disabled={isSubmitting}
                     startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon sx={{ fontSize: 20 }} />}
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