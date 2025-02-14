import React from 'react';
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
  TextField
} from '@mui/material';

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
  weight: '',
  muscle: '',
  fatPercent: '',
  stress: '',
  sleep: '',
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

  const [formData, setFormData] = React.useState(() => {
    if (!initialData) return defaultFormData;
    
    return {
      ...defaultFormData,
      ...initialData,
      bodyCare: { ...defaultFormData.bodyCare, ...(initialData.bodyCare || {}) },
      nutricion: { ...defaultFormData.nutricion, ...(initialData.nutricion || {}) },
      ejercicio: { ...defaultFormData.ejercicio, ...(initialData.ejercicio || {}) },
      cleaning: { ...defaultFormData.cleaning, ...(initialData.cleaning || {}) }
    };
  });

  React.useEffect(() => {
    if (open) {
      if (!initialData) {
        setFormData(defaultFormData);
      } else {
        setFormData({
          ...defaultFormData,
          ...initialData,
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

  const handleSubmit = () => {
    const dataToSubmit = {
      ...formData
    };

    if (initialData?._id) {
      dataToSubmit._id = initialData._id;
    }

    onSubmit(dataToSubmit);
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
          <Stack spacing={2} sx={{ mb: 3 }}>
            <TextField
              label="Fecha"
              type="date"
              value={formData.fecha ? new Date(formData.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData(prev => ({ ...prev, fecha: new Date(e.target.value) }))}
              required
              fullWidth
              variant="standard"
              sx={{
                '& .MuiInput-input': {
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'text.secondary',
                  cursor: 'pointer',
                  '&:hover': {
                    color: 'primary.main'
                  }
                }
              }}
              InputProps={{
                disableUnderline: true
              }}
              InputLabelProps={{
                shrink: true,
                sx: {
                  color: 'text.secondary',
                  fontSize: '0.875rem'
                }
              }}
            />
            <TextField
              label="Peso (kg)"
              type="number"
              value={formData.weight}
              onChange={(e) => setFormData(prev => ({ ...prev, weight: Number(e.target.value) }))}
              required
              fullWidth
              inputProps={{ step: "0.1" }}
            />
            <TextField
              label="Músculo (%)"
              type="number"
              value={formData.muscle}
              onChange={(e) => setFormData(prev => ({ ...prev, muscle: Number(e.target.value) }))}
              required
              fullWidth
              inputProps={{ step: "0.1" }}
            />
            <TextField
              label="Grasa (%)"
              type="number"
              value={formData.fatPercent}
              onChange={(e) => setFormData(prev => ({ ...prev, fatPercent: Number(e.target.value) }))}
              required
              fullWidth
              inputProps={{ step: "0.1" }}
            />
            <TextField
              label="Estrés (1-10)"
              type="number"
              value={formData.stress}
              onChange={(e) => setFormData(prev => ({ ...prev, stress: Number(e.target.value) }))}
              required
              fullWidth
              inputProps={{ min: "1", max: "10", step: "1" }}
            />
            <TextField
              label="Horas de sueño"
              type="number"
              value={formData.sleep}
              onChange={(e) => setFormData(prev => ({ ...prev, sleep: Number(e.target.value) }))}
              required
              fullWidth
              inputProps={{ step: "0.5" }}
            />
          </Stack>
          
          <ChecklistSection
            title="Body Care"
            items={formData.bodyCare}
            section="bodyCare"
            onChange={handleSectionChange}
          />
          <Divider />
          
          <ChecklistSection
            title="Nutrición"
            items={formData.nutricion}
            section="nutricion"
            onChange={handleSectionChange}
          />
          <Divider />
          
          <ChecklistSection
            title="Ejercicio"
            items={formData.ejercicio}
            section="ejercicio"
            onChange={handleSectionChange}
          />
          <Divider />
          
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
        >
          {initialData?._id ? 'Actualizar' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 