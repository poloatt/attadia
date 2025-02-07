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
      
      // Solo cargar datos si hay campos relacionados
      if (relatedFields.length === 0) {
        setIsLoading(false);
        return;
      }
      
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
  }, [open, onFetchRelatedData, enqueueSnackbar, relatedFields]);

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
      
      if (type === 'nested') {
        // Si es un campo anidado, mantener la estructura anidada
        if (!newData._nested) newData._nested = {};
        newData._nested[name] = nestedData;
      } else {
        // Caso normal
        newData[name] = value;
      }
      
      return newData;
    });
    
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

    const validateField = (field, value, parentField = null) => {
      const fieldPath = parentField ? `${parentField}.${field.name}` : field.name;
      
      // Validación de campos requeridos
      if (field.required && !value) {
        newErrors[fieldPath] = 'Este campo es requerido';
        isValid = false;
      }

      // Validación personalizada
      if (field.validate) {
        const fieldError = field.validate(value, formData);
        if (fieldError) {
          newErrors[fieldPath] = fieldError;
          isValid = false;
        }
      }

      // Validar campos anidados
      if (field.nested && field.fields) {
        const nestedData = formData._nested?.[field.name] || {};
        field.fields.forEach(childField => {
          validateField(childField, nestedData[childField.name], field.name);
        });
      }
    };

    fields.forEach(field => validateField(field, formData[field.name]));

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
        nestedData={formData._nested?.[field.name]}
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
      disableEnforceFocus
      disableAutoFocus
      TransitionProps={{
        onExited: () => {
          setFormData(initialData);
          setErrors({});
        }
      }}
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
            tabIndex={0}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={isLoading || isSaving}
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