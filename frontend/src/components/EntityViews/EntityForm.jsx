import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
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

  const initialDataRef = useRef(initialData);

  useEffect(() => {
    if (open) {
      console.log('Resetting form data:', initialData);
      setFormData(initialData);
      initialDataRef.current = initialData;
      setErrors({});
    }
  }, [open]);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      return newData;
    });
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  }, [errors]);

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

  const formFields = useMemo(() => {
    return fields.map(field => {
      const fieldKey = field.name;
      const fieldValue = formData[field.name];
      
      return (
        <FormField
          key={fieldKey}
          field={field}
          value={fieldValue}
          onChange={handleChange}
          error={errors[field.name]}
          isLoading={field.type === 'relational' && isLoadingRelated}
          relatedData={field.type === 'relational' ? relatedData : undefined}
          onCreateNew={field.onCreateNew}
        />
      );
    });
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
      aria-labelledby="form-dialog-title"
      disableEscapeKeyDown={false}
      disablePortal={false}
      keepMounted={false}
    >
      <DialogHeader 
        title={title} 
        onClose={onClose}
        isLoading={isLoadingRelated || isSaving}
      />
      
      <form onSubmit={handleSubmit} noValidate>
        <DialogContent 
          sx={{ 
            px: 3, 
            py: 2,
            opacity: isSaving ? 0.7 : 1,
            '& .MuiFormControl-root': {
              pointerEvents: 'auto'
            },
            '& .MuiInputBase-root': {
              pointerEvents: 'auto'
            },
            '& .MuiSelect-select': {
              pointerEvents: 'auto'
            }
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1,
              '& > *': {
                pointerEvents: 'auto'
              }
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
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={isLoadingRelated || isSaving}
          >
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EntityForm;