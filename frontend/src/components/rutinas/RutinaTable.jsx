import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  IconButton,
  Chip,
  Stack,
  Tooltip,
  styled
} from '@mui/material';
import { EntityActions } from '../EntityViews/EntityActions';
import AccessAlarmOutlinedIcon from '@mui/icons-material/AccessAlarmOutlined';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import ToothbrushOutlinedIcon from '@mui/icons-material/BrushOutlined';
import ToothbrushIcon from '@mui/icons-material/Brush';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import MedicationIcon from '@mui/icons-material/Medication';
import FaceRetouchingNaturalOutlinedIcon from '@mui/icons-material/FaceRetouchingNaturalOutlined';
import FaceRetouchingNaturalIcon from '@mui/icons-material/FaceRetouchingNatural';
import BedOutlinedIcon from '@mui/icons-material/BedOutlined';
import BedIcon from '@mui/icons-material/Bed';
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
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined';
import BathtubIcon from '@mui/icons-material/Bathtub';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import ScienceIcon from '@mui/icons-material/Science';
import RestaurantMenuOutlinedIcon from '@mui/icons-material/RestaurantMenuOutlined';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';

const CustomTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  '& .MuiTooltip-tooltip': {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[1],
    fontSize: '0.75rem',
    padding: '4px 8px',
    border: `1px solid ${theme.palette.divider}`
  },
}));

const iconConfig = {
  morning: {
    wakeUp: { outlined: AccessAlarmOutlinedIcon, filled: AccessAlarmIcon, tooltip: 'Despertar' },
    bed: { outlined: BedOutlinedIcon, filled: BedIcon, tooltip: 'Hacer la Cama' },
    meds: { outlined: MedicationOutlinedIcon, filled: MedicationIcon, tooltip: 'Medicamentos' }
  },
  bodyCare: {
    teeth: { outlined: ToothbrushOutlinedIcon, filled: ToothbrushIcon, tooltip: 'Lavarse los Dientes' },
    bath: { outlined: BathtubOutlinedIcon, filled: BathtubIcon, tooltip: 'Baño' },
    skinCareDay: { outlined: FaceRetouchingNaturalOutlinedIcon, filled: FaceRetouchingNaturalIcon, tooltip: 'Skin Care Día' },
    skinCareNight: { outlined: ScienceOutlinedIcon, filled: ScienceIcon, tooltip: 'Skin Care Noche' }
  },
  nutricion: {
    cocinar: { outlined: RestaurantMenuOutlinedIcon, filled: RestaurantMenuIcon, tooltip: 'Cocinar' },
    food: { outlined: RestaurantOutlinedIcon, filled: RestaurantIcon, tooltip: 'Comer' },
    agua: { outlined: WaterDropOutlinedIcon, filled: WaterDropIcon, tooltip: 'Agua' },
    protein: { outlined: BlenderOutlinedIcon, filled: BlenderIcon, tooltip: 'Proteína' }
  },
  ejercicio: {
    meditate: { outlined: SpaOutlinedIcon, filled: SpaIcon, tooltip: 'Meditar' },
    stretching: { outlined: SelfImprovementOutlinedIcon, filled: SelfImprovementIcon, tooltip: 'Stretching' },
    gym: { outlined: FitnessCenterOutlinedIcon, filled: FitnessCenterIcon, tooltip: 'Gym' },
    cardio: { outlined: DirectionsRunOutlinedIcon, filled: DirectionsRunIcon, tooltip: 'Cardio' }
  },
  cleaning: {
    platos: { outlined: LocalDiningOutlinedIcon, filled: LocalDiningIcon, tooltip: 'Lavar los Platos' },
    piso: { outlined: CleaningServicesOutlinedIcon, filled: CleaningServicesIcon, tooltip: 'Limpiar el Piso' },
    ropa: { outlined: LocalLaundryServiceOutlinedIcon, filled: LocalLaundryServiceIcon, tooltip: 'Lavar la Ropa' }
  }
};

