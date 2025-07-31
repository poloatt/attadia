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
import useResponsive from '../../hooks/useResponsive';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import SaveIcon from '@mui/icons-material/Save';
import clienteAxios from '../../config/axios';
import { snackbar } from '../common';
import { useDebounce } from '../../hooks';
import { formatDate, iconConfig } from '../../utils/iconConfig';
import { useRutinasCRUD } from '../../hooks/useRutinasCRUD';
import { useAuth } from '../../context/AuthContext';
import RutinaCard from './RutinaCard';
import { CommonDate } from '../common/CommonDate';
import { formatDateForAPI, getNormalizedToday, parseAPIDate } from '../../utils/dateUtils';

export const RutinaForm = ({ open = true, onClose, initialData, isEditing }) => {
  const { isMobile, theme } = useResponsive();
  const fullScreen = isMobile;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  // Usar snackbar unificado
  const { user } = useAuth();
  const { syncRutinaWithGlobal, updateGlobalFromRutina } = useRutinasCRUD();
  const navigate = useNavigate();
  
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

  // Cambiar la inicialización de formData para que fecha sea string YYYY-MM-DD
  const [formData, setFormData] = useState(() => {
    let initialDate;
    if (initialData?.fecha) {
      // Si hay fecha inicial, usarla como string
      initialDate = typeof initialData.fecha === 'string' ? initialData.fecha : formatDate(initialData.fecha);
    } else {
      // Usar la fecha de hoy como string
      initialDate = formatDate(getNormalizedToday());
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
      // Usar la fecha como string YYYY-MM-DD
      const parsedDate = typeof initialData.fecha === 'string' ? new Date(initialData.fecha) : initialData.fecha;
      setFormData(prev => ({
        ...prev,
        fecha: parsedDate ? formatDate(parsedDate) : formatDate(getNormalizedToday())
      }));
    }
  }, [initialData]);

  // handleDateChange simplificado
  const handleDateChange = (newDate) => {
    if (!newDate || isNaN(newDate.getTime())) return;
    const fechaString = formatDate(newDate);
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
      const rutinaToSubmit = {
        fecha: formData.fecha,
        useGlobalConfig: true,
        config: rutinaData.config
      };
      
      let response;
      if (isEditing && initialData?._id) {
        response = await clienteAxios.put(`/api/rutinas/${initialData._id}`, rutinaToSubmit);
        snackbar.success('Rutina actualizada con éxito');
        onClose();
      } else {
        response = await clienteAxios.post('/api/rutinas', rutinaToSubmit);
        snackbar.success('Rutina creada con éxito');
        
        const rutinaId = response.data?._id;
        if (rutinaId) {
          onClose();
          setTimeout(() => {
            navigate(`/rutinas/${rutinaId}`);
          }, 50);
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