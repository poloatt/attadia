import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Grid
} from '@mui/material';
import { useResponsive } from '@shared/hooks';
import CloseIcon from '@mui/icons-material/Close';
import clienteAxios from '@shared/config/axios';
import { snackbar } from '@shared/components/common';
import { CommonDate } from '@shared/components/common';
import { formatDateForAPI, getNormalizedToday, parseAPIDate } from '@shared/utils';
import { useRutinas } from '@shared/context';
import { CancelarTabButton, GuardarTabButton } from '@shared/components/common/SystemButtons';

export const RutinaForm = ({ open = true, onClose, initialData, isEditing }) => {
  const { isMobile, theme } = useResponsive();
  const fullScreen = isMobile;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { getRutinaById } = useRutinas();

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
        // Edición simple: solo fecha (la configuración se edita en la página principal)
        response = await clienteAxios.put(`/api/rutinas/${initialData._id}`, { fecha: formData.fecha });
        snackbar.success('Rutina actualizada con éxito');
        onClose();
      } else {
        // En creación: solo fecha (config se maneja en la página principal)
        response = await clienteAxios.post('/api/rutinas', { fecha: formData.fecha, useGlobalConfig: true });
        const createdRutina = response.data;

        if (createdRutina?._id) {
          snackbar.success('Rutina creada con éxito');
          onClose();
          navigate('/rutinas');
        }
      }
      
    } catch (error) {
      let errorMsg = 'Error al guardar la rutina';
      
      if (error.response?.status === 409) {
        // UX: abrir automáticamente la rutina existente
        const existingId = error.response?.data?.rutinaId;
        if (existingId) {
          try {
            await getRutinaById(existingId);
          } catch {}
          onClose();
          navigate('/rutinas');
          return;
        }
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
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          {isEditing ? 'Editar Rutina' : 'Nueva Rutina'}
        </Typography>
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
      
      <DialogContent
        sx={{
          p: { xs: 1.5, sm: 2 },
          bgcolor: theme.palette.background.default
        }}
      >
        <Grid container spacing={0}>
          <Grid item xs={12}>
            <CommonDate
              label="Selecciona una fecha"
              value={formData.fecha}
              onChange={handleDateChange}
              embedded
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, bgcolor: theme.palette.background.default }}>
        <CancelarTabButton onClick={onClose} disabled={isSubmitting} />
        <GuardarTabButton onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitting} />
      </DialogActions>
    </Dialog>
  );
}; 