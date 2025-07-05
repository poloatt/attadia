import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Box,
  Typography,
  FormControlLabel,
  Switch,
  IconButton,
  TextField,
  Autocomplete,
  InputAdornment,
  LinearProgress,
  Paper,
  Chip,
  useTheme
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  Close as CloseIcon,
  AttachMoney,
  CalendarToday,
  Description,
  Home,
  Person,
  MeetingRoom,
  Engineering,
  Info as InfoIcon,
  House,
  Apartment,
  Business,
  Warehouse,
  LocationOn
} from '@mui/icons-material';
import EntityDateSelect from '../EntityViews/EntityDateSelect';
import { CircularProgress } from '@mui/material';
import ContratoMantenimientoSection from './ContratoMantenimientoSection';
import ContratoPropiedadSection from './ContratoPropiedadSection';
import ContratoHabitacionSection from './ContratoHabitacionSection';
import ContratoFechasSection from './ContratoFechasSection';
import ContratoInquilinosSection from './ContratoInquilinosSection';
import ContratoMontosSection from './ContratoMontosSection';
import clienteAxios from '../../config/axios';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 0,
    backgroundColor: theme.palette.background.default,
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

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 0,
    backgroundColor: alpha(theme.palette.background.paper, 0.9),
    '& fieldset': {
      borderColor: theme.palette.divider
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.2)'
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main
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

const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: '0.875rem',
  fontWeight: 500,
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  '& .MuiSvgIcon-root': {
    fontSize: '1.2rem',
    color: theme.palette.primary.main
  }
}));

const FormSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2)
}));

const CategoryChip = styled(Chip)(({ theme, customcolor }) => ({
  borderRadius: 0,
  height: 40,
  minWidth: 40,
  padding: 0,
  transition: 'all 0.2s ease',
  backgroundColor: 'transparent',
  border: 'none',
  color: theme.palette.text.secondary,
  '& .MuiChip-icon': {
    margin: 0,
    fontSize: '1.25rem',
    transition: 'all 0.2s ease'
  },
  '& .MuiChip-label': {
    display: 'none',
    transition: 'all 0.2s ease',
    padding: theme.spacing(0, 1),
    color: theme.palette.text.secondary
  },
  '&:hover': {
    backgroundColor: 'transparent',
    '& .MuiChip-label': {
      display: 'block'
    },
    '& .MuiChip-icon': {
      color: customcolor
    }
  },
  '&.selected': {
    backgroundColor: 'transparent',
    '& .MuiChip-icon': {
      color: customcolor
    },
    '& .MuiChip-label': {
      display: 'block'
    }
  }
}));

const TIPOS_PROPIEDAD = [
  { valor: 'CASA', icon: <House />, label: 'Casa', color: '#4caf50' },
  { valor: 'DEPARTAMENTO', icon: <Apartment />, label: 'Departamento', color: '#2196f3' },
  { valor: 'OFICINA', icon: <Business />, label: 'Oficina', color: '#9c27b0' },
  { valor: 'LOCAL', icon: <Warehouse />, label: 'Local', color: '#ff9800' },
  { valor: 'TERRENO', icon: <LocationOn />, label: 'Terreno', color: '#795548' }
];

const TIPO_ALQUILER = [
  { valor: false, icon: <Home />, label: 'Propiedad', color: '#4caf50' },
  { valor: true, icon: <MeetingRoom />, label: 'Habitación', color: '#2196f3' }
];

