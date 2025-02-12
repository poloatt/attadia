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
    minWidth: '600px'
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
  '&.Mui-selected': {
    backgroundColor: props => props.value === 'INGRESO' ? '#7bba7f' : '#ef5350',
    color: '#fff',
    '&:hover': {
      backgroundColor: props => props.value === 'INGRESO' ? '#66a169' : '#d84848',
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
  { valor: 'Contabilidad y Facturas', icon: <Receipt />, color: '#7bba7f' },
  { valor: 'Comida y Mercado', icon: <Fastfood />, color: '#ffb74d' },
  { valor: 'Salud y Belleza', icon: <HealthAndSafety />, color: '#ef5350' },
  { valor: 'Ropa', icon: <Shirt />, color: '#ba68c8' },
  { valor: 'Fiesta', icon: <Cocktail />, color: '#9575cd' },
  { valor: 'Transporte', icon: <DirectionsBus />, color: '#64b5f6' },
  { valor: 'Tecnología', icon: <Devices />, color: '#90a4ae' },
  { valor: 'Otro', icon: <MoreHoriz />, color: '#a1887f' }
];

const CategoryChip = styled(Chip)(({ theme }) => ({
  borderRadius: 0,
  height: 48,
  width: 48,
  transition: 'background-color 0.2s ease',
  '& .MuiChip-icon': {
    margin: 0,
    fontSize: '1.5rem',
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  '& .MuiChip-label': {
    display: 'none',
    opacity: 0,
    position: 'absolute',
    top: '-24px',
    left: '50%',
    transform: 'translateX(-50%)',
    whiteSpace: 'nowrap',
    backgroundColor: 'rgba(0,0,0,0.8)',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: '0.75rem'
  },
  '&:hover .MuiChip-label': {
    display: 'block',
    opacity: 1
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
    tipo: 'EGRESO',
    estado: 'PENDIENTE',
    ...initialData
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

  useEffect(() => {
    if (open) {
      setFormData(initialData);
      setErrors({});
    }
  }, [open, initialData]);

  // Efecto para actualizar la moneda cuando cambia la cuenta
  useEffect(() => {
    if (formData.cuenta) {
      const selectedCuenta = relatedData?.cuenta?.find(c => c.id === formData.cuenta);
      if (selectedCuenta?.moneda) {
        setFormData(prev => ({
          ...prev,
          moneda: selectedCuenta.moneda.id
        }));
      }
    }
  }, [formData.cuenta, relatedData?.cuenta]);

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
        cuenta: selectedCuenta?._id || selectedCuenta?.id // Aseguramos enviar el ID correcto
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

  const selectedCuenta = useMemo(() => {
    if (!formData.cuenta || !relatedData?.cuenta) return null;
    
    const cuenta = relatedData.cuenta.find(c => 
      c._id === formData.cuenta || 
      c.id === formData.cuenta
    );
    
    console.log('Buscando cuenta:', {
      cuentaId: formData.cuenta,
      cuentasDisponibles: relatedData.cuenta,
      cuentaEncontrada: cuenta
    });
    
    return cuenta;
  }, [formData.cuenta, relatedData?.cuenta]);

  return (
    <StyledDialog
      open={open}
      onClose={!isSaving ? onClose : undefined}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            {isEditing ? 'Editar Transacción' : 'Nueva Transacción'}
          </Typography>
          <IconButton onClick={onClose} disabled={isSaving}>
            <CloseIcon />
          </IconButton>
        </Box>
        {isSaving && <LinearProgress sx={{ mt: 1 }} />}
      </DialogTitle>

      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {/* Tipo de Transacción */}
          <Box sx={{ mb: 3 }}>
            <ToggleButtonGroup
              value={formData.tipo}
              exclusive
              onChange={(_, value) => value && handleChange('tipo', value)}
              fullWidth
              sx={{ height: '48px' }}
            >
              <StyledToggleButton value="INGRESO">
                <AddIcon />
                <Typography variant="subtitle2">Ingreso</Typography>
              </StyledToggleButton>
              <StyledToggleButton value="EGRESO">
                <RemoveIcon />
                <Typography variant="subtitle2">Egreso</Typography>
              </StyledToggleButton>
            </ToggleButtonGroup>
            {errors.tipo && (
              <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                {errors.tipo}
              </Typography>
            )}
          </Box>

          {/* Monto y Estado */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              label="Monto"
              value={formData.monto || ''}
              onChange={handleMontoChange}
              error={!!errors.monto}
              helperText={errors.monto}
              InputProps={{
                startAdornment: selectedCuenta && (
                  <InputAdornment position="start">
                    {selectedCuenta.moneda?.simbolo}
                  </InputAdornment>
                )
              }}
            />
            <ToggleButtonGroup
              value={formData.estado}
              exclusive
              onChange={(_, value) => value && handleChange('estado', value)}
            >
              <ToggleButton value="PAGADO" color="success">
                <CheckCircleIcon />
                <Typography variant="caption" sx={{ ml: 1 }}>Pagado</Typography>
              </ToggleButton>
              <ToggleButton value="PENDIENTE" color="warning">
                <PendingIcon />
                <Typography variant="caption" sx={{ ml: 1 }}>Pendiente</Typography>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Descripción */}
          <TextField
            fullWidth
            label="Descripción"
            value={formData.descripcion || ''}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            error={!!errors.descripcion}
            helperText={errors.descripcion}
            sx={{ mb: 3 }}
          />

          {/* Cuenta */}
          <Autocomplete
            value={selectedCuenta}
            onChange={(_, newValue) => {
              console.log('Nueva cuenta seleccionada:', newValue);
              handleChange('cuenta', newValue?.id || newValue?._id);
            }}
            options={relatedData?.cuenta || []}
            getOptionLabel={(option) => `${option?.nombre || ''} - ${option?.tipo || ''}`}
            loading={isLoadingRelated}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Cuenta"
                error={!!errors.cuenta}
                helperText={errors.cuenta}
              />
            )}
            isOptionEqualToValue={(option, value) => 
              (option?.id === value?.id) || 
              (option?._id === value?._id) ||
              (option?.id === value?._id) ||
              (option?._id === value?.id)
            }
            renderOption={(props, option) => (
              <li {...props}>
                <Box>
                  <Typography>{option.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.moneda?.simbolo} - {option.tipo}
                  </Typography>
                </Box>
              </li>
            )}
          />

          {/* Categorías */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ mr: 1 }}>
                Categoría
              </Typography>
              {formData.categoria && (
                <Typography variant="body2" color="text.secondary">
                  - {formData.categoria}
                </Typography>
              )}
            </Box>
            <Paper 
              sx={{ 
                p: 2, 
                bgcolor: 'background.paper',
                border: t => `1px solid ${t.palette.divider}`
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                gap: 1.5, 
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                {CATEGORIAS.map((categoria) => (
                  <CategoryChip
                    key={categoria.valor}
                    icon={categoria.icon}
                    onClick={() => handleChange('categoria', categoria.valor)}
                    color={formData.categoria === categoria.valor ? 'primary' : 'default'}
                    variant={formData.categoria === categoria.valor ? 'filled' : 'outlined'}
                    sx={{ 
                      '&.MuiChip-filled': {
                        backgroundColor: categoria.color,
                        color: '#fff'
                      },
                      '&:hover': {
                        backgroundColor: `${categoria.color}22`,
                        '& .MuiSvgIcon-root': {
                          color: categoria.color
                        }
                      },
                      '& .MuiSvgIcon-root': {
                        transition: 'color 0.2s ease'
                      }
                    }}
                  />
                ))}
              </Box>
            </Paper>
            {errors.categoria && (
              <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                {errors.categoria}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={onClose} 
          disabled={isSaving}
          sx={{ borderRadius: 0 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSaving}
          sx={{ borderRadius: 0 }}
        >
          {isSaving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default TransaccionForm; 