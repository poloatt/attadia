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
import { FormField } from './FormField';
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
  initialData = {}
}) => {
  const { 
    relatedData, 
    isLoading: isLoadingRelated,
    refreshField 
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
  }, [open, initialData]);

  const handleChange = useCallback((event) => {
    const { name, value, type, selectedOption, nestedData } = event.target;
    
    setFormData(prev => {
      const newData = { ...prev };
      
      // Si es un campo anidado
      if (type === 'nested') {
        newData._nested = {
          ...(newData._nested || {}),
          [name]: nestedData
        };
      } else {
        // Para campos normales, actualizamos directamente
        newData[name] = value;
      }
      
      return newData;
    });
    
    // Limpiamos el error si existe
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  }, [errors]);

  // Validación del formulario
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
      enqueueSnackbar('Datos guardados exitosamente', { 
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
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
  }, [formData, onSubmit, onClose, validateForm, enqueueSnackbar]);

  const formFields = useMemo(() => (
    fields.map(field => {
      const isRelationalField = field.type === 'relational';
      const fieldData = isRelationalField ? relatedData[field.name] : field.options;
      
      return (
        <FormField
          key={field.name}
          field={{
            ...field,
            options: fieldData || []
          }}
          value={formData[field.name]}
          onChange={handleChange}
          error={errors[field.name]}
          isLoading={isRelationalField && isLoadingRelated}
          nestedData={formData._nested?.[field.name]}
        />
      );
    })
  ), [fields, formData, handleChange, relatedData, errors, isLoadingRelated]);

  return (
    <Dialog
      open={open}
      onClose={!isLoadingRelated && !isSaving ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.default',
          backgroundImage: 'none',
          borderRadius: 0
        }
      }}
      aria-labelledby="form-dialog-title"
      keepMounted={false}
      disableEnforceFocus
      disableAutoFocus
    >
      <DialogHeader 
        title={title} 
        onClose={onClose}
        isLoading={isLoadingRelated || isSaving}
      />
      
      <form onSubmit={handleSubmit}>
        <DialogContent 
          sx={{ 
            px: 3, 
            py: 2,
            opacity: isLoadingRelated ? 0.7 : 1
          }}
          tabIndex={-1}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1 
            }}
            role="group"
            aria-label="Campos del formulario"
          >
            {formFields}
          </Box>
        </DialogContent>

        <DialogActions 
          sx={{ 
            px: 3, 
            py: 2,
            '& > button': {
              borderRadius: 0,
              '&:focus-visible': {
                outline: '2px solid',
                outlineOffset: 2
              }
            }
          }}
        >
          <Button 
            onClick={onClose} 
            type="button"
            disabled={isLoadingRelated || isSaving}
            tabIndex={0}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={isLoadingRelated || isSaving}
            tabIndex={0}
          >
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EntityForm;