const ContratoForm = ({
  initialData = {},
  relatedData = {},
  onSubmit,
  onClose,
  isSaving = false
}) => {
  const theme = useTheme();
  
  // Asegurar que initialData no sea null
  const safeInitialData = initialData || {};
  
  const [formData, setFormData] = useState({
    inquilino: safeInitialData.inquilino || [],
    propiedad: safeInitialData.propiedad?._id || safeInitialData.propiedad || '',
    esPorHabitacion: safeInitialData.esPorHabitacion || false,
    habitacion: safeInitialData.habitacion?._id || safeInitialData.habitacion || '',
    fechaInicio: safeInitialData.fechaInicio ? new Date(safeInitialData.fechaInicio) : null,
    fechaFin: safeInitialData.fechaFin ? new Date(safeInitialData.fechaFin) : null,
    montoMensual: safeInitialData.montoMensual?.toString() || '0',
    cuenta: safeInitialData.cuenta?._id || safeInitialData.cuenta || '',
    deposito: safeInitialData.deposito?.toString() || '0',
    observaciones: safeInitialData.observaciones || '',
    documentoUrl: safeInitialData.documentoUrl || '',
    esMantenimiento: safeInitialData.esMantenimiento || false,
    estado: safeInitialData.estado || 'PLANEADO',
    tipoContrato: safeInitialData.tipoContrato || 'ALQUILER'
  });

  const [errors, setErrors] = useState({});
  const [selectedPropiedad, setSelectedPropiedad] = useState(null);
  const [selectedHabitacion, setSelectedHabitacion] = useState(null);
  const [selectedInquilinos, setSelectedInquilinos] = useState([]);
  const [selectedCuenta, setSelectedCuenta] = useState(null);

  useEffect(() => {
    console.log('initialData en ContratoForm:', safeInitialData);
    console.log('relatedData en ContratoForm:', {
      propiedades: relatedData.propiedades?.length || 0,
      habitaciones: relatedData.habitaciones?.length || 0,
      inquilinos: relatedData.inquilinos?.length || 0,
      cuentas: relatedData.cuentas?.length || 0
    });
    console.log('Cuenta en initialData:', safeInitialData.cuenta);
    
    // --- Propiedad ---
    let propiedadObj = null;
    if (relatedData.propiedades?.length > 0 && safeInitialData.propiedad) {
      propiedadObj = relatedData.propiedades.find(p =>
        p._id === (safeInitialData.propiedad?._id || safeInitialData.propiedad || safeInitialData.propiedad?.id)
      );
      setSelectedPropiedad(propiedadObj || null);
    }

    // --- Cuenta ---
    let cuentaObj = null;
    if (relatedData.cuentas?.length > 0 && safeInitialData.cuenta) {
      const cuentaId = typeof safeInitialData.cuenta === 'object' ? safeInitialData.cuenta._id || safeInitialData.cuenta.id : safeInitialData.cuenta;
      cuentaObj = relatedData.cuentas.find(c => c._id === cuentaId || c.id === cuentaId);
      setSelectedCuenta(cuentaObj || null);
    }

    // --- Inquilinos ---
    if (relatedData.inquilinos?.length > 0 && safeInitialData.inquilino) {
      const inquilinos = Array.isArray(safeInitialData.inquilino) ? safeInitialData.inquilino : [safeInitialData.inquilino];
      const selectedInqs = inquilinos
        .map(inqId => relatedData.inquilinos.find(i => 
          i._id === (typeof inqId === 'object' ? inqId._id : inqId)
        ))
        .filter(Boolean);
      setSelectedInquilinos(selectedInqs);
    }

    // --- Habitacion ---
    if (relatedData.habitaciones?.length > 0 && safeInitialData.habitacion) {
      const habitacion = relatedData.habitaciones.find(h =>
        h._id === (safeInitialData.habitacion?._id || safeInitialData.habitacion)
      );
      setSelectedHabitacion(habitacion || null);
    }

    // --- Setear formData con los valores correctos ---
        setFormData(prev => ({
          ...prev,
      propiedad: propiedadObj?._id || propiedadObj?.id || '',
      cuenta: cuentaObj?._id || cuentaObj?.id || '',
      montoMensual: safeInitialData.montoMensual?.toString() || propiedadObj?.precio?.toString() || '0',
      deposito: safeInitialData.deposito?.toString() || propiedadObj?.deposito?.toString() || (propiedadObj?.precio ? (propiedadObj.precio * 2).toString() : '0'),
      inquilino: (Array.isArray(safeInitialData.inquilino) ? safeInitialData.inquilino : [safeInitialData.inquilino]).map(i => typeof i === 'object' ? i._id : i)
    }));
  }, [safeInitialData, relatedData]);

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleMantenimientoChange = (esMantenimiento) => {
    setFormData(prev => ({
      ...prev,
      esMantenimiento,
      tipoContrato: esMantenimiento ? 'MANTENIMIENTO' : 'ALQUILER',
      montoMensual: esMantenimiento ? '0' : prev.montoMensual,
      inquilino: esMantenimiento ? [] : prev.inquilino
    }));
    setSelectedInquilinos([]);
  };

  const handlePropiedadChange = (newValue) => {
    setSelectedPropiedad(newValue);
    handleChange('propiedad', newValue?._id || newValue?.id || '');
    setSelectedHabitacion(null);
    handleChange('habitacion', '');
  };

  const handleTipoAlquilerChange = (valor) => {
    handleChange('esPorHabitacion', valor);
    if (!valor) {
      setSelectedHabitacion(null);
      handleChange('habitacion', '');
    }
  };

  const handleHabitacionChange = (newValue) => {
    setSelectedHabitacion(newValue);
    handleChange('habitacion', newValue?._id || newValue?.id || '');
  };

  const handleInquilinosChange = (newValue) => {
    setSelectedInquilinos(newValue);
    handleChange('inquilino', newValue.map(inq => inq._id));
  };

  const handleCuentaChange = (newValue) => {
    setSelectedCuenta(newValue);
    handleChange('cuenta', newValue?._id || newValue?.id || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Iniciando submit con datos:', formData);
    console.log('Cuenta seleccionada:', selectedCuenta);
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      console.log('Errores de validación encontrados:', validationErrors);
      setErrors(validationErrors);
      return;
    }

    try {
      // Preparar datos para envío
      const dataToSubmit = {
        ...formData,
        propiedad: formData.propiedad || null,
        habitacion: formData.habitacion || null,
        inquilino: formData.esMantenimiento ? null : (formData.inquilino || []),
        cuenta: formData.cuenta || (selectedCuenta ? selectedCuenta._id : null),
        montoMensual: formData.esMantenimiento ? 0 : parseFloat(formData.montoMensual || 0),
        deposito: parseFloat(formData.deposito || 0),
        fechaInicio: formData.fechaInicio?.toISOString(),
        fechaFin: formData.fechaFin?.toISOString(),
        esMantenimiento: Boolean(formData.esMantenimiento),
        observaciones: formData.observaciones || '',
        documentoUrl: formData.documentoUrl || '',
        tipoContrato: formData.tipoContrato
      };
      delete dataToSubmit.estado;

      // Validar fechas antes de enviar
      if (!dataToSubmit.fechaInicio || !dataToSubmit.fechaFin) {
        throw new Error('Las fechas son requeridas');
      }

      // Asegurarse de que la cuenta esté presente si no es un contrato de mantenimiento
      if (!dataToSubmit.esMantenimiento && !dataToSubmit.cuenta) {
        if (initialData.cuenta) {
          dataToSubmit.cuenta = typeof initialData.cuenta === 'object' ? initialData.cuenta._id : initialData.cuenta;
        }
      }

      // Eliminar campos null o undefined
      Object.keys(dataToSubmit).forEach(key => {
        if (dataToSubmit[key] === null || dataToSubmit[key] === undefined) {
          delete dataToSubmit[key];
        }
      });

      console.log('Datos preparados para envío:', dataToSubmit);
      
      // Usar onSubmit para enviar los datos al componente padre
      await onSubmit(dataToSubmit);
      onClose(); // Cerrar el formulario después de enviar exitosamente
    } catch (error) {
      console.error('Error en submit:', error);
      setErrors(prev => ({
        ...prev,
        submit: error.message || 'Error al guardar el contrato'
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Validar fechas
    if (!formData.fechaInicio) {
      newErrors.fechaInicio = 'La fecha de inicio es requerida';
    }
    if (!formData.fechaFin) {
      newErrors.fechaFin = 'La fecha de fin es requerida';
    }
    if (formData.fechaInicio && formData.fechaFin && formData.fechaInicio > formData.fechaFin) {
      newErrors.fechaFin = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }

    // Validar propiedad o habitación
    if (!formData.propiedad) {
      newErrors.propiedad = 'La propiedad es requerida';
    }
    if (formData.esPorHabitacion && !formData.habitacion) {
      newErrors.habitacion = 'La habitación es requerida';
    }

    // Validar inquilinos
    if (!formData.esMantenimiento && (!formData.inquilino || formData.inquilino.length === 0)) {
      newErrors.inquilino = 'Debe seleccionar al menos un inquilino';
    }

    // Validar montos
    if (!formData.esMantenimiento) {
      if (!formData.montoMensual || parseFloat(formData.montoMensual) <= 0) {
        newErrors.montoMensual = 'El monto mensual debe ser mayor a 0';
      }
      if (!formData.deposito || parseFloat(formData.deposito) <= 0) {
        newErrors.deposito = 'El depósito debe ser mayor a 0';
      }
    }

    // Validar cuenta
    if (!formData.cuenta) {
      newErrors.cuenta = 'La cuenta es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <StyledDialog
      open={true}
      onClose={!isSaving ? onClose : undefined}
      maxWidth="md"
      fullWidth
      fullScreen={window.innerWidth < 600}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%'
      }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 2,
          borderBottom: t => `1px solid ${t.palette.divider}`,
          bgcolor: 'background.paper'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {formData.esMantenimiento ? (
              <Engineering sx={{ color: 'warning.main' }} />
            ) : (
              <Description sx={{ color: 'primary.main' }} />
            )}
            <Typography variant="h6">
              {initialData._id ? 'Editar Contrato' : 'Nuevo Contrato'}
            </Typography>
          </Box>
          <IconButton 
            onClick={onClose} 
            disabled={isSaving} 
            sx={{ 
              borderRadius: 0,
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Progress bar */}
        {isSaving && (
          <LinearProgress 
            sx={{ 
              height: 2,
              '& .MuiLinearProgress-bar': {
                transition: 'transform 0.2s linear'
              }
            }} 
          />
        )}

        {/* Content */}
        <DialogContent sx={{ 
          p: 3,
          bgcolor: 'background.default',
          flex: 1,
          overflowY: 'auto'
        }}>
          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            id="contrato-form"
            sx={{ display: 'flex', flexDirection: 'column' }}
          >


            <ContratoMantenimientoSection
              formData={formData}
              onChange={handleMantenimientoChange}
              theme={theme}
            />

            <ContratoPropiedadSection
              formData={formData}
              selectedPropiedad={selectedPropiedad}
              onPropiedadChange={handlePropiedadChange}
              onTipoAlquilerChange={handleTipoAlquilerChange}
              relatedData={relatedData}
              errors={errors}
            />

            <ContratoHabitacionSection
              selectedHabitacion={selectedHabitacion}
              onHabitacionChange={handleHabitacionChange}
              relatedData={relatedData}
              formData={formData}
              errors={errors}
            />

            <ContratoFechasSection
              formData={formData}
              onFechaChange={handleChange}
              errors={errors}
            />

            {!formData.esMantenimiento && (
              <>
                <ContratoInquilinosSection
                  selectedInquilinos={selectedInquilinos}
                  onInquilinosChange={handleInquilinosChange}
                  relatedData={relatedData}
                  errors={errors}
                />

                <ContratoMontosSection
                  formData={formData}
                  selectedCuenta={selectedCuenta}
                  onCuentaChange={handleCuentaChange}
                  onMontoChange={handleChange}
                  relatedData={relatedData}
                  errors={errors}
                />
              </>
            )}
          </Box>
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{ 
          p: 2,
          bgcolor: 'background.paper',
          borderTop: t => `1px solid ${t.palette.divider}`,
          gap: 1
        }}>
          <Button 
            onClick={onClose} 
            disabled={isSaving}
            sx={{ 
              borderRadius: 0,
              minWidth: 100
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="contrato-form"
            variant="contained"
            disabled={isSaving}
            sx={{ 
              borderRadius: 0,
              minWidth: 100,
              position: 'relative'
            }}
          >
            {isSaving ? (
              <>
                <CircularProgress 
                  size={16} 
                  sx={{ 
                    position: 'absolute',
                    left: '50%',
                    marginLeft: '-12px'
                  }}
                />
                <Box sx={{ opacity: 0 }}>
                  {initialData._id ? 'Actualizar' : 'Crear'}
                </Box>
              </>
            ) : (
              initialData._id ? 'Actualizar' : 'Crear'
            )}
          </Button>
        </DialogActions>
      </Box>
    </StyledDialog>
  );
};

export default ContratoForm; 