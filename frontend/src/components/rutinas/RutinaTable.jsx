import React, { useEffect, useState } from 'react';
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
  TextField,
  Button,
  Tooltip
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AddIcon from '@mui/icons-material/Add';
import { formatDate } from './utils/iconConfig';
import ChecklistSection from './ChecklistSection';

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
  // Agregar useEffect para debugging
  useEffect(() => {
    console.log('RutinaTable recibió nueva rutina:', rutina);
  }, [rutina]);

  // Forzar re-renderizado cuando cambia la rutina
  const [, forceRender] = useState({});
  useEffect(() => {
    forceRender({});
  }, [rutina]);

  if (!rutina || !rutina._id) {
    console.log('No hay rutina para mostrar');
    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Rutina diaria</TableCell>
              <TableCell>Completitud</TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  onClick={onPrevious}
                  disabled={!hasPrevious}
                  sx={{ 
                    color: hasPrevious ? 'primary.main' : 'text.disabled',
                    '&:hover': {
                      backgroundColor: 'transparent'
                    }
                  }}
                >
                  <NavigateNextIcon sx={{ transform: 'rotate(180deg)' }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={onNext}
                  disabled={!hasNext}
                  sx={{ 
                    color: hasNext ? 'primary.main' : 'text.disabled',
                    '&:hover': {
                      backgroundColor: 'transparent'
                    }
                  }}
                >
                  <NavigateNextIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={4} align="center">
                <Box sx={{ 
                  py: 4, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  gap: 2 
                }}>
                  <Typography variant="body1" color="text.secondary">
                    No hay rutinas registradas
                  </Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />}
                    onClick={() => {
                      if (typeof onEdit === 'function') {
                        onEdit();
                      }
                    }}
                  >
                    Crear primera rutina
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

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
                  <Tooltip 
                    title="Registro anterior"
                    arrow
                    placement="top"
                    componentsProps={{
                      tooltip: {
                        sx: {
                          bgcolor: 'background.paper',
                          color: 'text.primary',
                          '& .MuiTooltip-arrow': {
                            color: 'background.paper',
                          },
                          boxShadow: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          fontSize: '0.75rem'
                        }
                      }
                    }}
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
                  </Tooltip>
                  <Tooltip 
                    title="Registro siguiente"
                    arrow
                    placement="top"
                    componentsProps={{
                      tooltip: {
                        sx: {
                          bgcolor: 'background.paper',
                          color: 'text.primary',
                          '& .MuiTooltip-arrow': {
                            color: 'background.paper',
                          },
                          boxShadow: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          fontSize: '0.75rem'
                        }
                      }
                    }}
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
                  </Tooltip>
                  <Tooltip 
                    title="Eliminar rutina"
                    arrow
                    placement="top"
                    componentsProps={{
                      tooltip: {
                        sx: {
                          bgcolor: 'background.paper',
                          color: 'text.primary',
                          '& .MuiTooltip-arrow': {
                            color: 'background.paper',
                          },
                          boxShadow: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          fontSize: '0.75rem'
                        }
                      }
                    }}
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
                  </Tooltip>
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