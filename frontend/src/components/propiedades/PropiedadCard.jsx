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
  Tooltip,
  LinearProgress,
  useMediaQuery,
  useTheme
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
  DeleteOutlined as DeleteIcon,
  ViewListOutlined as ListViewIcon,
  GridViewOutlined as GridViewIcon,
  AccountBalanceWalletOutlined as DepositIcon,
  AccountBalance as BankIcon,
  MonetizationOnOutlined as MoneyIcon
} from '@mui/icons-material';
import { EntityActions } from '../EntityViews/EntityActions';
import PropiedadCardItem from './PropiedadCardItem';
import PropiedadGridView, { crearSeccionesPropiedad } from './PropiedadGridView';
import PropiedadListView from './PropiedadListView';
import { Link } from 'react-router-dom';

// Componente estilizado para las tarjetas con estilo angular
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 0,
  backgroundColor: 'transparent',
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
    transform: 'none',
    boxShadow: 'none'
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

// Función de pluralización
const pluralizar = (cantidad, singular, plural) => cantidad === 1 ? singular : plural;

// Función para calcular el progreso del contrato
const calcularProgresoContrato = (contratos, montoMensual) => {
  // Encontrar contrato activo
  const contratoActivo = contratos.find(contrato => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicio = new Date(contrato.fechaInicio);
    const fin = new Date(contrato.fechaFin);
    return inicio <= hoy && fin >= hoy && contrato.estado === 'ACTIVO';
  });

  if (!contratoActivo) {
    return {
      porcentaje: 0,
      mesesTranscurridos: 0,
      mesTotales: 0,
      montoAcumulado: 0,
      montoTotal: 0,
      tieneContrato: false
    };
  }

  const hoy = new Date();
  const inicio = new Date(contratoActivo.fechaInicio);
  const fin = new Date(contratoActivo.fechaFin);

  // Calcular meses totales
  const mesTotales = (fin.getFullYear() - inicio.getFullYear()) * 12 + 
                     (fin.getMonth() - inicio.getMonth()) + 1;

  // Calcular meses transcurridos
  const mesesTranscurridos = Math.min(
    Math.max(0, (hoy.getFullYear() - inicio.getFullYear()) * 12 + 
              (hoy.getMonth() - inicio.getMonth()) + 1),
    mesTotales
  );

  // Calcular porcentaje
  const porcentaje = Math.min(100, (mesesTranscurridos / mesTotales) * 100);

  // Calcular montos
  montoMensual = montoMensual || 0;
  const montoAcumulado = mesesTranscurridos * montoMensual;
  const montoTotal = mesTotales * montoMensual;

  return {
    porcentaje,
    mesesTranscurridos,
    mesTotales,
    montoAcumulado,
    montoTotal,
    tieneContrato: true,
    contrato: contratoActivo
  };
};

// Función para calcular el progreso de ocupación de la propiedad
const calcularProgresoOcupacion = (propiedad) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  // Encontrar contrato activo
  const contratoActivo = (propiedad.contratos || []).find(contrato => {
    const inicio = new Date(contrato.fechaInicio);
    const fin = new Date(contrato.fechaFin);
    return inicio <= hoy && fin >= hoy && contrato.estado === 'ACTIVO';
  });
  if (!contratoActivo) {
    return {
      porcentaje: 0,
      diasTranscurridos: 0,
      diasTotales: 0,
      diasRestantes: 0,
      estadoTiempo: 'Sin contrato',
      montoAcumulado: 0,
      montoTotal: 0,
      tieneContrato: false,
      estado: 'DISPONIBLE',
      contrato: null
    };
  }
  const inicio = new Date(contratoActivo.fechaInicio);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(contratoActivo.fechaFin);
  fin.setHours(0, 0, 0, 0);
  // Calcular días totales del contrato
  const diasTotales = Math.max(0, Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)));
  // Calcular días transcurridos
  const diasTranscurridos = Math.max(0, Math.min(diasTotales, Math.ceil((hoy - inicio) / (1000 * 60 * 60 * 24))));
  // Calcular días restantes
  const diasRestantes = Math.max(0, Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24)));
  // Estado textual
  let estadoTiempo = '';
  if (hoy < inicio) {
    estadoTiempo = 'No iniciado';
  } else if (hoy > fin) {
    estadoTiempo = 'Finalizado';
  } else {
    estadoTiempo = `${diasRestantes} días restantes`;
  }
  // Calcular porcentaje
  const porcentaje = diasTotales > 0 ? Math.min(100, (diasTranscurridos / diasTotales) * 100) : 0;
  // Calcular montos (usando el precio de la propiedad)
  const montoMensual = propiedad.precio || 0;
  const montoAcumulado = (diasTranscurridos / 30) * montoMensual;
  const montoTotal = (diasTotales / 30) * montoMensual;
  // Determinar estado
  let estado = 'OCUPADA';
  if (contratoActivo.esMantenimiento || contratoActivo.tipoContrato === 'MANTENIMIENTO') {
    estado = 'MANTENIMIENTO';
  }
  return {
    porcentaje,
    diasTranscurridos,
    diasTotales,
    diasRestantes,
    estadoTiempo,
    montoAcumulado,
    montoTotal,
    tieneContrato: true,
    contrato: contratoActivo,
    estado
  };
};

