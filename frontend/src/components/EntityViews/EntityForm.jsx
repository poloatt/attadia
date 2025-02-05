import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions as MuiDialogActions,
  Button,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useFormFields } from './hooks/useFormFields';
import { FormField } from './FormField';
import { useRelationalData } from './hooks/useRelationalData';

const DialogHeader = memo(({ title, onClose }) => (
  <DialogTitle sx={{ px: 3, py: 2 }}>
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <Typography variant="h6">{title}</Typography>
      <IconButton
        onClick={onClose}
        size="small"
        sx={{ color: 'text.secondary' }}
      >
        <CloseIcon />
      </IconButton>
    </Box>
  </DialogTitle>
));

const CustomDialogActions = memo(({ onClose }) => (
  <MuiDialogActions sx={{ px: 3, py: 2 }}>
    <Button onClick={onClose} type="button">
      Cancelar
    </Button>
  </MuiDialogActions>
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
  // Custom hooks para manejar la lógica del formulario
  const {
    formData,
    handleChange,
    resetForm,
    validateForm
  } = useFormFields(initialData);

  const {
    relatedData,
    isLoading,
    error
  } = useRelationalData({
    open,
    relatedFields,
    onFetchRelatedData
  });

  // Efecto para resetear el formulario cuando se abre/cierra
  useEffect(() => {
    if (open) {
      resetForm(initialData);
    }
  }, [open, initialData, resetForm]);

  // Manejador de envío optimizado
  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    
    const isValid = validateForm();
    if (!isValid) return;

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  }, [formData, onSubmit, onClose, validateForm]);

  const handleCreateNew = async (data, fieldName) => {
    try {
      const newItem = await onCreateNew(data);
      // Actualiza los datos relacionados después de crear un nuevo registro
      const updatedData = await onFetchRelatedData();
      setRelatedData(prev => ({
        ...prev,
        [fieldName]: updatedData[fieldName]
      }));
      return newItem;
    } catch (error) {
      console.error('Error al crear nuevo registro:', error);
      throw error;
    }
  };

  // Campos del formulario memorizados
  const formFields = useMemo(() => (
    fields.map(field => (
      <FormField
        key={field.name}
        field={field}
        value={formData[field.name]}
        onChange={handleChange}
        relatedData={relatedData}
        error={error}
        onCreateNew={handleCreateNew}
      />
    ))
  ), [fields, formData, handleChange, relatedData, error]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.default',
          backgroundImage: 'none',
          borderRadius: 2
        }
      }}
    >
      <DialogHeader title={title} onClose={onClose} />
      
      <form onSubmit={handleSubmit}>
        <DialogContent 
          sx={{ 
            px: 3, 
            py: 2,
            ...(isLoading && { 
              opacity: 0.7,
              pointerEvents: 'none' 
            })
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1 
            }}
          >
            {formFields}
          </Box>
        </DialogContent>

        <CustomDialogActions onClose={onClose} />
      </form>
    </Dialog>
  );
};

export default memo(EntityForm);