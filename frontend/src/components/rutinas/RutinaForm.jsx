import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  IconButton,
  Stack,
  useTheme,
  useMediaQuery,
  TextField,
  CircularProgress
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

// Importar los mismos iconos que RutinaTable
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined';
import BathtubIcon from '@mui/icons-material/Bathtub';
import Face4OutlinedIcon from '@mui/icons-material/Face4Outlined';
import Face4Icon from '@mui/icons-material/Face4';
import NightlightOutlinedIcon from '@mui/icons-material/NightlightOutlined';
import NightlightIcon from '@mui/icons-material/Nightlight';
import SanitizerOutlinedIcon from '@mui/icons-material/SanitizerOutlined';
import SanitizerIcon from '@mui/icons-material/Sanitizer';
import RestaurantMenuOutlinedIcon from '@mui/icons-material/RestaurantMenuOutlined';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import BlenderOutlinedIcon from '@mui/icons-material/BlenderOutlined';
import BlenderIcon from '@mui/icons-material/Blender';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import MedicationIcon from '@mui/icons-material/Medication';
import SelfImprovementOutlinedIcon from '@mui/icons-material/SelfImprovementOutlined';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import DirectionsRunOutlinedIcon from '@mui/icons-material/DirectionsRunOutlined';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DirectionsBikeOutlinedIcon from '@mui/icons-material/DirectionsBikeOutlined';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import BedOutlinedIcon from '@mui/icons-material/BedOutlined';
import BedIcon from '@mui/icons-material/Bed';
import LocalDiningOutlinedIcon from '@mui/icons-material/LocalDiningOutlined';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import CleaningServicesOutlinedIcon from '@mui/icons-material/CleaningServicesOutlined';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import LocalLaundryServiceOutlinedIcon from '@mui/icons-material/LocalLaundryServiceOutlined';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';

const iconConfig = {
  bodyCare: {
    bath: { outlined: BathtubOutlinedIcon, filled: BathtubIcon, tooltip: 'Baño' },
    skinCareDay: { outlined: Face4OutlinedIcon, filled: Face4Icon, tooltip: 'Skin Care Día' },
    skinCareNight: { outlined: NightlightOutlinedIcon, filled: NightlightIcon, tooltip: 'Skin Care Noche' },
    bodyCream: { outlined: SanitizerOutlinedIcon, filled: SanitizerIcon, tooltip: 'Crema Corporal' }
  },
  nutricion: {
    cocinar: { outlined: RestaurantMenuOutlinedIcon, filled: RestaurantMenuIcon, tooltip: 'Cocinar' },
    agua: { outlined: WaterDropOutlinedIcon, filled: WaterDropIcon, tooltip: 'Agua' },
    protein: { outlined: BlenderOutlinedIcon, filled: BlenderIcon, tooltip: 'Proteína' },
    meds: { outlined: MedicationOutlinedIcon, filled: MedicationIcon, tooltip: 'Medicamentos' }
  },
  ejercicio: {
    meditate: { outlined: SelfImprovementOutlinedIcon, filled: SelfImprovementIcon, tooltip: 'Meditar' },
    stretching: { outlined: DirectionsRunOutlinedIcon, filled: DirectionsRunIcon, tooltip: 'Stretching' },
    gym: { outlined: FitnessCenterOutlinedIcon, filled: FitnessCenterIcon, tooltip: 'Gym' },
    cardio: { outlined: DirectionsBikeOutlinedIcon, filled: DirectionsBikeIcon, tooltip: 'Cardio' }
  },
  cleaning: {
    bed: { outlined: BedOutlinedIcon, filled: BedIcon, tooltip: 'Hacer la Cama' },
    platos: { outlined: LocalDiningOutlinedIcon, filled: LocalDiningIcon, tooltip: 'Lavar los Platos' },
    piso: { outlined: CleaningServicesOutlinedIcon, filled: CleaningServicesIcon, tooltip: 'Limpiar el Piso' },
    ropa: { outlined: LocalLaundryServiceOutlinedIcon, filled: LocalLaundryServiceIcon, tooltip: 'Lavar la Ropa' }
  }
};

