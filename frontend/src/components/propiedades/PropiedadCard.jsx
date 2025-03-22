import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Collapse,
  IconButton,
  Grid,
  Divider,
  Paper,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  HomeWork,
  LocationOn,
  AttachMoney,
  BedOutlined as BedIcon,
  BathtubOutlined as BathtubIcon,
  PeopleOutlined as PeopleIcon,
  DescriptionOutlined as DescriptionIcon,
  Inventory2Outlined as InventoryIcon,
  CheckCircle,
  PendingActions,
  Engineering,
  BookmarkAdded,
  EditOutlined as EditIcon,
  DeleteOutlined as DeleteIcon
} from '@mui/icons-material';
import { EntityActions } from '../EntityViews/EntityActions';
import PropiedadCardItem from './PropiedadCardItem';
import { Link } from 'react-router-dom';

// Componente estilizado para las tarjetas con estilo angular
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 0,
  backgroundColor: theme.palette.background.default,
  backgroundImage: 'none',
  boxShadow: 'none',
  border: 'none',
  transition: 'all 0.2s ease',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'visible',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  }
}));

// Chip de estado estilizado
const StatusChip = styled(Box)(({ theme, customcolor }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 4px',
  fontSize: '0.75rem',
  color: customcolor || theme.palette.text.secondary,
  height: 20,
  marginLeft: theme.spacing(1),
  '& .MuiSvgIcon-root': {
    fontSize: '0.9rem'
  }
}));

// Mapeo de iconos para estados
const STATUS_ICONS = {
  'DISPONIBLE': <PendingActions fontSize="small" />,
  'OCUPADA': <CheckCircle fontSize="small" />,
  'MANTENIMIENTO': <Engineering fontSize="small" />,
  'RESERVADA': <BookmarkAdded fontSize="small" />
};

// Mapeo de colores para estados
const STATUS_COLORS = {
  'DISPONIBLE': '#4caf50',
  'OCUPADA': '#2196f3',
  'MANTENIMIENTO': '#ff9800',
  'RESERVADA': '#9c27b0'
};

// Función para determinar el estado del contrato
const getEstadoContrato = (contrato) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicio = new Date(contrato.fechaInicio);
  const fin = new Date(contrato.fechaFin);
  
  if (inicio <= hoy && fin >= hoy) {
    return 'ACTIVO';
  } else if (inicio > hoy) {
    return contrato.estado === 'RESERVADO' ? 'RESERVADO' : 'PLANEADO';
  } else if (fin < hoy) {
    return 'FINALIZADO';
  }
  return contrato.estado || 'PENDIENTE';
};

// Función para calcular días restantes actualizada
const calcularDiasRestantes = (contratos) => {
  if (!contratos || contratos.length === 0) return null;
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  // Encontrar contrato activo
  const contratoActivo = contratos.find(contrato => {
    const fechaInicio = new Date(contrato.fechaInicio);
    const fechaFin = new Date(contrato.fechaFin);
    return fechaInicio <= hoy && fechaFin >= hoy && contrato.estado === 'ACTIVO';
  });
  
  if (!contratoActivo) return null;
  
  const fechaFin = new Date(contratoActivo.fechaFin);
  const diferenciaTiempo = fechaFin.getTime() - hoy.getTime();
  const diasRestantes = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24));
  
  return diasRestantes;
};

