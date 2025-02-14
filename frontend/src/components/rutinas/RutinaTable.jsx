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
  styled,
  TextField
} from '@mui/material';
import { EntityActions } from '../EntityViews/EntityActions';
import AccessAlarmOutlinedIcon from '@mui/icons-material/AccessAlarmOutlined';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import BrushOutlinedIcon from '@mui/icons-material/BrushOutlined';
import BrushIcon from '@mui/icons-material/Brush';
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
import LocalPharmacyOutlinedIcon from '@mui/icons-material/LocalPharmacyOutlined';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import NightlightOutlinedIcon from '@mui/icons-material/NightlightOutlined';
import NightlightIcon from '@mui/icons-material/Nightlight';
import Face3OutlinedIcon from '@mui/icons-material/Face3Outlined';
import Face3Icon from '@mui/icons-material/Face3';
import DirectionsBikeOutlinedIcon from '@mui/icons-material/DirectionsBikeOutlined';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import Face4OutlinedIcon from '@mui/icons-material/Face4Outlined';
import Face4Icon from '@mui/icons-material/Face4';
import SanitizerOutlinedIcon from '@mui/icons-material/SanitizerOutlined';
import SanitizerIcon from '@mui/icons-material/Sanitizer';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

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

const formatDate = (date) => {
  const dias = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const d = new Date(date);
  return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
};

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

const ChecklistSection = ({ title, items = {}, onChange, section }) => {
  // Filtrar solo los items que tienen iconos configurados
  const validItems = Object.entries(items).filter(([key]) => 
    iconConfig[section] && iconConfig[section][key]
  );

  return (
    <TableRow sx={{ 
      '&:last-child td, &:last-child th': { border: 0 },
      backgroundColor: 'transparent'
    }}>
      <TableCell 
        colSpan={2}
        sx={{ 
          position: 'relative',
          pt: 3,
          pb: 1,
          px: 2,
          backgroundColor: 'transparent'
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
          {validItems.map(([key, value]) => {
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
                  onClick={() => onChange(section, key, !value)}
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

export const RutinaTable = ({ 
  rutina, 
  onEdit, 
  onDelete, 
  onCheckChange, 
  onPrevious, 
  onNext,
  hasPrevious,
  hasNext 
}) => {
  if (!rutina) return null;

  const handleDateChange = (event) => {
    const newDate = new Date(event.target.value);
    const updatedRutina = {
      ...rutina,
      fecha: newDate.toISOString()
    };
    onCheckChange(updatedRutina);
  };

  // Asegurarnos de que todas las secciones existan
  const rutinaConSecciones = {
    ...rutina,
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

    // Calcular nueva completitud
    let totalTasks = 0;
    let completedTasks = 0;

    ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'].forEach(sect => {
      const sectionFields = Object.keys(updatedRutina[sect] || {});
      totalTasks += sectionFields.length;
      
      Object.values(updatedRutina[sect] || {}).forEach(val => {
        if (val === true) completedTasks++;
      });
    });

    updatedRutina.completitud = totalTasks > 0 ? completedTasks / totalTasks : 0;

    console.log('Enviando rutina actualizada:', updatedRutina);
    onCheckChange(updatedRutina);
  };

  return (
    <TableContainer 
      component={Paper} 
      elevation={0}
      sx={{ 
        borderRadius: 0,
        overflow: 'visible',
        backgroundColor: 'transparent',
        '& .MuiTable-root': {
          backgroundColor: 'transparent'
        },
        '& .MuiTableCell-root': {
          border: 'none'
        }
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell 
              colSpan={2}
              sx={{ 
                py: 1,
                px: 2,
                backgroundColor: 'transparent'
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    type="date"
                    value={new Date(rutina.fecha).toISOString().split('T')[0]}
                    onChange={handleDateChange}
                    variant="standard"
                    sx={{
                      width: '130px',
                      '& .MuiInput-input': {
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        p: 0,
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
                  />
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CustomTooltip 
                    title="Registro anterior"
                    placement="top"
                    arrow
                  >
                    <span>
                      <IconButton
                        onClick={onPrevious}
                        size="small"
                        disabled={!hasPrevious}
                        sx={{ 
                          color: 'text.secondary',
                          '&:hover': {
                            color: 'text.primary'
                          },
                          '&.Mui-disabled': {
                            color: 'action.disabled'
                          }
                        }}
                      >
                        <ChevronLeftIcon />
                      </IconButton>
                    </span>
                  </CustomTooltip>
                  <CustomTooltip 
                    title="Registro siguiente"
                    placement="top"
                    arrow
                  >
                    <span>
                      <IconButton
                        onClick={onNext}
                        size="small"
                        disabled={!hasNext}
                        sx={{ 
                          color: 'text.secondary',
                          '&:hover': {
                            color: 'text.primary'
                          },
                          '&.Mui-disabled': {
                            color: 'action.disabled'
                          }
                        }}
                      >
                        <ChevronRightIcon />
                      </IconButton>
                    </span>
                  </CustomTooltip>
                  <EntityActions
                    onEdit={onEdit}
                    onDelete={onDelete}
                    itemName="la rutina"
                    size="small"
                  />
                </Box>
              </Box>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
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