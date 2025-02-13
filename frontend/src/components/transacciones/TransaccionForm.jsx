import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Fade,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Paper,
  InputAdornment,
  Chip,
  Autocomplete
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import { useSnackbar } from 'notistack';
import { useRelationalData } from '../../hooks/useRelationalData';
import {
  HealthAndSafety,
  Receipt,
  DirectionsBus,
  Fastfood,
  LocalBar as Cocktail,
  Checkroom as Shirt,
  Devices,
  MoreHoriz,
} from '@mui/icons-material';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 0,
    backgroundColor: theme.palette.background.default,
    backgroundImage: 'none',
    [theme.breakpoints.down('sm')]: {
      margin: 0,
      maxHeight: '100%',
      height: '100%',
      width: '100%',
      maxWidth: '100%'
    },
    [theme.breakpoints.up('sm')]: {
      minWidth: '600px',
      maxWidth: '800px'
    }
  }
}));

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  borderRadius: 0,
  padding: theme.spacing(1),
  flex: 1,
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  borderColor: theme.palette.divider,
  color: theme.palette.text.secondary,
  height: 40,
  '& .MuiSvgIcon-root': {
    fontSize: 18
  },
  '&.Mui-selected': {
    backgroundColor: props => {
      if (props.value === 'INGRESO') return 'rgba(90, 155, 95, 0.15)';
      if (props.value === 'EGRESO') return 'rgba(177, 87, 87, 0.15)';
      if (props.value === 'PAGADO') return 'rgba(90, 155, 95, 0.15)';
      if (props.value === 'PENDIENTE') return 'rgba(255, 183, 77, 0.15)';
      return 'inherit';
    },
    color: props => {
      if (props.value === 'INGRESO') return '#5a9b5f';
      if (props.value === 'EGRESO') return '#b15757';
      if (props.value === 'PAGADO') return '#5a9b5f';
      if (props.value === 'PENDIENTE') return '#ffb74d';
      return 'inherit';
    },
    '&:hover': {
      backgroundColor: props => {
        if (props.value === 'INGRESO') return 'rgba(90, 155, 95, 0.25)';
        if (props.value === 'EGRESO') return 'rgba(177, 87, 87, 0.25)';
        if (props.value === 'PAGADO') return 'rgba(90, 155, 95, 0.25)';
        if (props.value === 'PENDIENTE') return 'rgba(255, 183, 77, 0.25)';
        return 'inherit';
      }
    }
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

const CategoryGroup = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: 0,
  backgroundColor: theme.palette.background.paper
}));

const CATEGORIAS = [
  { valor: 'Contabilidad y Facturas', icon: <Receipt sx={{ fontSize: 18 }} />, color: '#7bba7f' },
  { valor: 'Comida y Mercado', icon: <Fastfood sx={{ fontSize: 18 }} />, color: '#ffb74d' },
  { valor: 'Salud y Belleza', icon: <HealthAndSafety sx={{ fontSize: 18 }} />, color: '#ef5350' },
  { valor: 'Ropa', icon: <Shirt sx={{ fontSize: 18 }} />, color: '#ba68c8' },
  { valor: 'Fiesta', icon: <Cocktail sx={{ fontSize: 18 }} />, color: '#9575cd' },
  { valor: 'Transporte', icon: <DirectionsBus sx={{ fontSize: 18 }} />, color: '#64b5f6' },
  { valor: 'Tecnología', icon: <Devices sx={{ fontSize: 18 }} />, color: '#90a4ae' },
  { valor: 'Otro', icon: <MoreHoriz sx={{ fontSize: 18 }} />, color: '#a1887f' }
];

const CategoryChip = styled(Chip)(({ theme }) => ({
  borderRadius: 0,
  height: 40,
  width: '100%',
  transition: 'all 0.2s ease',
  backgroundColor: 'transparent',
  border: 'none',
  '& .MuiChip-icon': {
    margin: 0,
    fontSize: 18,
    transition: 'color 0.2s ease'
  },
  '& .MuiChip-label': {
    display: 'none'
  },
  '&:hover': {
    backgroundColor: 'transparent'
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 0,
    height: 40,
    backgroundColor: theme.palette.background.default,
    '& fieldset': {
      borderColor: theme.palette.divider
    }
  },
  '& .MuiInputLabel-root': {
    transform: 'translate(14px, -9px) scale(0.75)',
    '&.Mui-focused, &.MuiFormLabel-filled': {
      transform: 'translate(14px, -9px) scale(0.75)'
    }
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(14px, -9px) scale(0.75)'
  }
}));

