import React, { useState, useEffect } from 'react';
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
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useSnackbar } from 'notistack';

// Componente interno para el selector de moneda con botones
const MonedaSelector = ({ 
  options, 
  value, 
  onChange, 
  label, 
  required = false, 
  displaySymbol = false 
}) => (
  <Box sx={{ mb: 2 }}>
    <Typography 
      variant="subtitle2" 
      component="label"
      sx={{ 
        color: 'text.secondary',
        fontSize: '0.875rem'
      }}
    >
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
        gap: 0.5, 
        mt: 1,
        '& .MuiToggleButton-root': {
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '4px !important',
          px: 1.5,
          py: 0.5,
          fontSize: '0.875rem',
          color: 'text.secondary',
          '&.Mui-selected': {
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              backgroundColor: 'primary.dark'
            }
          }
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

// Definimos el componente CreatableSelect
const CreatableSelect = ({
  value,
  onChange,
  options = [],
  onCreateNew,
  createFields = [],
  createTitle = 'Nuevo Item',
  label,
  required = false,
  variant = 'select',
  displaySymbol = false
}) => {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({});

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setFormData({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newItem = await onCreateNew(formData);
      onChange(newItem.id);
      handleClose();
    } catch (error) {
      console.error('Error al crear:', error);
    }
  };

  if (variant === 'buttons') {
    return (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {label && (
            <Typography 
              variant="subtitle2" 
              component="label"
              sx={{ color: 'text.secondary' }}
            >
              {label} {required && '*'}
            </Typography>
          )}
        </Box>
        <ToggleButtonGroup
          value={value || ''}
          exclusive
          onChange={(e, newValue) => onChange(newValue)}
          aria-label={label}
          sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 0.5,
            mt: 1
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
        <Button
          startIcon={<AddIcon />}
          onClick={handleOpen}
          sx={{ mt: 1 }}
          size="small"
        >
          Crear Nuevo
        </Button>
      </Box>
    );
  }

  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        label={label}
        required={required}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      <Button
        startIcon={<AddIcon />}
        onClick={handleOpen}
        sx={{ mt: 1 }}
        size="small"
      >
        Crear Nuevo
      </Button>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{createTitle}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {createFields.map((field) => (
              <TextField
                key={field.name}
                label={field.label}
                required={field.required}
                fullWidth
                margin="dense"
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  [field.name]: e.target.value
                }))}
              />
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button type="submit" variant="contained">
              Crear
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </FormControl>
  );
};

const EntityForm = ({ 
  open, 
  onClose, 
  onSubmit,
  title,
  fields = [],
  initialData = {}
}) => {
  const [formData, setFormData] = useState(initialData);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (open) {
      setFormData(initialData);
    }
  }, [open, JSON.stringify(initialData)]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
    setFormData({});
  };

  const renderField = (field) => {
    const { 
      name, 
      label, 
      type, 
      required, 
      options, 
      defaultValue, 
      component,
      onCreateNew,
      createFields,
      createTitle,
      variant,
      displaySymbol
    } = field;

    // Si es un campo creatable, usar CreatableSelect
    if (component === 'creatable') {
      return (
        <CreatableSelect
          key={name}
          value={formData[name]}
          onChange={(value) => handleChange({ target: { name, value } })}
          options={options}
          onCreateNew={onCreateNew}
          createFields={createFields}
          createTitle={createTitle}
          label={label}
          required={required}
          variant={variant}
          displaySymbol={displaySymbol}
        />
      );
    }

    // Para campos select normales
    if (type === 'select') {
      return (
        <FormControl fullWidth>
          <InputLabel 
            sx={{ 
              color: 'text.secondary',
              '&.Mui-focused': {
                color: 'primary.main'
              }
            }}
          >
            {label}
          </InputLabel>
          <Select
            name={name}
            label={label}
            value={formData[name] || ''}
            onChange={handleChange}
            required={required}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'divider'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'text.secondary'
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main'
              }
            }}
          >
            {options?.map(option => (
              <MenuItem 
                key={option.value} 
                value={option.value}
                sx={{
                  fontSize: '0.875rem'
                }}
              >
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    // Para campos de texto y otros tipos
    return (
      <TextField
        name={name}
        label={label}
        type={type}
        fullWidth
        required={required}
        value={formData[name] || defaultValue || ''}
        onChange={handleChange}
        sx={{
          '& .MuiOutlinedInput-root': {
            fontSize: '0.875rem',
            '& fieldset': {
              borderColor: 'divider'
            },
            '&:hover fieldset': {
              borderColor: 'text.secondary'
            },
            '&.Mui-focused fieldset': {
              borderColor: 'primary.main'
            }
          },
          '& .MuiInputLabel-root': {
            color: 'text.secondary',
            fontSize: '0.875rem',
            '&.Mui-focused': {
              color: 'primary.main'
            }
          },
          '& .MuiInputBase-input': {
            color: 'text.primary'
          }
        }}
      />
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="form-dialog-title"
      keepMounted={false}
      disablePortal={false}
      BackdropProps={{
        'aria-hidden': 'false'
      }}
      PaperProps={{
        sx: {
          bgcolor: 'background.default',
          backgroundImage: 'none',
          borderRadius: 2,
          width: {
            xs: '100%',
            sm: '450px'
          },
          maxWidth: '100%'
        }
      }}
    >
      <DialogTitle sx={{ px: 3, py: 2 }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'text.primary',
              fontSize: '1.125rem',
              fontWeight: 500
            }}
          >
            {title}
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' }
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent 
          sx={{ 
            px: 3,
            py: 2,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 2.5
          }}>
            {fields.map(field => (
              <Box key={field.name}>
                {renderField(field)}
              </Box>
            ))}
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            gap: 1,
            justifyContent: 'flex-end'
          }}
        >
          <Button 
            onClick={onClose}
            size="small"
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.875rem',
              fontWeight: 500,
              '&:hover': { 
                color: 'text.primary',
                bgcolor: 'action.hover'
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            size="small"
            sx={{ 
              px: 2,
              py: 0.75,
              fontSize: '0.875rem',
              fontWeight: 500,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EntityForm;