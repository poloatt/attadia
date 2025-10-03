import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  LinearProgress,
  Fade
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { CommonField } from './CommonField';
import { useSnackbar } from 'notistack';
import { useRelationalData } from '../../hooks/useRelationalData';

const DialogHeader = memo(({ title, onClose, isLoading }) => (
  <Box sx={{ position: 'relative' }}>
    <DialogTitle sx={{ px: 3, py: 2 }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6" sx={{ 
          color: isLoading ? 'text.secondary' : 'text.primary' 
        }}>
          {title}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ 
            color: 'text.secondary',
            borderRadius: 0
          }}
          disabled={isLoading}
        >
          <CloseIcon />
        </IconButton>
      </Box>
    </DialogTitle>
    <Fade in={isLoading}>
      <LinearProgress 
        sx={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0,
          height: 2
        }} 
      />
    </Fade>
  </Box>
));

const EntityForm = ({ 
  open, 
  onClose, 
  onSubmit,
  title,
  fields = [],
  initialData = {},
  isEditing = false
}) => {
  const { 
    relatedData, 
    isLoading: isLoadingRelated
  } = useRelationalData({
    open,
    relatedFields: fields.filter(f => f.type === 'relational')
  });

  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (open) {
      setFormData(initialData);
      setErrors({});
    }
  }, [open]);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    setErrors(prev => ({
      ...prev,
      [name]: null
    }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = 'Este campo es requerido';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [fields, formData]);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      enqueueSnackbar('Por favor, complete todos los campos requeridos', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit(formData);
      enqueueSnackbar(
        isEditing ? 'Datos actualizados exitosamente' : 'Datos guardados exitosamente', 
        { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'center' }
        }
      );
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
      enqueueSnackbar(error.message || 'Error al guardar los datos', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
    } finally {
      setIsSaving(false);
    }
  }, [formData, onSubmit, onClose, validateForm, enqueueSnackbar, isEditing]);

  const formFields = useMemo(() => {
    return fields.map(field => (
      <CommonField
        key={field.name}
        field={field}
        value={formData[field.name]}
        onChange={handleChange}
        error={errors[field.name]}
        isLoading={field.type === 'relational' && isLoadingRelated}
        relatedData={field.type === 'relational' ? relatedData : undefined}
        onCreateNew={field.onCreateNew}
        formData={formData}
      />
    ));
  }, [fields, formData, handleChange, errors, isLoadingRelated, relatedData]);

  return (
    <Dialog
      open={open}
      onClose={!isSaving ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.default',
          backgroundImage: 'none',
          borderRadius: 0
        }
      }}
    >
      <DialogHeader 
        title={title} 
        onClose={onClose}
        isLoading={isLoadingRelated || isSaving}
      />
      
      <DialogContent sx={{ px: 3, py: 2 }}>
        <Box 
          component="form" 
          onSubmit={handleSubmit}
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2 
          }}
        >
          {formFields}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={onClose} 
          disabled={isSaving}
          sx={{ borderRadius: 0 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSaving}
          sx={{ borderRadius: 0 }}
        >
          {isSaving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EntityForm;