const TransaccionForm = ({ 
  open, 
  onClose, 
  onSubmit,
  initialData = {},
  isEditing = false 
}) => {
  const [formData, setFormData] = useState({
    tipo: initialData.tipo || 'INGRESO',
    estado: initialData.estado || 'PENDIENTE',
    monto: initialData.monto || '',
    descripcion: initialData.descripcion || '',
    categoria: initialData.categoria || '',
    fecha: initialData.fecha ? new Date(initialData.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    cuenta: initialData.cuenta || '',
    moneda: initialData.moneda || ''
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  
  // Definición de campos relacionales antes del hook
  const relatedFields = [
    { 
      type: 'relational',
      name: 'cuenta',
      endpoint: '/cuentas',
      labelField: 'nombre',
      populate: ['moneda']
    }
  ];

  const { relatedData, isLoading: isLoadingRelated } = useRelationalData({
    open,
    relatedFields
  });

  const [cuentasDisponibles, setCuentasDisponibles] = useState([]);
  const [selectedCuenta, setSelectedCuenta] = useState(null);

  useEffect(() => {
    const buscarCuenta = async () => {
      console.log('Buscando cuenta:', {
        cuentaId: initialData.cuenta,
        cuentasDisponibles,
        cuentaEncontrada: cuentasDisponibles.find(c => 
          c._id === initialData.cuenta || 
          c.id === initialData.cuenta
        )
      });

      const cuentaEncontrada = cuentasDisponibles.find(c => 
        c._id === initialData.cuenta || 
        c.id === initialData.cuenta
      );

      if (cuentaEncontrada) {
        setSelectedCuenta(cuentaEncontrada);
      }
    };

    if (initialData.cuenta && cuentasDisponibles.length > 0) {
      buscarCuenta();
    }
  }, [initialData.cuenta, cuentasDisponibles]);

  useEffect(() => {
    if (open) {
      setFormData(initialData);
      setErrors({});
    }
  }, [open, initialData]);

  // Efecto para actualizar la moneda cuando cambia la cuenta
  useEffect(() => {
    if (selectedCuenta?.moneda) {
      setFormData(prev => ({
        ...prev,
        moneda: selectedCuenta.moneda.id
      }));
    }
  }, [selectedCuenta]);

  const handleChange = useCallback((name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const handleMontoChange = (event) => {
    const value = event.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      handleChange('monto', value);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      // Preparar los datos para enviar
      const dataToSubmit = {
        ...formData,
        monto: parseFloat(formData.monto),
        fecha: formData.fecha || new Date().toISOString(),
        estado: formData.estado || 'PENDIENTE',
        cuenta: selectedCuenta?.id || selectedCuenta?._id || formData.cuenta
      };

      console.log('Cuenta seleccionada:', selectedCuenta);
      console.log('Datos a enviar:', dataToSubmit);
      await onSubmit(dataToSubmit);
      enqueueSnackbar(
        isEditing ? 'Transacción actualizada' : 'Transacción guardada', 
        { variant: 'success' }
      );
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
      enqueueSnackbar(
        error.response?.data?.message || error.message || 'Error al guardar', 
        { variant: 'error' }
      );
    } finally {
      setIsSaving(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.tipo) newErrors.tipo = 'Seleccione el tipo';
    if (!formData.monto) newErrors.monto = 'Ingrese el monto';
    if (!formData.descripcion) newErrors.descripcion = 'Ingrese una descripción';
    if (!formData.categoria) newErrors.categoria = 'Seleccione una categoría';
    if (!selectedCuenta) newErrors.cuenta = 'Seleccione una cuenta';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <StyledDialog
      open={open}
      onClose={!isSaving ? onClose : undefined}
      maxWidth="md"
      fullWidth
    >
      <Box sx={{ position: 'relative' }}>
        <DialogTitle sx={{ px: 3, py: 2 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="h6" sx={{ 
              color: isSaving ? 'text.secondary' : 'text.primary' 
            }}>
              {isEditing ? 'Editar Transacción' : 'Nueva Transacción'}
            </Typography>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{ 
                color: 'text.secondary',
                borderRadius: 0
              }}
              disabled={isSaving}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </DialogTitle>
        <Fade in={isSaving}>
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

      <DialogContent sx={{ px: 3, py: 2 }}>
        <Box component="form" onSubmit={handleSubmit}>
          {/* Tipo de Transacción */}
          <Box sx={{ mb: 2 }}>
            <ToggleButtonGroup
              value={formData.tipo}
              exclusive
              onChange={(_, value) => value && handleChange('tipo', value)}
              fullWidth
              sx={{ 
                height: 40,
                '& .MuiToggleButton-root': {
                  flex: 1
                }
              }}
            >
              <StyledToggleButton value="INGRESO">
                <AddIcon sx={{ fontSize: 18 }} />
                <Typography variant="subtitle2">Ingreso</Typography>
              </StyledToggleButton>
              <StyledToggleButton value="EGRESO">
                <RemoveIcon sx={{ fontSize: 18 }} />
                <Typography variant="subtitle2">Egreso</Typography>
              </StyledToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Monto y Estado */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            mb: 2,
            alignItems: 'flex-start'
          }}>
            <StyledTextField
              fullWidth
              label="Monto"
              value={formData.monto || ''}
              onChange={handleMontoChange}
              error={!!errors.monto}
              helperText={errors.monto}
              InputProps={{
                startAdornment: selectedCuenta?.moneda && (
                  <InputAdornment position="start">
                    {selectedCuenta.moneda.simbolo}
                  </InputAdornment>
                )
              }}
            />
            <ToggleButtonGroup
              value={formData.estado}
              exclusive
              onChange={(_, value) => value && handleChange('estado', value)}
              sx={{
                minWidth: 'fit-content',
                height: 40,
                '& .MuiToggleButton-root': {
                  px: 2,
                  borderRadius: 0
                }
              }}
            >
              <ToggleButton value="PAGADO">
                <CheckCircleIcon sx={{ fontSize: 18 }} />
                <Typography variant="caption" sx={{ ml: 1, whiteSpace: 'nowrap' }}>
                  Pago
                </Typography>
              </ToggleButton>
              <ToggleButton value="PENDIENTE">
                <PendingIcon sx={{ fontSize: 18 }} />
                <Typography variant="caption" sx={{ ml: 1, whiteSpace: 'nowrap' }}>
                  Pendiente
                </Typography>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Descripción */}
          <StyledTextField
            fullWidth
            label="Descripción"
            value={formData.descripcion || ''}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            error={!!errors.descripcion}
            helperText={errors.descripcion}
            sx={{ mb: 2 }}
            InputLabelProps={{
              shrink: true
            }}
          />

          {/* Cuenta */}
          <Autocomplete
            value={selectedCuenta}
            onChange={(event, newValue) => {
              setSelectedCuenta(newValue);
              setFormData(prev => ({
                ...prev,
                cuenta: newValue?.id || newValue?._id || ''
              }));
            }}
            options={relatedData?.cuenta || []}
            getOptionLabel={(option) => `${option?.nombre || ''} - ${option?.tipo || ''}`}
            loading={isLoadingRelated}
            renderInput={(params) => (
              <StyledTextField
                {...params}
                label="Cuenta"
                error={!!errors.cuenta}
                helperText={errors.cuenta}
                sx={{ mb: 2 }}
                InputLabelProps={{
                  ...params.InputLabelProps,
                  shrink: true
                }}
              />
            )}
            isOptionEqualToValue={(option, value) => 
              (option?.id === value?.id) || 
              (option?._id === value?._id) ||
              (option?.id === value?._id) ||
              (option?._id === value?.id)
            }
            renderOption={(props, option) => {
              const { key, ...otherProps } = props;
              return (
                <Box 
                  key={key} 
                  component="li" 
                  {...otherProps}
                  sx={{ 
                    py: 1,
                    px: 2,
                    borderBottom: t => `1px solid ${t.palette.divider}`,
                    '&:last-child': {
                      borderBottom: 'none'
                    }
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2">{option.nombre}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.moneda?.simbolo} - {option.tipo}
                    </Typography>
                  </Box>
                </Box>
              );
            }}
          />

          {/* Categorías */}
          <Box sx={{ mt: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 1,
              gap: 1
            }}>
              <Typography variant="subtitle2">
                Categoría
              </Typography>
              {formData.categoria && (
                <Typography variant="caption" color="text.secondary">
                  {formData.categoria}
                </Typography>
              )}
            </Box>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(4, 1fr)',
                sm: 'repeat(8, 1fr)'
              },
              gap: 1
            }}>
              {CATEGORIAS.map((categoria) => (
                <CategoryChip
                  key={categoria.valor}
                  icon={categoria.icon}
                  onClick={() => handleChange('categoria', categoria.valor)}
                  sx={{ 
                    '& .MuiChip-icon': {
                      color: formData.categoria === categoria.valor ? 
                        categoria.color : 
                        theme => theme.palette.text.secondary
                    },
                    '&:hover': {
                      '& .MuiChip-icon': {
                        color: categoria.color
                      }
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        px: 3, 
        py: 2,
        borderTop: t => `1px solid ${t.palette.divider}`,
        gap: 1
      }}>
        <Button 
          onClick={onClose} 
          disabled={isSaving}
          sx={{ 
            borderRadius: 0,
            height: 40
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSaving}
          sx={{ 
            borderRadius: 0,
            height: 40
          }}
        >
          {isSaving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default TransaccionForm; 