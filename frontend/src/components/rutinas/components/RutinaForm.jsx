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
  IconButton,
  Grid
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import SaveIcon from '@mui/icons-material/Save';
import clienteAxios from '../../config/axios';
import { snackbar } from '../../common';
import { useDebounce } from './utils/hooks';
import { useNavigate } from 'react-router-dom';
import TextField from "@mui/material/TextField";

export const RutinaForm = ({ open = true, onClose, initialData, isEditing }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [fechaError, setFechaError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Usar snackbar unificado
  const submitButtonRef = useRef(null);
  const submitInProgress = useRef(false);
  const navigate = useNavigate();
  
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
    if (!newDate) return; // Evitar fechas nulas
    
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const day = String(newDate.getDate()).padStart(2, '0');
    
    setFormData(prev => ({
      ...prev,
      fecha: `${year}-${month}-${day}`
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (submitInProgress.current) {
      console.log('[RutinaForm] Envío ya en progreso, ignorando petición duplicada');
      return;
    }
    
    if (fechaError) {
              snackbar.error('Por favor selecciona una fecha válida');
      return;
    }
    
    submitInProgress.current = true;
    setIsSubmitting(true);
    
    try {
      // Crear objeto básico con datos mínimos necesarios
      const rutinaToSubmit = {
        fecha: formData.fecha,
        useGlobalConfig: true
      };
      
      // Crear o actualizar la rutina
      let response;
      try {
        if (isEditing && initialData?._id) {
          response = await clienteAxios.put(`/api/rutinas/${initialData._id}`, rutinaToSubmit);
          console.log('[RutinaForm] Respuesta exitosa al actualizar rutina:', response.status, response.statusText);
          snackbar.success('Rutina actualizada con éxito');
          
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
          console.log('[RutinaForm] Datos de respuesta:', JSON.stringify(response.data, null, 2));
          
          // Obtener el ID de la rutina
          let rutinaId = response.data._id || response.data.id;
          
          if (!rutinaId && response.data && typeof response.data === 'object') {
            // Buscar el ID en propiedades anidadas si no se encuentra directamente
            for (const [key, value] of Object.entries(response.data)) {
              if ((key === '_id' || key === 'id') && value) {
                rutinaId = value;
                break;
              } else if (value && typeof value === 'object') {
                const nestedId = value._id || value.id;
                if (nestedId) {
                  rutinaId = nestedId;
                  break;
                }
              }
            }
          }
          
          if (!rutinaId) {
            console.error('[RutinaForm] No se pudo obtener un ID válido de la rutina creada:', response.data);
            snackbar.warning('Rutina creada, pero hubo un problema al redirigir');
            onClose();
            return;
          }
          
                      snackbar.success('Rutina creada con éxito');
          
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
            console.log('[RutinaForm] Redireccionando a la lista de rutinas');
            navigate('/salud/rutinas');
          }, 100);
        }
      } catch (httpError) {
        console.error('[RutinaForm] Error HTTP al guardar rutina:', httpError);
        let errorMsg = 'Error al guardar la rutina';
        
        if (httpError.response?.status === 409) {
          errorMsg = 'Ya existe una rutina para esta fecha';
        } else if (httpError.response?.data?.error) {
          errorMsg = httpError.response.data.error;
        }
        
        snackbar.error(errorMsg);
      }
      
    } catch (error) {
      console.error('[RutinaForm] Error general al guardar la rutina:', error);
              snackbar.error(error.message || 'Error al guardar rutina');
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
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 0,
          maxHeight: '90vh',
          bgcolor: theme.palette.background.default
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
      
      <DialogContent dividers sx={{ pt: 3, px: 3, pb: 1, bgcolor: theme.palette.background.default }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom fontWeight={500}>
            Selecciona una fecha
          </Typography>
          
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DatePicker
              label="Fecha"
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