const ChecklistSection = ({ title, items = {}, onChange, section }) => {
  const handleClick = (key, value) => {
    console.log('Click en botón:', section, key, value);
    onChange?.(section, key, value);
  };

  // Si los items son undefined, mostrar una sección vacía
  if (!items) {
    return null;
  }

  return (
    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
      <TableCell 
        colSpan={2}
        sx={{ 
          position: 'relative',
          pt: 3,
          pb: 1,
          px: 2
        }}
      >
        <Typography 
          variant="subtitle2" 
          color="text.secondary"
          sx={{
            position: 'absolute',
            top: 8,
            left: 16,
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
          justifyContent="flex-start"
          sx={{ 
            gap: 0.5,
            '& > *': { 
              minWidth: 32,
              height: 32
            }
          }}
        >
          {Object.entries(items).map(([key, value]) => {
            // Verificar que el icono exista para esta sección y key
            if (!iconConfig[section] || !iconConfig[section][key]) {
              console.warn(`No se encontró configuración de icono para ${section}.${key}`);
              return null;
            }

            const IconOutlined = iconConfig[section][key].outlined;
            const IconFilled = iconConfig[section][key].filled;
            const tooltip = iconConfig[section][key].tooltip;

            return (
              <CustomTooltip 
                key={key}
                title={tooltip}
                placement="top"
                arrow
              >
                <IconButton
                  onClick={() => handleClick(key, !value)}
                  color={value ? 'primary' : 'default'}
                  size="small"
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
              </CustomTooltip>
            );
          })}
        </Stack>
      </TableCell>
    </TableRow>
  );
};

export const RutinaTable = ({ rutina, onEdit, onDelete, onCheckChange }) => {
  if (!rutina) return null;

  // Asegurarnos de que todas las secciones existan
  const rutinaConSecciones = {
    ...rutina,
    morning: rutina.morning || {},
    bodyCare: rutina.bodyCare || {},
    nutricion: rutina.nutricion || {},
    ejercicio: rutina.ejercicio || {},
    cleaning: rutina.cleaning || {}
  };

  const handleSectionChange = (section, field, value) => {
    console.log('handleSectionChange:', section, field, value);
    
    if (!onCheckChange || !rutina?._id) {
      console.log('No se puede actualizar:', !onCheckChange ? 'falta onCheckChange' : 'falta rutina._id');
      return;
    }

    const updatedRutina = {
      ...rutina,
      [section]: {
        ...rutina[section],
        [field]: value
      }
    };

    console.log('Enviando rutina actualizada:', updatedRutina);
    onCheckChange(updatedRutina);
  };

  return (
    <TableContainer 
      component={Paper} 
      elevation={0}
      sx={{ 
        borderRadius: 0,
        overflow: 'visible'
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell 
              colSpan={2}
              sx={{ 
                py: 1,
                px: 2
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                  >
                    {new Date(rutina.fecha).toLocaleDateString()}
                  </Typography>
                  <Chip 
                    label={`${(rutina.completitud * 100).toFixed(0)}%`}
                    color={rutina.completitud >= 0.8 ? 'success' : rutina.completitud >= 0.5 ? 'warning' : 'error'}
                    size="small"
                    sx={{ 
                      height: 20,
                      '& .MuiChip-label': {
                        px: 1,
                        fontSize: '0.75rem'
                      }
                    }}
                  />
                </Box>
                <EntityActions
                  onEdit={onEdit}
                  onDelete={onDelete}
                  itemName="la rutina"
                  size="small"
                />
              </Box>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <ChecklistSection 
            title="Morning" 
            items={rutinaConSecciones.morning} 
            section="morning"
            onChange={handleSectionChange} 
          />
          <ChecklistSection 
            title="Body Care" 
            items={rutinaConSecciones.bodyCare} 
            section="bodyCare"
            onChange={handleSectionChange} 
          />
          <ChecklistSection 
            title="Nutrición" 
            items={rutinaConSecciones.nutricion} 
            section="nutricion"
            onChange={handleSectionChange} 
          />
          <ChecklistSection 
            title="Ejercicio" 
            items={rutinaConSecciones.ejercicio} 
            section="ejercicio"
            onChange={handleSectionChange} 
          />
          <ChecklistSection 
            title="Cleaning" 
            items={rutinaConSecciones.cleaning} 
            section="cleaning"
            onChange={handleSectionChange} 
          />
        </TableBody>
      </Table>
    </TableContainer>
  );
}; 