import React, { useState, memo } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useSnackbar } from 'notistack';

// Componente para el campo de texto base en formularios relacionales
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

// Componente para el campo select en formularios relacionales
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
      {field.options?.map((option) => (
        <MenuItem 
          key={option.value} 
          value={option.value}
        >
          {option.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
));

// Componente para campos relacionales con opción de crear
export const RelationalField = memo(({ 
  field, 
  value, 
  onChange,
  onCreateNew,
  relatedData
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [createFormData, setCreateFormData] = useState({});
  const { enqueueSnackbar } = useSnackbar();

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const newItem = await onCreateNew(createFormData, field.name);
      onChange({ target: { name: field.name, value: newItem.id } });
      setIsCreating(false);
      setCreateFormData({});
      enqueueSnackbar('Registro creado exitosamente', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Error al crear', { variant: 'error' });
    }
  };

  const handleCreateFieldChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isCreating) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {field.createTitle || 'Crear Nuevo'}
        </Typography>
        <form onSubmit={handleCreate}>
          {field.createFields?.map(createField => (
            <TextField
              key={createField.name}
              name={createField.name}
              label={createField.label}
              value={createFormData[createField.name] ?? ''}
              onChange={handleCreateFieldChange}
              fullWidth
              margin="normal"
              required={createField.required}
              size="small"
            />
          ))}
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button type="submit" variant="contained" size="small">
              Crear
            </Button>
            <Button 
              type="button" 
              onClick={() => setIsCreating(false)} 
              size="small"
            >
              Cancelar
            </Button>
          </Box>
        </form>
      </Box>
    );
  }

  return (
    <Box>
      <FormSelectField
        field={{
          ...field,
          options: field.options || relatedData[field.name] || []
        }}
        value={value}
        onChange={onChange}
      />
      {onCreateNew && (
        <Button
          type="button"
          size="small"
          onClick={() => setIsCreating(true)}
          startIcon={<AddIcon />}
          sx={{ mt: 1 }}
        >
          {field.createButtonText || 'Crear Nuevo'}
        </Button>
      )}
    </Box>
  );
}); 