const defaultFormData = {
  fecha: new Date().toISOString().split('T')[0],
  bodyCare: {
    bath: false,
    skinCareDay: false,
    skinCareNight: false,
    bodyCream: false
  },
  nutricion: {
    cocinar: false,
    agua: false,
    protein: false,
    meds: false
  },
  ejercicio: {
    meditate: false,
    stretching: false,
    gym: false,
    cardio: false
  },
  cleaning: {
    bed: false,
    platos: false,
    piso: false,
    ropa: false
  }
};

const ChecklistSection = ({ title, items, onChange, section }) => {
  // Filtrar solo los items que tienen iconos configurados
  const validItems = Object.entries(items).filter(([key]) => 
    iconConfig[section] && iconConfig[section][key]
  );

  return (
    <Box sx={{ mb: 3 }}>
      <Typography 
        variant="subtitle2" 
        color="text.secondary" 
        sx={{ 
          mb: 1,
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase'
        }}
      >
        {title}
      </Typography>
      <Stack 
        direction="row" 
        spacing={0.5}
        flexWrap="wrap" 
        useFlexGap 
        sx={{ 
          gap: 0.5,
          '& > *': { 
            minWidth: 32,
            height: 32
          }
        }}
      >
        {validItems.map(([key, value]) => {
          const IconOutlined = iconConfig[section][key].outlined;
          const IconFilled = iconConfig[section][key].filled;
          const tooltip = iconConfig[section][key].tooltip;

          return (
            <IconButton
              key={key}
              onClick={() => onChange(section, key, !value)}
              color={value ? 'primary' : 'default'}
              size="small"
              title={tooltip}
              sx={{ 
                p: 0.5,
                color: value ? 'primary.main' : 'text.disabled',
                '& .MuiSvgIcon-root': {
                  fontSize: '1.25rem'
                },
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: value ? 'primary.dark' : 'text.primary'
                }
              }}
            >
              {value ? <IconFilled /> : <IconOutlined />}
            </IconButton>
          );
        })}
      </Stack>
    </Box>
  );
};

