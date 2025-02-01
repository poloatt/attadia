import React, { useState } from 'react';
import { 
  TextField, 
  MenuItem, 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Box,
  Typography,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useSnackbar } from 'notistack';

// Componente para el selector de moneda con botones
const MonedaSelector = ({ 
  options, 
  value, 
  onChange, 
  label, 
  required = false,
  displaySymbol = false 
}) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="subtitle1" component="label">
      {label} {required && '*'}
    </Typography>
    <ToggleButtonGroup
      value={value || ''}
      exclusive
      onChange={(e, newValue) => onChange(newValue)}
      aria-label={label}
      sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 1, 
        mt: 1,
        '& .MuiToggleButton-root': {
          border: '1px solid',
          borderRadius: '4px !important',
          px: 2
        }
      }}
    >
      {options.map((option) => (
        <ToggleButton 
          key={option.value} 
          value={option.value}
          aria-label={option.label}
        >
          {displaySymbol ? option.simbolo : option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  </Box>
);

export default function CreatableSelect({ 
  options, 
  value, 
  onChange, 
  label, 
  name,
  onCreateNew,
  createFields,
  createTitle,
  required,
  variant = 'select',
  displaySymbol = false
}) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const { enqueueSnackbar } = useSnackbar();

  const handleCreate = async () => {
    try {
      if (!formData.monedaId && formData.tipo) {
        formData.monedaId = parseInt(formData.monedaId);
      }
      const newItem = await onCreateNew(formData);
      onChange(newItem.id);
      setOpen(false);
      setFormData({});
      enqueueSnackbar('Registro creado exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar(error.response?.data?.error || 'Error al crear registro', { 
        variant: 'error' 
      });
    }
  };

  const renderField = (field) => {
    // Si es un campo de moneda, usar el selector de botones
    if (field.name === 'monedaId' || field.isMonedaField) {
      return (
        <MonedaSelector
          key={field.name}
          {...field}
          value={formData[field.name] || ''}
          onChange={(value) => setFormData({
            ...formData,
            [field.name]: value
          })}
        />
      );
    }

    // Para otros campos, usar TextField normal
    return (
      <TextField
        key={field.name}
        fullWidth
        margin="normal"
        {...field}
        value={formData[field.name] || ''}
        onChange={(e) => setFormData({
          ...formData,
          [field.name]: e.target.value
        })}
      />
    );
  };

  if (variant === 'buttons') {
    return (
      <>
        <MonedaSelector
          options={options}
          value={value}
          onChange={onChange}
          label={label}
          required={required}
          displaySymbol={displaySymbol}
        />
        <Button
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          variant="outlined"
          sx={{ mt: 1 }}
        >
          Crear nuevo
        </Button>

        <Dialog 
          open={open} 
          onClose={() => setOpen(false)}
          aria-labelledby="create-dialog-title"
          disableEnforceFocus
          keepMounted
        >
          <DialogTitle id="create-dialog-title">{createTitle}</DialogTitle>
          <DialogContent>
            {createFields.map(renderField)}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} variant="contained">
              Crear
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  // Versión dropdown
  return (
    <>
      <TextField
        select
        fullWidth
        label={label}
        name={name}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        margin="normal"
      >
        <MenuItem value="">
          <em>Seleccione una opción</em>
        </MenuItem>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
        <Divider sx={{ my: 1 }} />
        <MenuItem 
          onClick={() => setOpen(true)}
          sx={{ color: 'primary.main' }}
        >
          <AddIcon sx={{ mr: 1 }} />
          Crear nueva opción
        </MenuItem>
      </TextField>

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)}
        aria-labelledby="create-dialog-title"
        disableEnforceFocus
        keepMounted
      >
        <DialogTitle id="create-dialog-title">{createTitle}</DialogTitle>
        <DialogContent>
          {createFields.map(renderField)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleCreate} variant="contained">
            Crear
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 