// Función para calcular estadísticas de la propiedad
const calcularEstadisticasPropiedad = (propiedad) => {
  const stats = {
    total: 1,
    ocupadas: 0,
    disponibles: 0,
    mantenimiento: 0,
    reservadas: 0,
    porcentajeOcupacion: 0,
    estado: 'DISPONIBLE'
  };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Verificar contratos
  const contratos = propiedad.contratos || [];
  let tieneContratoActivo = false;
  let tieneContratoReservado = false;

  for (const contrato of contratos) {
    const inicio = new Date(contrato.fechaInicio);
    const fin = new Date(contrato.fechaFin);
    const estado = getEstadoContrato(contrato);

    if (estado === 'ACTIVO') {
      tieneContratoActivo = true;
      break;
    } else if (estado === 'RESERVADO') {
      tieneContratoReservado = true;
    }
  }

  // Determinar estado
  if (tieneContratoActivo) {
    stats.ocupadas = 1;
    stats.disponibles = 0;
    stats.estado = 'OCUPADA';
    stats.porcentajeOcupacion = 100;
  } else if (propiedad.estado === 'MANTENIMIENTO') {
    stats.mantenimiento = 1;
    stats.disponibles = 0;
    stats.estado = 'MANTENIMIENTO';
    stats.porcentajeOcupacion = 0;
  } else if (tieneContratoReservado || propiedad.estado === 'RESERVADA') {
    stats.reservadas = 1;
    stats.disponibles = 0;
    stats.estado = 'RESERVADA';
    stats.porcentajeOcupacion = 0;
  } else {
    stats.disponibles = 1;
    stats.estado = 'DISPONIBLE';
    stats.porcentajeOcupacion = 0;
  }

  return stats;
};

// Función para obtener el color del estado del inquilino
const getInquilinoStatusColor = (estado) => {
  const statusColors = {
    'ACTIVO': '#4caf50',
    'RESERVADO': '#ff9800',
    'PENDIENTE': '#2196f3',
    'INACTIVO': '#9e9e9e'
  };
  return statusColors[estado] || '#9e9e9e';
};

// Función para obtener el ícono del estado del inquilino
const getInquilinoStatusIcon = (estado) => {
  const statusIcons = {
    'ACTIVO': <CheckCircle fontSize="small" sx={{ color: getInquilinoStatusColor('ACTIVO') }} />,
    'RESERVADO': <BookmarkAdded fontSize="small" sx={{ color: getInquilinoStatusColor('RESERVADO') }} />,
    'PENDIENTE': <PendingActions fontSize="small" sx={{ color: getInquilinoStatusColor('PENDIENTE') }} />,
    'INACTIVO': <DescriptionIcon fontSize="small" sx={{ color: getInquilinoStatusColor('INACTIVO') }} />
  };
  return statusIcons[estado] || statusIcons['INACTIVO'];
};