export const RutinaForm = ({ 
  open, 
  onClose, 
  onSubmit, 
  initialData 
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [fechaError, setFechaError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const [formData, setFormData] = React.useState(() => {
    if (!initialData) return defaultFormData;
    
    return {
      ...defaultFormData,
      ...initialData,
      fecha: initialData.fecha ? new Date(initialData.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      bodyCare: { ...defaultFormData.bodyCare, ...(initialData.bodyCare || {}) },
      nutricion: { ...defaultFormData.nutricion, ...(initialData.nutricion || {}) },
      ejercicio: { ...defaultFormData.ejercicio, ...(initialData.ejercicio || {}) },
      cleaning: { ...defaultFormData.cleaning, ...(initialData.cleaning || {}) }
    };
  });

  React.useEffect(() => {
    if (open) {
      setFechaError('');
      if (!initialData) {
        setFormData(defaultFormData);
      } else {
        setFormData({
          ...defaultFormData,
          ...initialData,
          fecha: initialData.fecha ? new Date(initialData.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          bodyCare: { ...defaultFormData.bodyCare, ...(initialData.bodyCare || {}) },
          nutricion: { ...defaultFormData.nutricion, ...(initialData.nutricion || {}) },
          ejercicio: { ...defaultFormData.ejercicio, ...(initialData.ejercicio || {}) },
          cleaning: { ...defaultFormData.cleaning, ...(initialData.cleaning || {}) }
        });
      }
    }
  }, [open, initialData]);

  const handleSectionChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleDateChange = async (event) => {
    const newDate = event.target.value;
    setFormData(prev => ({
      ...prev,
      fecha: newDate
    }));
    
    // Limpiar error previo
    setFechaError('');
    
    // Si estamos editando una rutina existente y la fecha no cambió, no validamos
    if (initialData?._id) {
      const fechaOriginal = new Date(initialData.fecha).toISOString().split('T')[0];
      if (fechaOriginal === newDate) {
        return;
      }
    }
    
    // Verificar si ya existe rutina para esta fecha
    try {
      setIsValidating(true);
      const response = await clienteAxios.get('/api/rutinas/verify', {
        params: { fecha: newDate }
      });
      
      if (response.data.exists) {
        setFechaError(`Ya existe una rutina para esta fecha (ID: ${response.data.rutinaId})`);
      }
    } catch (error) {
      console.error('Error al verificar fecha:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async () => {
    // Verificar si hay error de fecha
    if (fechaError) {
      return;
    }
    
    // Verificar una última vez antes de enviar
    if (!initialData?._id) {
      try {
        setIsValidating(true);
        const response = await clienteAxios.get('/api/rutinas/verify', {
          params: { fecha: formData.fecha }
        });
        
        if (response.data.exists) {
          setFechaError('Ya existe una rutina para esta fecha');
          setIsValidating(false);
          return;
        }
        setIsValidating(false);
      } catch (error) {
        console.error('Error al verificar fecha:', error);
        setIsValidating(false);
      }
    }
    
    try {
      const dataToSubmit = {
        ...formData,
        fecha: new Date(formData.fecha)
      };

      let response;
      if (initialData?._id) {
        dataToSubmit._id = initialData._id;
        response = await clienteAxios.put(`/api/rutinas/${initialData._id}`, dataToSubmit);
      } else {
        response = await clienteAxios.post('/api/rutinas', dataToSubmit);
      }

      // Solo llamar a onSubmit si la petición fue exitosa
      onSubmit(response.data);
    } catch (error) {
      console.error('Error al guardar rutina:', error);
      // Si es un error de conflicto, actualizar el mensaje de error
      if (error.response?.status === 409) {
        setFechaError('Ya existe una rutina para esta fecha');
      }
      // Re-lanzar el error para que sea manejado por el componente padre
      throw error;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: 0
        }
      }}
    >
      <DialogTitle>
        {initialData?._id ? 'Editar Rutina' : 'Nueva Rutina'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            type="date"
            label="Fecha"
            value={formData.fecha}
            onChange={handleDateChange}
            fullWidth
            variant="outlined"
            sx={{ mb: 1 }}
            error={!!fechaError}
            helperText={fechaError}
            InputLabelProps={{
              shrink: true
            }}
            disabled={isValidating}
          />
          {isValidating && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Verificando disponibilidad de fecha...
              </Typography>
            </Box>
          )}
          {fechaError && fechaError.includes('ID:') && (
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <InfoIcon color="warning" fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2" color="error">
                Esta fecha ya tiene una rutina. 
                <Button 
                  color="primary" 
                  size="small" 
                  sx={{ ml: 1 }}
                  onClick={() => {
                    // Extraer el ID de la rutina existente
                    const idMatch = fechaError.match(/ID: ([a-f0-9]+)/i);
                    if (idMatch && idMatch[1]) {
                      // Cerrar este diálogo
                      onClose();
                      // Obtener la rutina existente para editar
                      clienteAxios.get(`/api/rutinas/${idMatch[1]}`)
                        .then(response => {
                          // Abrir el formulario de edición con la rutina existente
                          window.dispatchEvent(new CustomEvent('editRutina', {
                            detail: { rutina: response.data }
                          }));
                        })
                        .catch(err => {
                          console.error('Error al obtener rutina existente:', err);
                        });
                    }
                  }}
                >
                  Editar rutina existente
                </Button>
              </Typography>
            </Box>
          )}
          <ChecklistSection 
            title="Body Care" 
            items={formData.bodyCare} 
            section="bodyCare"
            onChange={handleSectionChange} 
          />
          <ChecklistSection 
            title="Nutrición" 
            items={formData.nutricion} 
            section="nutricion"
            onChange={handleSectionChange} 
          />
          <ChecklistSection 
            title="Ejercicio" 
            items={formData.ejercicio} 
            section="ejercicio"
            onChange={handleSectionChange} 
          />
          <ChecklistSection 
            title="Cleaning" 
            items={formData.cleaning} 
            section="cleaning"
            onChange={handleSectionChange} 
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          sx={{ borderRadius: 0 }}
          disabled={!!fechaError || isValidating}
        >
          {initialData?._id ? 'Actualizar' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 