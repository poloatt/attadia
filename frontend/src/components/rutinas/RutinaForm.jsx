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
import WbTwilightOutlinedIcon from '@mui/icons-material/WbTwilightOutlined';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import FaceOutlinedIcon from '@mui/icons-material/FaceOutlined';
import FaceIcon from '@mui/icons-material/Face';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import MedicationIcon from '@mui/icons-material/Medication';
import SanitizerOutlinedIcon from '@mui/icons-material/SanitizerOutlined';
import SanitizerIcon from '@mui/icons-material/Sanitizer';
import LocalDiningOutlinedIcon from '@mui/icons-material/LocalDiningOutlined';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import CleaningServicesOutlinedIcon from '@mui/icons-material/CleaningServicesOutlined';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import LocalLaundryServiceOutlinedIcon from '@mui/icons-material/LocalLaundryServiceOutlined';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';
import DirectionsRunOutlinedIcon from '@mui/icons-material/DirectionsRunOutlined';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import SelfImprovementOutlinedIcon from '@mui/icons-material/SelfImprovementOutlined';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import BlenderOutlinedIcon from '@mui/icons-material/BlenderOutlined';
import BlenderIcon from '@mui/icons-material/Blender';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import SpaIcon from '@mui/icons-material/Spa';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import LunchDiningOutlinedIcon from '@mui/icons-material/LunchDiningOutlined';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import NightsStayOutlinedIcon from '@mui/icons-material/NightsStayOutlined';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined';
import BathtubIcon from '@mui/icons-material/Bathtub';

const iconConfig = {
  morning: {
    wakeUp: { outlined: WbTwilightOutlinedIcon, filled: WbTwilightIcon, tooltip: 'Despertar' },
    skinCareDay: { outlined: FaceOutlinedIcon, filled: FaceIcon, tooltip: 'Skincare Día' },
    meds: { outlined: MedicationOutlinedIcon, filled: MedicationIcon, tooltip: 'Medicamentos' },
    teeth: { outlined: SanitizerOutlinedIcon, filled: SanitizerIcon, tooltip: 'Dientes' }
  },
  cleaning: {
    platos: { outlined: LocalDiningOutlinedIcon, filled: LocalDiningIcon, tooltip: 'Platos' },
    piso: { outlined: CleaningServicesOutlinedIcon, filled: CleaningServicesIcon, tooltip: 'Piso' },
    ropa: { outlined: LocalLaundryServiceOutlinedIcon, filled: LocalLaundryServiceIcon, tooltip: 'Ropa' }
  },
  ejercicio: {
    cardio: { outlined: DirectionsRunOutlinedIcon, filled: DirectionsRunIcon, tooltip: 'Cardio' },
    stretching: { outlined: SelfImprovementOutlinedIcon, filled: SelfImprovementIcon, tooltip: 'Stretching' },
    gym: { outlined: FitnessCenterOutlinedIcon, filled: FitnessCenterIcon, tooltip: 'Gym' },
    protein: { outlined: BlenderOutlinedIcon, filled: BlenderIcon, tooltip: 'Proteína' },
    meditate: { outlined: SpaOutlinedIcon, filled: SpaIcon, tooltip: 'Meditar' }
  },
  cooking: {
    cocinar: { outlined: RestaurantOutlinedIcon, filled: RestaurantIcon, tooltip: 'Cocinar' },
    agua: { outlined: WaterDropOutlinedIcon, filled: WaterDropIcon, tooltip: 'Agua' },
    food: { outlined: LunchDiningOutlinedIcon, filled: LunchDiningIcon, tooltip: 'Comida' }
  },
  night: {
    skinCareNight: { outlined: NightsStayOutlinedIcon, filled: NightsStayIcon, tooltip: 'Skincare Noche' },
    bath: { outlined: BathtubOutlinedIcon, filled: BathtubIcon, tooltip: 'Baño' },
    bodyCream: { outlined: SpaOutlinedIcon, filled: SpaIcon, tooltip: 'Crema Corporal' }
  }
};

const defaultFormData = {
  weight: '',
  muscle: '',
  fatPercent: '',
  stress: '',
  sleep: '',
  morning: {
    wakeUp: false,
    skinCareDay: false,
    meds: false,
    teeth: false
  },
  cleaning: {
    platos: false,
    piso: false,
    ropa: false
  },
  ejercicio: {
    cardio: false,
    stretching: false,
    gym: false,
    protein: false,
    meditate: false
  },
  cooking: {
    cocinar: false,
    agua: false,
    food: false
  },
  night: {
    skinCareNight: false,
    bath: false,
    bodyCream: false
  }
};

const ChecklistSection = ({ title, items, onChange, section }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography 
        variant="subtitle2" 
        color="text.secondary" 
        sx={{ mb: 1 }}
      >
        {title}
      </Typography>
      <Stack 
        direction="row" 
        spacing={1} 
        flexWrap="wrap" 
        useFlexGap 
        sx={{ 
          gap: { xs: 0.5, sm: 1 },
          '& > *': { 
            minWidth: { xs: 36, sm: 40 },
            height: { xs: 36, sm: 40 }
          }
        }}
      >
        {Object.entries(items).map(([key, value]) => {
          const IconOutlined = iconConfig[section][key].outlined;
          const IconFilled = iconConfig[section][key].filled;
          const tooltip = iconConfig[section][key].tooltip;

          return (
            <IconButton
              key={key}
              onClick={() => onChange(key, !value)}
              color={value ? 'primary' : 'default'}
              size="large"
              title={tooltip}
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
      morning: { ...defaultFormData.morning, ...(initialData.morning || {}) },
      cleaning: { ...defaultFormData.cleaning, ...(initialData.cleaning || {}) },
      ejercicio: { ...defaultFormData.ejercicio, ...(initialData.ejercicio || {}) },
      cooking: { ...defaultFormData.cooking, ...(initialData.cooking || {}) },
      night: { ...defaultFormData.night, ...(initialData.night || {}) }
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
          morning: { ...defaultFormData.morning, ...(initialData.morning || {}) },
          cleaning: { ...defaultFormData.cleaning, ...(initialData.cleaning || {}) },
          ejercicio: { ...defaultFormData.ejercicio, ...(initialData.ejercicio || {}) },
          cooking: { ...defaultFormData.cooking, ...(initialData.cooking || {}) },
          night: { ...defaultFormData.night, ...(initialData.night || {}) }
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
            title="Morning"
            items={formData.morning}
            section="morning"
            onChange={(field, value) => handleSectionChange('morning', field, value)}
          />
          <Divider />
          
          <ChecklistSection
            title="Cleaning"
            items={formData.cleaning}
            section="cleaning"
            onChange={(field, value) => handleSectionChange('cleaning', field, value)}
          />
          <Divider />
          
          <ChecklistSection
            title="Ejercicio"
            items={formData.ejercicio}
            section="ejercicio"
            onChange={(field, value) => handleSectionChange('ejercicio', field, value)}
          />
          <Divider />
          
          <ChecklistSection
            title="Cooking"
            items={formData.cooking}
            section="cooking"
            onChange={(field, value) => handleSectionChange('cooking', field, value)}
          />
          <Divider />
          
          <ChecklistSection
            title="Night"
            items={formData.night}
            section="night"
            onChange={(field, value) => handleSectionChange('night', field, value)}
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