// Componente auxiliar para las secciones de la vista lista
const PropiedadListSections = ({
  progresoOcupacion,
  simboloMoneda,
  montoMensual,
  nombreCuenta,
  inquilinos,
  inquilinosActivos,
  inquilinosFinalizados,
  habitaciones,
  habitacionesAgrupadas,
  totalHabitaciones,
  getNombreTipoHabitacion,
  inventarios,
  ciudad,
  metrosCuadrados,
  direccion,
  allOpen = false
}) => {
  const [expandedSections, setExpandedSections] = React.useState({
    financiera: allOpen,
    inquilinos: allOpen,
    habitaciones: allOpen,
    inventario: allOpen,
    location: allOpen
  });
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
      {/* Progreso de ocupación */}
      <Box sx={{ mt: 0.25 }}>
        {progresoOcupacion.tieneContrato && (
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                {progresoOcupacion.diasTranscurridos}/{progresoOcupacion.diasTotales} días
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                {Math.round(progresoOcupacion.porcentaje)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progresoOcupacion.porcentaje}
              sx={{ 
                height: 3,
                borderRadius: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: progresoOcupacion.estado === 'MANTENIMIENTO' ? 'warning.main' : 'primary.main'
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                {simboloMoneda} {progresoOcupacion.montoAcumulado.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                {simboloMoneda} {progresoOcupacion.montoTotal.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
      {/* Financiera */}
      <Box sx={{ mt: 0.25 }}>
        <Box onClick={() => toggleSection('financiera')} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
          <MoneyIcon sx={{ fontSize: '0.9rem', color: 'success.main' }} />
          <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
            {simboloMoneda} {montoMensual.toLocaleString()} <span style={{ color: '#aaa', fontWeight: 400, fontSize: '0.75rem' }}>mensual</span>
          </Typography>
          <IconButton size="small" sx={{ p: 0.25, transform: expandedSections.financiera ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <ExpandMoreIcon sx={{ fontSize: '0.9rem' }} />
          </IconButton>
        </Box>
        <Collapse in={expandedSections.financiera}>
          <Box sx={{ pl: 1, pt: 0.75, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
              Detalles financieros:
            </Typography>
            <Box sx={{ pl: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                • Mensualidad: {simboloMoneda} {montoMensual.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                • Depósito requerido: {simboloMoneda} {(montoMensual * 2).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                • Cuenta destino: {nombreCuenta}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                • Total contrato: {simboloMoneda} {progresoOcupacion.montoTotal.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Collapse>
      </Box>
      {/* Inquilinos */}
      <Box sx={{ mt: 0.25 }}>
        <Box onClick={() => toggleSection('inquilinos')} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
          <PeopleIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
            {inquilinosActivos.length} / {inquilinos.length} inquilino{inquilinos.length !== 1 ? 's' : ''}
          </Typography>
          <IconButton size="small" sx={{ p: 0.25, transform: expandedSections.inquilinos ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <ExpandMoreIcon sx={{ fontSize: '0.9rem' }} />
          </IconButton>
        </Box>
        <Collapse in={expandedSections.inquilinos}>
          <PropiedadListView 
            type="inquilinos" 
            data={inquilinos}
            inquilinosActivos={inquilinosActivos}
            inquilinosFinalizados={inquilinosFinalizados}
          />
        </Collapse>
      </Box>
      {/* Habitaciones */}
      <Box sx={{ mt: 0.25 }}>
        <Box onClick={() => toggleSection('habitaciones')} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
          <BedIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
            {totalHabitaciones} habitaciones ({habitaciones.filter(h => h.tipo === 'DORMITORIO_SIMPLE' || h.tipo === 'DORMITORIO_DOBLE').length} dormitorios)
          </Typography>
          <IconButton size="small" sx={{ p: 0.25, transform: expandedSections.habitaciones ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <ExpandMoreIcon sx={{ fontSize: '0.9rem' }} />
          </IconButton>
        </Box>
        <Collapse in={expandedSections.habitaciones}>
          <PropiedadListView 
            type="habitaciones" 
            data={habitaciones}
            habitacionesAgrupadas={habitacionesAgrupadas}
            totalHabitaciones={totalHabitaciones}
            getNombreTipoHabitacion={getNombreTipoHabitacion}
          />
        </Collapse>
      </Box>
      {/* Inventario */}
      <Box sx={{ mt: 0.25 }}>
        <Box onClick={() => toggleSection('inventario')} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
          <InventoryIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
            {inventarios.length} {inventarios.length === 1 ? 'item' : 'items'} en inventario
          </Typography>
          <IconButton size="small" sx={{ p: 0.25, transform: expandedSections.inventario ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <ExpandMoreIcon sx={{ fontSize: '0.9rem' }} />
          </IconButton>
        </Box>
        <Collapse in={expandedSections.inventario}>
          <PropiedadListView 
            type="inventario" 
            data={inventarios}
          />
        </Collapse>
      </Box>
      {/* Localización */}
      <Box sx={{ mt: 0.25 }}>
        <Box onClick={() => toggleSection('location')} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
          <LocationOn sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
            {ciudad} ({metrosCuadrados}m²)
          </Typography>
          <IconButton size="small" sx={{ p: 0.25, transform: expandedSections.location ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
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
  );
};

const PropiedadCard = ({ propiedad, onEdit, onDelete, isDashboard = false, isExpanded = false, onToggleExpand, viewMode = 'grid', setViewMode = () => {} }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [expandedSections, setExpandedSections] = useState({
    inquilinos: false,
    contratos: false,
    detalles: false,
    habitaciones: false,
    inventario: false,
    price: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Usar el estado del backend
  const estado = propiedad.estado || 'DISPONIBLE';
  const color = STATUS_COLORS[estado] || '#9e9e9e';
  const icon = STATUS_ICONS[estado] || <PendingActions fontSize="small" />;

  // Extraer valores para mostrar
  const titulo = propiedad.titulo || 'Sin título';
  const direccion = propiedad.direccion || '';
  const ciudad = propiedad.ciudad || '';
  const metrosCuadrados = propiedad.metrosCuadrados || 0;
  const montoMensual = propiedad.precio || 0;
  const simboloMoneda = propiedad.cuenta?.moneda?.simbolo || propiedad.moneda?.simbolo || '$';
  const nombreCuenta = propiedad.cuenta?.nombre || 'No especificada';
  const moneda = propiedad.cuenta?.moneda?.nombre || propiedad.moneda?.nombre || '';
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

  // Filtrar activos y finalizados
  const inquilinosActivos = (propiedad.inquilinos || []).filter(i => i.estado === 'ACTIVO');
  const inquilinosFinalizados = (propiedad.inquilinos || []).filter(i => i.estado !== 'ACTIVO');
  const contratosActivos = (propiedad.contratos || []).filter(c => c.estado === 'ACTIVO');
  const contratosFinalizados = (propiedad.contratos || []).filter(c => c.estado !== 'ACTIVO');

  // Agrupar inquilinos por estado
  const inquilinosPorEstado = inquilinos.reduce((acc, inquilino) => {
    if (!acc[inquilino.estado]) {
      acc[inquilino.estado] = [];
    }
    acc[inquilino.estado].push(inquilino);
    return acc;
  }, {});

  // Calcular cantidades
  const totalHabitaciones = habitaciones.length;

  // Generar títulos con pluralización correcta
  const tituloInquilinosContratos = `${inquilinosActivos.length} ${pluralizar(inquilinosActivos.length, 'inquilino', 'inquilinos')} - ${contratosActivos.length} ${pluralizar(contratosActivos.length, 'contrato activo', 'contratos activos')}`;

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

  // Calcular progreso del contrato
  const progresoContrato = calcularProgresoContrato(contratos, montoMensual);
  
  // Calcular progreso de ocupación de la propiedad
  const progresoOcupacion = calcularProgresoOcupacion(propiedad);

  // --- MOVER AQUÍ LA LÓGICA DE SECCIONES ---
  const propiedadData = {
    ...propiedad,
    direccion: propiedad.direccion || direccion,
    ciudad: propiedad.ciudad || ciudad,
    metrosCuadrados: propiedad.metrosCuadrados || metrosCuadrados,
    tipo: propiedad.tipo || undefined
  };

  return (
    <StyledCard sx={{ bgcolor: 'background.default' }}>
      {/* Header con título y acciones */}
      <Box sx={{ 
        p: 1.5, 
        pb: 1,
        display: 'flex', 
        flexDirection: 'column',
        gap: 1,
        bgcolor: 'background.default'
      }}>
        {/* Título y botones de acción */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%'
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {/* Título de la propiedad */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HomeWork sx={{ fontSize: '1.1rem', color: 'text.primary' }} />
              <Typography variant="subtitle1" sx={{ 
                fontWeight: 500, 
                fontSize: '0.9rem',
                lineHeight: 1.2
              }}>
                {titulo}
              </Typography>
            </Box>
            
            {/* Estado de la propiedad */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                fontSize: '1.1rem', 
                color: color,
                display: 'flex',
                alignItems: 'center',
                '& .MuiSvgIcon-root': {
                  fontSize: '1.1rem'
                }
              }}>
                {icon}
              </Box>
              <Typography variant="body2" sx={{ 
                fontSize: '0.75rem',
                color: color,
                fontWeight: 500
              }}>
                {estado.charAt(0) + estado.slice(1).toLowerCase()}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title={viewMode === 'list' ? "Cambiar a Vista Grid" : "Cambiar a Vista Lista"}>
              <IconButton
                size="small"
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                sx={{
                  color: viewMode === 'grid' ? 'primary.main' : 'text.secondary',
                  padding: 0.25,
                  bgcolor: 'transparent',
                  border: 'none',
                  transition: 'color 0.2s',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    color: 'primary.main'
                  }
                }}
              >
                {viewMode === 'list' ? (
                  <GridViewIcon sx={{ fontSize: '0.9rem' }} />
                ) : (
                  <ListViewIcon sx={{ fontSize: '0.9rem' }} />
                )}
              </IconButton>
            </Tooltip>
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
            <Tooltip title={isExpanded ? "Colapsar" : "Expandir"}>
              <IconButton
                size="small"
                onClick={onToggleExpand}
                sx={{ 
                  color: 'text.secondary',
                  padding: 0.25,
                  transform: isExpanded ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s'
                }}
              >
                <ExpandMoreIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        {/* Vista compacta solo en colapsado */}
        {!isExpanded && (
          <CardContent sx={{ p: 1, pb: 0.5 }}>
            {viewMode === 'list' ? (
              // Vista lista colapsada igual que la extendida
              <PropiedadListSections
                progresoOcupacion={progresoOcupacion}
                simboloMoneda={simboloMoneda}
                montoMensual={montoMensual}
                nombreCuenta={nombreCuenta}
                inquilinos={inquilinos}
                inquilinosActivos={inquilinosActivos}
                inquilinosFinalizados={inquilinosFinalizados}
                habitaciones={habitaciones}
                habitacionesAgrupadas={habitacionesAgrupadas}
                totalHabitaciones={totalHabitaciones}
                getNombreTipoHabitacion={getNombreTipoHabitacion}
                inventarios={inventarios}
                ciudad={ciudad}
                metrosCuadrados={metrosCuadrados}
                direccion={direccion}
                allOpen={false}
              />
            ) : (
              // Vista grid compacta (como hasta ahora)
              <>
                {/* Barra de progreso de ocupación arriba de las secciones */}
                {progresoOcupacion.tieneContrato && (
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                        {progresoOcupacion.diasTranscurridos}/{progresoOcupacion.diasTotales} días
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                        {Math.round(progresoOcupacion.porcentaje)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={progresoOcupacion.porcentaje}
                      sx={{ 
                        height: 3,
                        borderRadius: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: progresoOcupacion.estado === 'MANTENIMIENTO' ? 'warning.main' : 'primary.main'
                        }
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                        {simboloMoneda} {progresoOcupacion.montoAcumulado.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                        {simboloMoneda} {progresoOcupacion.montoTotal.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                )}
          <PropiedadGridView
            type="sections"
            data={{ extendida: false }}
            propiedad={propiedadData}
            precio={montoMensual}
            simboloMoneda={simboloMoneda}
            nombreCuenta={nombreCuenta}
            moneda={moneda}
            inquilinos={inquilinos}
            habitaciones={habitaciones}
            contratos={contratos}
            inventario={inventarios}
            sectionGridSize={{ xs: 12, sm: 12, md: 12, lg: 12 }}
            showCollapseButton={false}
            isCollapsed={false}
                  onEdit={onEdit}
                  onDelete={onDelete}
          />
              </>
            )}
          </CardContent>
        )}
      </Box>

      {isExpanded && (
        <CardContent sx={{ 
          p: 1, 
          pb: 0.5, 
          maxHeight: 400, 
          overflowY: 'auto',
          '&:last-child': { pb: 0.5 },
          bgcolor: 'background.default',
          // Estilos para la barra de desplazamiento
          '&::-webkit-scrollbar': {
            width: '4px',
            backgroundColor: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.2)'
            }
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent'
          },
          // Firefox
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 0, 0, 0.1) transparent'
        }}>
          {viewMode === 'list' ? (
            // Vista lista extendida
            <PropiedadListSections
              progresoOcupacion={progresoOcupacion}
              simboloMoneda={simboloMoneda}
              montoMensual={montoMensual}
              nombreCuenta={nombreCuenta}
              inquilinos={inquilinos}
              inquilinosActivos={inquilinosActivos}
              inquilinosFinalizados={inquilinosFinalizados}
              habitaciones={habitaciones}
              habitacionesAgrupadas={habitacionesAgrupadas}
              totalHabitaciones={totalHabitaciones}
              getNombreTipoHabitacion={getNombreTipoHabitacion}
              inventarios={inventarios}
              ciudad={ciudad}
              metrosCuadrados={metrosCuadrados}
              direccion={direccion}
              allOpen={true}
            />
          ) : (
            // Vista grid extendida (restaurar la original)
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {/* Barra de progreso de ocupación */}
              {progresoOcupacion.tieneContrato && (
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                      {progresoOcupacion.diasTranscurridos}/{progresoOcupacion.diasTotales} días
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                      {Math.round(progresoOcupacion.porcentaje)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                    value={progresoOcupacion.porcentaje}
                      sx={{ 
                        height: 3,
                        borderRadius: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                        backgroundColor: progresoOcupacion.estado === 'MANTENIMIENTO' ? 'warning.main' : 'primary.main'
                        }
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                      {simboloMoneda} {progresoOcupacion.montoAcumulado.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                      {simboloMoneda} {progresoOcupacion.montoTotal.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                )}
                <PropiedadGridView
                  type="sections"
                  data={{ extendida: true }}
                  propiedad={propiedadData}
                  precio={montoMensual}
                  simboloMoneda={simboloMoneda}
                  nombreCuenta={nombreCuenta}
                  moneda={moneda}
                  inquilinos={inquilinos}
                  habitaciones={habitaciones}
                  contratos={contratos}
                  inventario={inventarios}
                  sectionGridSize={{ xs: 12, sm: 12, md: 12, lg: 12 }}
                  showCollapseButton={false}
                  isCollapsed={false}
                onEdit={onEdit}
                onDelete={onDelete}
              />
                      </Box>
                    )}
        </CardContent>
      )}
    </StyledCard>
  );
};

export default PropiedadCard; 