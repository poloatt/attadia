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
  Card,
  CardContent
} from '@mui/material';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import CloseIcon from '@mui/icons-material/Close';
import DateRangeIcon from '@mui/icons-material/DateRange';
import EventIcon from '@mui/icons-material/Event';
import SaveIcon from '@mui/icons-material/Save';
import clienteAxios from '../../config/axios';
import { useSnackbar } from 'notistack';
import { useDebounce } from './utils/hooks';
import { defaultFormData, formatDate } from './utils/iconConfig';
import { useNavigate } from 'react-router-dom';
import TextField from "@mui/material/TextField";

export const RutinaForm = ({ open = true, onClose, initialData, isEditing }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [fechaError, setFechaError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const submitButtonRef = useRef(null);
  const submitInProgress = useRef(false);
  const navigate = useNavigate();
  
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
    
    try {
      // Normalizar fecha utilizando la función formatDate para asegurar coherencia
      const fechaISO = formatDate(formData.fecha);
      
      console.log(`[RutinaForm] Preparando datos para guardar rutina con fecha normalizada: ${fechaISO}`);
      
      // Crear objeto básico con datos mínimos necesarios
      const rutinaToSubmit = {
        fecha: fechaISO,
        useGlobalConfig: true
      };
      
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
        
        enqueueSnackbar(errorMsg, { variant: 'error' });
      }
      
    } catch (error) {
      console.error('[RutinaForm] Error general al guardar la rutina:', error);
      enqueueSnackbar(error.message || 'Error al guardar rutina', { variant: 'error' });
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
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DateRangeIcon fontSize="small" />
              Selecciona una fecha
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
    </Dialog>
  );
}; 