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
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';

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
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const d = new Date(date);
  const dia = d.getDate().toString().padStart(2, '0');
  const mes = meses[d.getMonth()];
  const año = d.getFullYear();
  return `${dia} ${mes} ${año}`;
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

const ChecklistSection = ({ title, items = {}, onChange, section, completitud }) => {
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
          pt: 1.5,
          pb: 0.5,
          px: 2,
          backgroundColor: 'transparent'
        }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 0.5
        }}>
          <Typography 
            variant="subtitle2" 
            color="text.secondary"
            sx={{
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="subtitle2"
            sx={{
              fontSize: '0.75rem',
              color: completitud >= 0.8 ? 'success.main' : 
                     completitud >= 0.5 ? 'warning.main' : 
                     'error.main',
              fontWeight: 500
            }}
          >
            {`${(completitud * 100).toFixed(0)}%`}
          </Typography>
        </Box>
        <Stack 
          direction="row" 
          spacing={0.5}
          flexWrap="wrap" 
          useFlexGap 
          justifyContent="flex-start"
          sx={{ 
            gap: 0.5,
            '& > *': { 
              minWidth: 28,
              height: 28
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

    // Calcular nueva completitud por sección
    ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'].forEach(sect => {
      const sectionFields = Object.keys(updatedRutina[sect] || {});
      const sectionTotal = sectionFields.length;
      let sectionCompleted = 0;
      
      Object.values(updatedRutina[sect] || {}).forEach(val => {
        if (val === true) sectionCompleted++;
      });

      if (!updatedRutina.completitudPorSeccion) {
        updatedRutina.completitudPorSeccion = {};
      }
      updatedRutina.completitudPorSeccion[sect] = sectionTotal > 0 ? sectionCompleted / sectionTotal : 0;
    });

    // Calcular completitud general
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
                justifyContent: 'space-between',
                mb: 1
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  flex: 1,
                  '& > *': {
                    transition: 'all 0.2s ease-in-out'
                  }
                }}>
                  <Box sx={{ position: 'relative', width: '130px' }}>
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        left: 0,
                        top: -2,
                        p: 0.5,
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'primary.main',
                          backgroundColor: 'transparent'
                        }
                      }}
                    >
                      <CalendarTodayOutlinedIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                    <TextField
                      type="date"
                      value={new Date(rutina.fecha).toISOString().split('T')[0]}
                      onChange={handleDateChange}
                      variant="standard"
                      sx={{
                        width: '100%',
                        '& .MuiInput-input': {
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          p: 0,
                          color: 'text.secondary',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            color: 'primary.main'
                          },
                          height: 20,
                          lineHeight: '20px',
                          textAlign: 'left',
                          paddingLeft: '28px',
                          opacity: 0,
                          position: 'absolute',
                          width: '100%'
                        },
                        '& input[type="date"]::-webkit-calendar-picker-indicator': {
                          opacity: 0,
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: '100%',
                          height: '100%',
                          cursor: 'pointer'
                        }
                      }}
                      InputProps={{
                        disableUnderline: true,
                        startAdornment: (
                          <Typography
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              color: 'text.secondary',
                              position: 'absolute',
                              left: '28px',
                              pointerEvents: 'none'
                            }}
                          >
                            {formatDate(rutina.fecha)}
                          </Typography>
                        ),
                        sx: {
                          fontSize: '0.75rem',
                          height: 20,
                          p: 0,
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center'
                        }
                      }}
                    />
                  </Box>
                  <Typography 
                    variant="subtitle2"
                    sx={{
                      fontSize: '0.75rem',
                      color: rutina.completitud >= 0.8 ? 'success.main' : 
                             rutina.completitud >= 0.5 ? 'warning.main' : 
                             'error.main',
                      fontWeight: 500
                    }}
                  >
                    {`${(rutina.completitud * 100).toFixed(0)}%`}
                  </Typography>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  '& > *': {
                    transition: 'all 0.2s ease-in-out'
                  }
                }}>
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
                          p: 0.5,
                          '&:hover': {
                            color: 'text.primary',
                            backgroundColor: 'transparent'
                          },
                          '&.Mui-disabled': {
                            color: 'action.disabled'
                          },
                          '& .MuiSvgIcon-root': {
                            fontSize: '1.25rem'
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
                          p: 0.5,
                          '&:hover': {
                            color: 'text.primary',
                            backgroundColor: 'transparent'
                          },
                          '&.Mui-disabled': {
                            color: 'action.disabled'
                          },
                          '& .MuiSvgIcon-root': {
                            fontSize: '1.25rem'
                          }
                        }}
                      >
                        <ChevronRightIcon />
                      </IconButton>
                    </span>
                  </CustomTooltip>
                  <CustomTooltip 
                    title="Eliminar rutina"
                    placement="top"
                    arrow
                  >
                    <IconButton
                      onClick={onDelete}
                      size="small"
                      sx={{ 
                        color: 'text.secondary',
                        p: 0.5,
                        '&:hover': {
                          color: 'error.main',
                          backgroundColor: 'transparent'
                        },
                        '& .MuiSvgIcon-root': {
                          fontSize: '1.25rem'
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CustomTooltip>
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
            completitud={rutina.completitudPorSeccion?.bodyCare || 0}
          />
          <ChecklistSection 
            title="Nutrición" 
            items={rutinaConSecciones.nutricion} 
            section="nutricion"
            onChange={handleSectionChange}
            completitud={rutina.completitudPorSeccion?.nutricion || 0}
          />
          <ChecklistSection 
            title="Ejercicio" 
            items={rutinaConSecciones.ejercicio} 
            section="ejercicio"
            onChange={handleSectionChange}
            completitud={rutina.completitudPorSeccion?.ejercicio || 0}
          />
          <ChecklistSection 
            title="Cleaning" 
            items={rutinaConSecciones.cleaning} 
            section="cleaning"
            onChange={handleSectionChange}
            completitud={rutina.completitudPorSeccion?.cleaning || 0}
          />
        </TableBody>
      </Table>
    </TableContainer>
  );
}; 