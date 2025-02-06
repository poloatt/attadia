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
  relatedFields = [],
  onFetchRelatedData = async () => ({})
}) => {
  const [formData, setFormData] = useState(initialData);
  const [relatedData, setRelatedData] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!open) return;
      
      setIsLoading(true);
      try {
        const data = await onFetchRelatedData();
        if (isMounted) {
          setRelatedData(data);
        }
      } catch (error) {
        console.error('Error al cargar datos relacionados:', error);
        if (isMounted) {
          enqueueSnackbar('Error al cargar datos relacionados', { 
            variant: 'error',
            anchorOrigin: { vertical: 'top', horizontal: 'center' }
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [open, onFetchRelatedData, enqueueSnackbar]);

  useEffect(() => {
    if (open) {
      setFormData(initialData);
      setErrors({});
    }
  }, [open, initialData]);

  const handleChange = useCallback((event) => {
    const { name, value, type, selectedOption } = event.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }

    const field = fields.find(f => f.name === name);
    if (field?.onChange) {
      field.onChange(value, type, selectedOption);
    }
  }, [errors, fields]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    fields.forEach(field => {
      if (field.required && (formData[field.name] === null || formData[field.name] === undefined || formData[field.name] === '')) {
        newErrors[field.name] = 'Este campo es requerido';
        isValid = false;
      }

      if (field.validate) {
        const fieldError = field.validate(formData[field.name], formData);
        if (fieldError) {
          newErrors[field.name] = fieldError;
          isValid = false;
        }
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
    fields.map(field => (
      <FormField
        key={field.name}
        field={field}
        value={formData[field.name]}
        onChange={handleChange}
        relatedData={relatedData}
        error={errors[field.name]}
        isLoading={isLoading}
      />
    ))
  ), [fields, formData, handleChange, relatedData, errors, isLoading]);

  return (
    <Dialog
      open={open}
      onClose={!isLoading && !isSaving ? onClose : undefined}
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
    >
      <DialogHeader 
        title={title} 
        onClose={onClose}
        isLoading={isLoading || isSaving}
      />
      
      <form onSubmit={handleSubmit}>
        <DialogContent 
          sx={{ 
            px: 3, 
            py: 2,
            opacity: isLoading ? 0.7 : 1
          }}
          inert={isLoading ? '' : undefined}
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
            disabled={isLoading || isSaving}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={isLoading || isSaving}
          >
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EntityForm;