const PropiedadCard = ({ propiedad, onEdit, onDelete }) => {
  const [expandedSections, setExpandedSections] = useState({
    inquilinos: false,
    contratos: false,
    detalles: false,
    habitaciones: false,
    inventario: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Calcular estadísticas
  const stats = calcularEstadisticasPropiedad(propiedad);
  const diasRestantes = calcularDiasRestantes(propiedad.contratos);

  const getColorEstado = (estado) => {
    switch (estado) {
      case 'ACTIVO': return 'success.main';
      case 'FINALIZADO': return 'text.disabled';
      case 'PLANEADO': return 'warning.main';
      case 'RESERVADO': return 'info.main';
      default: return 'text.secondary';
    }
  };

  // Extraer valores para mostrar
  const titulo = propiedad.titulo || 'Sin título';
  const estado = propiedad.estado || 'DISPONIBLE';
  const direccion = propiedad.direccion || '';
  const ciudad = propiedad.ciudad || '';
  const metrosCuadrados = propiedad.metrosCuadrados || 0;
  const precio = propiedad.precio || 0;
  const simboloMoneda = propiedad.cuenta?.moneda?.simbolo || propiedad.moneda?.simbolo || '$';
  const nombreCuenta = propiedad.cuenta?.nombre || 'No especificada';
  const habitaciones = propiedad.habitaciones || [];
  const numDormitorios = habitaciones.filter(h => 
    h.tipo === 'DORMITORIO_SIMPLE' || h.tipo === 'DORMITORIO_DOBLE'
  ).length;
  const dormitoriosSimples = habitaciones.filter(h => h.tipo === 'DORMITORIO_SIMPLE').length;
  const dormitoriosDobles = habitaciones.filter(h => h.tipo === 'DORMITORIO_DOBLE').length;
  const banos = habitaciones.filter(h => h.tipo === 'BAÑO' || h.tipo === 'TOILETTE').length;
  const inquilinos = propiedad.inquilinos || [];
  const contratos = propiedad.contratos || [];
  const inventarios = propiedad.inventarios || [];
  const totalInventarios = inventarios.length;

  // Depuración de inquilinos
  console.log('Inquilinos para propiedad', propiedad.titulo, ':', inquilinos);
  
  // Agrupar inquilinos por estado
  const inquilinosPorEstado = inquilinos.reduce((acc, inquilino) => {
    if (!acc[inquilino.estado]) {
      acc[inquilino.estado] = [];
    }
    acc[inquilino.estado].push(inquilino);
    return acc;
  }, {});

  // Función para pluralizar palabras
  const pluralizar = (cantidad, singular, plural) => {
    return cantidad === 1 ? singular : plural;
  };

  // Calcular cantidades
  const contratosActivos = contratos.filter(c => c.estado === 'ACTIVO').length;
  const inquilinosActivos = inquilinos.filter(i => i.estado === 'ACTIVO').length;
  const totalHabitaciones = habitaciones.length;

  // Generar títulos con pluralización correcta
  const tituloInquilinosContratos = `${inquilinosActivos} ${pluralizar(inquilinosActivos, 'inquilino', 'inquilinos')} - ${contratosActivos} ${pluralizar(contratosActivos, 'contrato activo', 'contratos activos')}`;

  // Función para agrupar habitaciones por tipo
  const agruparHabitaciones = (habitaciones) => {
    return habitaciones.reduce((acc, hab) => {
      const tipo = hab.tipo === 'OTRO' ? hab.nombrePersonalizado : hab.tipo;
      if (!acc[tipo]) {
        acc[tipo] = [];
      }
      acc[tipo].push(hab);
      return acc;
    }, {});
  };

  // Función para obtener el nombre legible del tipo de habitación
  const getNombreTipoHabitacion = (tipo) => {
    const tipos = {
      'BAÑO': 'Baño',
      'TOILETTE': 'Toilette',
      'DORMITORIO_DOBLE': 'Dormitorio doble',
      'DORMITORIO_SIMPLE': 'Dormitorio simple',
      'ESTUDIO': 'Estudio',
      'COCINA': 'Cocina',
      'DESPENSA': 'Despensa',
      'SALA_PRINCIPAL': 'Sala principal',
      'PATIO': 'Patio',
      'JARDIN': 'Jardín',
      'TERRAZA': 'Terraza',
      'LAVADERO': 'Lavadero'
    };
    return tipos[tipo] || tipo;
  };

  // Calcular totales de habitaciones
  const habitacionesAgrupadas = agruparHabitaciones(propiedad.habitaciones || []);
  const dormitorios = (propiedad.habitaciones || []).filter(h => 
    h.tipo === 'DORMITORIO_SIMPLE' || h.tipo === 'DORMITORIO_DOBLE'
  ).length;

  return (
    <StyledCard>
      {/* Header con título y acciones */}
      <Box sx={{ 
        p: 1.5, 
        pb: 1,
        display: 'flex', 
        flexDirection: 'column',
        gap: 1
      }}>
        {/* Título y botones de acción */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HomeWork sx={{ fontSize: '1.1rem' }} />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ 
                fontWeight: 500, 
                fontSize: '0.9rem',
                lineHeight: 1.2
              }}>
                {titulo}
              </Typography>
              <StatusChip 
                customcolor={STATUS_COLORS[estado]}
              >
                {STATUS_ICONS[estado]}
                <Typography component="span" sx={{ fontSize: 'inherit', lineHeight: 1 }}>
                  {stats.porcentajeOcupacion > 0 ? 'Ocupada' : 'Disponible'}
                  {diasRestantes ? ` (${diasRestantes} días)` : ''}
                </Typography>
              </StatusChip>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Editar">
              <IconButton
                size="small"
                onClick={() => onEdit(propiedad)}
                sx={{ 
                  color: 'text.secondary',
                  padding: 0.25
                }}
              >
                <EditIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar">
              <IconButton
                size="small"
                onClick={() => onDelete(propiedad._id || propiedad.id)}
                sx={{ 
                  color: 'text.secondary',
                  padding: 0.25
                }}
              >
                <DeleteIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      <Divider />
      
      <CardContent sx={{ 
        p: 1.5, 
        pb: 0.5, 
        maxHeight: 400, 
        overflowY: 'auto',
        '&:last-child': { pb: 0.5 }
      }}>
        <Divider sx={{ mb: 1 }} />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {/* Precio */}
          <Box sx={{ mt: 0.25 }}>
            <Box 
              onClick={() => toggleSection('price')}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                cursor: 'pointer',
                '&:hover': { color: 'primary.main' }
              }}
            >
              <AttachMoney sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
                {simboloMoneda} {precio.toLocaleString()} /mes ({nombreCuenta})
              </Typography>
              <IconButton
                size="small"
                sx={{
                  p: 0.25,
                  transform: expandedSections.price ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s'
                }}
              >
                <ExpandMoreIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Box>
            <Collapse in={expandedSections.price}>
              <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Precio mensual: {simboloMoneda} {precio.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Depósito: {simboloMoneda} {(precio * 2).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Cuenta: {nombreCuenta}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Moneda: {propiedad.cuenta?.moneda?.nombre || propiedad.moneda?.nombre || 'No especificada'}
                </Typography>
              </Box>
            </Collapse>
          </Box>
          
          {/* Inquilinos section */}
          <Box sx={{ mt: 0.25 }}>
            <Box 
              onClick={() => toggleSection('inquilinos')}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                cursor: 'pointer',
                '&:hover': { color: 'primary.main' }
              }}
            >
              <PeopleIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
                {propiedad.inquilinos?.length || 0} {(propiedad.inquilinos?.length || 0) === 1 ? 'inquilino' : 'inquilinos'}
              </Typography>
              <IconButton
                size="small"
                sx={{
                  p: 0.25,
                  transform: expandedSections.inquilinos ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s'
                }}
              >
                <ExpandMoreIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Box>
            <Collapse in={expandedSections.inquilinos}>
              <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                {propiedad.inquilinos?.length > 0 ? (
                  propiedad.inquilinos.map(inquilino => (
                    <Box key={inquilino._id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography 
                        component={Link}
                        to={`/inquilinos/${inquilino._id}`}
                        variant="body2" 
                        sx={{ 
                          fontSize: '0.8rem',
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {inquilino.nombre} {inquilino.apellido}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    No hay inquilinos asignados
                  </Typography>
                )}
              </Box>
            </Collapse>
          </Box>
          
          {/* Contratos section */}
          {propiedad.contratos?.length > 0 && (
            <Box sx={{ mt: 0.25 }}>
              <Box 
                onClick={() => toggleSection('contratos')}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  cursor: 'pointer',
                  '&:hover': { color: 'primary.main' }
                }}
              >
                <DescriptionIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
                  {propiedad.contratos.length} {propiedad.contratos.length === 1 ? 'contrato' : 'contratos'}
                </Typography>
                <IconButton
                  size="small"
                  sx={{
                    p: 0.25,
                    transform: expandedSections.contratos ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s'
                  }}
                >
                  <ExpandMoreIcon sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </Box>
              <Collapse in={expandedSections.contratos}>
                <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {propiedad.contratos
                    .sort((a, b) => {
                      const estadoA = getEstadoContrato(a);
                      const estadoB = getEstadoContrato(b);
                      const orden = {
                        'ACTIVO': 0,
                        'RESERVADO': 1,
                        'PLANEADO': 2,
                        'FINALIZADO': 3
                      };
                      return orden[estadoA] - orden[estadoB];
                    })
                    .map(contrato => {
                      const estado = getEstadoContrato(contrato);
                      return (
                        <Box 
                          key={contrato._id} 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            justifyContent: 'space-between'
                          }}
                        >
                          <Typography 
                            component={Link}
                            to={`/contratos/${contrato._id}`}
                            variant="body2" 
                            sx={{ 
                              fontSize: '0.8rem',
                              color: getColorEstado(estado),
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              '&:hover': {
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            <Box 
                              component="span" 
                              sx={{ 
                                width: 6, 
                                height: 6, 
                                borderRadius: '50%', 
                                backgroundColor: getColorEstado(estado)
                              }} 
                            />
                            {contrato.tipoContrato === 'MANTENIMIENTO' ? 'Contrato de mantenimiento' : 'Contrato de alquiler'}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontSize: '0.75rem',
                              color: getColorEstado(estado)
                            }}
                          >
                            {estado}
                          </Typography>
                        </Box>
                      );
                    })}
                </Box>
              </Collapse>
            </Box>
          )}
          
          {/* Habitaciones section */}
          <Box sx={{ mt: 0.25 }}>
            <Box 
              onClick={() => toggleSection('habitaciones')}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                cursor: 'pointer',
                '&:hover': { color: 'primary.main' }
              }}
            >
              <BedIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
                {totalHabitaciones} {totalHabitaciones === 1 ? 'habitación' : 'habitaciones'} ({dormitorios} {dormitorios === 1 ? 'dormitorio' : 'dormitorios'})
              </Typography>
              <IconButton
                size="small"
                sx={{
                  p: 0.25,
                  transform: expandedSections.habitaciones ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s'
                }}
              >
                <ExpandMoreIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Box>
            <Collapse in={expandedSections.habitaciones}>
              <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                {Object.entries(habitacionesAgrupadas).map(([tipo, habitaciones]) => (
                  <Typography key={tipo} variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    {habitaciones.length} {getNombreTipoHabitacion(tipo)}
                    {habitaciones.length > 1 && 's'}
                  </Typography>
                ))}
                {totalHabitaciones === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    No hay habitaciones registradas
                  </Typography>
                )}
              </Box>
            </Collapse>
          </Box>
          
          {/* Inventario section */}
          <Box sx={{ mt: 0.25 }}>
            <Box 
              onClick={() => toggleSection('inventario')}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                cursor: 'pointer',
                '&:hover': { color: 'primary.main' }
              }}
            >
              <InventoryIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
              <Typography 
                component={Link}
                to={`/inventario?propiedad=${propiedad._id}`}
                variant="body2" 
                sx={{ 
                  flex: 1, 
                  fontSize: '0.8rem',
                  color: 'inherit',
                  textDecoration: 'none',
                  '&:hover': {
                    color: 'primary.main',
                    textDecoration: 'underline'
                  }
                }}
              >
                {totalInventarios} {totalInventarios === 1 ? 'item' : 'items'} en inventario
              </Typography>
              <IconButton
                size="small"
                sx={{
                  p: 0.25,
                  transform: expandedSections.inventario ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s'
                }}
              >
                <ExpandMoreIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Box>
            <Collapse in={expandedSections.inventario}>
              <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Total de items: {totalInventarios}
                </Typography>
                {totalInventarios === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    No hay items registrados
                  </Typography>
                )}
              </Box>
            </Collapse>
          </Box>
          
          {/* Localización - Movida al final */}
          <Box sx={{ mt: 0.25 }}>
            <Box 
              onClick={() => toggleSection('location')}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                cursor: 'pointer',
                '&:hover': { color: 'primary.main' }
              }}
            >
              <LocationOn sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
                {ciudad} ({metrosCuadrados}m²)
              </Typography>
              <IconButton
                size="small"
                sx={{
                  p: 0.25,
                  transform: expandedSections.location ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s'
                }}
              >
                <ExpandMoreIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Box>
            <Collapse in={expandedSections.location}>
              <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Dirección: {direccion}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Ciudad: {ciudad}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Superficie: {metrosCuadrados}m²
                </Typography>
              </Box>
            </Collapse>
          </Box>
        </Box>
      </CardContent>
    </StyledCard>
  );
};

export default PropiedadCard; 