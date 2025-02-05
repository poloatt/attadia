import React, { useState, useEffect, memo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { RelationalField } from './RelationalFields';

// Componente para el campo de texto base
const FormTextField = memo(({ field, value, onChange }) => (
  <TextField
    name={field.name}
    label={field.label}
    value={value ?? ''}
    onChange={onChange}
    fullWidth
    margin="normal"
    required={field.required}
    multiline={field.multiline}
    rows={field.rows}
    type={field.type}
    size="small"
    InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
  />
));

// Componente para el campo select
const FormSelectField = memo(({ field, value, onChange }) => (
  <FormControl fullWidth margin="normal" size="small">
    <InputLabel>{field.label}</InputLabel>
    <Select
      name={field.name}
      value={value ?? ''}
      onChange={onChange}
      label={field.label}
      required={field.required}
    >
      {field.options?.map((option, index) => (
        <MenuItem 
          key={`${field.name}-${option.value}-${index}`} 
          value={option.value}
        >
          {option.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
));

// Componente principal del formulario
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
  const [formData, setFormData] = useState({});
  const [relatedData, setRelatedData] = useState({});

  // Efecto para cargar datos relacionados
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!open || !relatedFields.length) return;
      
      try {
        const data = await onFetchRelatedData();
        if (isMounted) {
          setRelatedData(data);
        }
      } catch (error) {
        console.error('Error al cargar datos relacionados:', error);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [open, relatedFields.length, onFetchRelatedData]);

  // Efecto para inicializar el formulario
  useEffect(() => {
    if (open) {
      setFormData(initialData || {});
    }
  }, [open, initialData]);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }));
  }, []);

  const handleSubmit = useCallback((event) => {
    event.preventDefault();
    onSubmit(formData);
  }, [formData, onSubmit]);

  const renderField = useCallback((field) => {
    if (field.type === 'relational' || field.type === 'creatable') {
      return (
        <RelationalField
          field={field}
          value={formData[field.name]}
          onChange={handleChange}
          onCreateNew={field.onCreateNew}
          relatedData={relatedData}
        />
      );
    }

    return (
      <FormTextField
        field={field}
        value={formData[field.name]}
        onChange={handleChange}
      />
    );
  }, [formData, handleChange, relatedData]);

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
      <DialogTitle sx={{ px: 3, py: 2 }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h6">
            {title}
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {fields.map(field => (
              <Box key={field.name}>
                {renderField(field)}
              </Box>
            ))}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default memo(EntityForm);