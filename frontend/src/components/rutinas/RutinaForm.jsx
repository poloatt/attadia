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
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import clienteAxios from '../../config/axios';
import { useSnackbar } from 'notistack';
import { useDebounce } from './utils/hooks';
import { defaultFormData } from './utils/iconConfig';

export const RutinaForm = ({ 
  open, 
  onClose, 
  onSubmit, 
  initialData 
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [fechaError, setFechaError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [disabledDates, setDisabledDates] = useState([]);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const submitButtonRef = useRef(null);
  const submitInProgress = useRef(false);
  const { enqueueSnackbar } = useSnackbar();

  const [formData, setFormData] = useState(() => {
    if (!initialData) return { fecha: defaultFormData.fecha };
    
    return {
      fecha: initialData.fecha ? new Date(initialData.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    };
  });

  // Usar debounce para la validación de fechas
  const debouncedFecha = useDebounce(formData.fecha, 500);

  // Cargar las fechas con rutinas existentes cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      fetchDisabledDates();
      setFechaError('');
      setIsSubmitting(false);
      submitInProgress.current = false;
      if (!initialData) {
        setFormData({ fecha: defaultFormData.fecha });
      } else {
        setFormData({
          fecha: initialData.fecha ? new Date(initialData.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        });
      }
    }
  }, [open, initialData]);

  // Función para obtener fechas bloqueadas
  const fetchDisabledDates = async () => {
    try {
      setIsLoadingDates(true);
      console.log('Obteniendo fechas bloqueadas...');
      
      // Intentar obtener fechas desde el endpoint específico
      try {
        const response = await clienteAxios.get('/api/rutinas/fechas');
        console.log('Respuesta de fechas bloqueadas:', response.data);
        
        if (response.data && Array.isArray(response.data.fechas)) {
          // Convertir strings de fechas a objetos Date
          const dates = response.data.fechas.map(date => new Date(date));
          console.log('Fechas bloqueadas procesadas:', dates);
          
          // Si estamos editando, excluir la fecha actual de las fechas bloqueadas
          if (initialData?._id) {
            const currentDate = new Date(initialData.fecha);
            console.log('Excluyendo fecha actual:', currentDate);
            
            setDisabledDates(dates.filter(date => 
              date.getFullYear() !== currentDate.getFullYear() ||
              date.getMonth() !== currentDate.getMonth() ||
              date.getDate() !== currentDate.getDate()
            ));
          } else {
            setDisabledDates(dates);
          }
          return; // Salir de la función si todo fue exitoso
        }
      } catch (endpointError) {
        console.log('Error al obtener fechas desde endpoint específico:', endpointError);
        // Continuar con el enfoque alternativo
      }
      
      // Enfoque alternativo: obtener todas las rutinas y extraer fechas
      try {
        const response = await clienteAxios.get('/api/rutinas', {
          params: {
            limit: 100, // Obtener hasta 100 rutinas
            sort: '-fecha'
          }
        });
        
        if (response.data && Array.isArray(response.data.docs)) {
          console.log('Extrayendo fechas de rutinas:', response.data.docs.length);
          const dates = response.data.docs.map(doc => new Date(doc.fecha));
          
          // Si estamos editando, excluir la fecha actual
          if (initialData?._id) {
            const currentDate = new Date(initialData.fecha);
            setDisabledDates(dates.filter(date => 
              date.getFullYear() !== currentDate.getFullYear() ||
              date.getMonth() !== currentDate.getMonth() ||
              date.getDate() !== currentDate.getDate()
            ));
          } else {
            setDisabledDates(dates);
          }
        } else {
          console.log('No se pudieron obtener rutinas');
          setDisabledDates([]);
        }
      } catch (listError) {
        console.error('Error al obtener lista de rutinas:', listError);
        setDisabledDates([]);
      }
    } catch (error) {
      console.error('Error al cargar fechas bloqueadas:', error);
      setDisabledDates([]);
    } finally {
      setIsLoadingDates(false);
    }
  };

  // Efecto para validar la fecha cuando cambia (con debounce)
  useEffect(() => {
    if (!debouncedFecha || !open) return;
    
    // Si estamos editando una rutina existente y la fecha no cambió, no validamos
    if (initialData?._id) {
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
          setFechaError(`Ya existe una rutina para esta fecha (ID: ${response.data.rutinaId})`);
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
  }, [debouncedFecha, initialData, open]);

  const handleDateChange = (event) => {
    const newDate = event.target.value;
    setFormData(prev => ({
      ...prev,
      fecha: newDate
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Si ya hay un envío en progreso, no hacer nada
    if (submitInProgress.current) {
      console.log('Ya hay un envío en progreso, evitando duplicación');
      return;
    }
    
    // Verificar si hay errores en la fecha
    if (fechaError) {
      enqueueSnackbar('Por favor selecciona una fecha válida', { variant: 'error' });
      return;
    }
    
    // Establecer flag para evitar doble envío
    submitInProgress.current = true;
    setIsSubmitting(true);
    
    try {
      // Construir objeto de datos (sólo con la fecha)
      const dataToSubmit = initialData ? 
        { ...initialData, fecha: new Date(formData.fecha) } : 
        { 
          fecha: new Date(formData.fecha),
          bodyCare: defaultFormData.bodyCare,
          nutricion: defaultFormData.nutricion,
          ejercicio: defaultFormData.ejercicio,
          cleaning: defaultFormData.cleaning
        };
      
      console.log('Enviando datos de rutina:', dataToSubmit);
      
      // Cierre inmediato para evitar doble clic
      const localCloseFunction = onClose;
      const localSubmitFunction = onSubmit;
      
      // Enviar solicitud
      if (initialData?._id) {
        const response = await clienteAxios.put(`/api/rutinas/${initialData._id}`, dataToSubmit);
        console.log('Rutina actualizada:', response.data);
        
        // Notificar al componente padre y cerrar
        if (localCloseFunction) localCloseFunction();
        if (localSubmitFunction) localSubmitFunction(response.data);
      } else {
        const response = await clienteAxios.post('/api/rutinas', dataToSubmit);
        console.log('Rutina creada:', response.data);
        
        // Notificar al componente padre y cerrar
        if (localCloseFunction) localCloseFunction();
        if (localSubmitFunction) localSubmitFunction(response.data);
      }
    } catch (error) {
      console.error('Error en el envío de la rutina:', error);
      
      // Manejar error de conflicto (fecha duplicada)
      if (error.response?.status === 409) {
        enqueueSnackbar('Ya existe una rutina para esta fecha', { variant: 'error' });
      } else {
        enqueueSnackbar(
          error.response?.data?.error || 'Error al guardar la rutina',
          { variant: 'error' }
        );
      }
      
      // Reactivar el botón de envío tras un error
      submitInProgress.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: 0
        }
      }}
    >
      <DialogTitle>
        {initialData?._id ? 'Editar Rutina' : 'Nueva Rutina'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            type="date"
            label="Fecha"
            value={formData.fecha}
            onChange={handleDateChange}
            fullWidth
            variant="outlined"
            sx={{ mb: 1 }}
            error={!!fechaError}
            helperText={fechaError}
            InputLabelProps={{
              shrink: true
            }}
            disabled={isValidating || isSubmitting}
          />
          
          {isLoadingDates && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Cargando fechas disponibles...
              </Typography>
            </Box>
          )}
          
          {isValidating && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Verificando disponibilidad de fecha...
              </Typography>
            </Box>
          )}
          
          {fechaError && fechaError.includes('ID:') && (
            <Alert 
              severity="warning" 
              icon={<InfoIcon />}
              sx={{ mb: 2 }}
              action={
                <Button 
                  color="primary" 
                  size="small"
                  onClick={() => {
                    // Extraer el ID de la rutina existente
                    const idMatch = fechaError.match(/ID: ([a-f0-9]+)/i);
                    if (idMatch && idMatch[1]) {
                      // Cerrar este diálogo
                      onClose();
                      // Obtener la rutina existente para editar
                      clienteAxios.get(`/api/rutinas/${idMatch[1]}`)
                        .then(response => {
                          // Abrir el formulario de edición con la rutina existente
                          window.dispatchEvent(new CustomEvent('editRutina', {
                            detail: { rutina: response.data }
                          }));
                        })
                        .catch(err => {
                          console.error('Error al obtener rutina existente:', err);
                        });
                    }
                  }}
                >
                  Editar rutina existente
                </Button>
              }
            >
              Esta fecha ya tiene una rutina asociada.
            </Alert>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Selecciona una fecha para la rutina. La edición de tareas se realizará en la vista principal.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          ref={submitButtonRef}
          onClick={handleSubmit} 
          variant="contained"
          sx={{ borderRadius: 0 }}
          disabled={!!fechaError || isValidating || isSubmitting}
        >
          {isSubmitting ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={16} sx={{ mr: 1, color: 'inherit' }} />
              {initialData?._id ? 'Actualizando...' : 'Guardando...'}
            </Box>
          ) : (
            initialData?._id ? 'Actualizar' : 'Guardar'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 