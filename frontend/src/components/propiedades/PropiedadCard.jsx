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
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
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
  Description as ContractIcon,
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
  MonetizationOnOutlined as MoneyIcon,
  InsertDriveFile as InsertDriveFileIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { EntityActions } from '../EntityViews/EntityActions';
import PropiedadGridView, { crearSeccionesPropiedad } from './PropiedadGridView';
import PropiedadListView from './PropiedadListView';
import { Link } from 'react-router-dom';
import BarraEstadoPropiedad from './BarraEstadoPropiedad';
import { pluralizar, getEstadoContrato, getInquilinoStatusColor, agruparHabitaciones, calcularProgresoOcupacion } from './propiedadUtils';
import { SeccionInquilinos, SeccionHabitaciones, SeccionInventario, SeccionDocumentos } from './SeccionesPropiedad';

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
  const montoMensual = propiedad.montoMensual || 0;
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

  // Calcular progreso de ocupación de la propiedad
  const progresoOcupacion = calcularProgresoOcupacion(propiedad);

  // Combinar documentos y contratos para la sección de documentos
  const documentosCombinados = [
    ...(propiedad.documentos || []),
    ...(propiedad.contratos || []).map(contrato => ({
      nombre: `Contrato ${contrato._id}`,
      categoria: 'CONTRATO',
      url: contrato.documentoUrl || `/contratos/${contrato._id}`,
      fechaCreacion: contrato.fechaInicio,
      // Puedes agregar más campos si los usas en la UI
    }))
  ];

  // --- MOVER AQUÍ LA LÓGICA DE SECCIONES ---
  const propiedadData = {
    ...propiedad,
    direccion: propiedad.direccion || direccion,
    ciudad: propiedad.ciudad || ciudad,
    metrosCuadrados: propiedad.metrosCuadrados || metrosCuadrados,
    tipo: propiedad.tipo || undefined
  };

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

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
            <EntityActions 
              onEdit={() => onEdit(propiedad)}
              onDelete={() => setOpenDeleteDialog(true)}
              itemName={titulo}
            />
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
            {/* Solo mostrar barra de progreso de ocupación si existe */}
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
          </CardContent>
        )}
      </Box>
      {isExpanded && (
        <>
          <BarraEstadoPropiedad
            diasTranscurridos={progresoOcupacion.diasTranscurridos}
            diasTotales={progresoOcupacion.diasTotales}
            porcentaje={progresoOcupacion.porcentaje}
            simboloMoneda={simboloMoneda}
            montoAcumulado={progresoOcupacion.montoAcumulado}
            montoTotal={progresoOcupacion.montoTotal}
            color={progresoOcupacion.estado === 'MANTENIMIENTO' ? 'warning.main' : 'primary.main'}
            estado={progresoOcupacion.estado}
          />
          {/* Renderizado de vista seleccionada (grid/list) */}
          {viewMode === 'list' ? (
            <PropiedadListView
              propiedad={propiedad}
              habitaciones={habitaciones}
              habitacionesAgrupadas={habitacionesAgrupadas}
              totalHabitaciones={totalHabitaciones}
              getNombreTipoHabitacion={getNombreTipoHabitacion}
              inventarios={inventarios}
              ciudad={ciudad}
              metrosCuadrados={metrosCuadrados}
              direccion={direccion}
              documentos={documentosCombinados}
              contratos={contratos}
            />
          ) : (
            <PropiedadGridView
              type="sections"
              data={{ extendida: true }}
              propiedad={propiedad}
              habitaciones={habitaciones}
              contratos={contratos}
              inventario={inventarios}
              documentos={documentosCombinados}
              precio={montoMensual}
              simboloMoneda={simboloMoneda}
              nombreCuenta={nombreCuenta}
              moneda={moneda}
              ciudad={ciudad}
              metrosCuadrados={metrosCuadrados}
              direccion={direccion}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        </>
      )}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar esta propiedad? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={() => { setOpenDeleteDialog(false); onDelete(propiedad._id || propiedad.id); }} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </StyledCard>
  );
};

export default PropiedadCard; 