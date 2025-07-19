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
  CheckCircleOutline,
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
import { EntityActions } from '../EntityViews';
import PropiedadGridView, { crearSeccionesPropiedad } from './PropiedadGridView';
import PropiedadListView from './PropiedadListView';
import { Link } from 'react-router-dom';
import BarraEstadoPropiedad from './BarraEstadoPropiedad';
import { 
  pluralizar, 
  getEstadoContrato, 
  agruparHabitaciones, 
  calcularProgresoOcupacion, 
  getCuentaYMoneda
} from './propiedadUtils';
import PropiedadHeader from './PropiedadHeader';
import { SeccionInquilinos, SeccionHabitaciones, SeccionDocumentos } from './SeccionesPropiedad';
import { calcularAlquilerMensualPromedio, calcularEstadoFinanzasContrato, calcularEstadoCuotasContrato } from './contratos/contratoUtils';
import EstadoFinanzasContrato from './contratos/EstadoFinanzasContrato';
import { CuotasProvider } from './contratos/context/CuotasContext';
import { getEstadoColor, getEstadoText, getStatusIconComponent } from '../common/StatusSystem';
import { StyledCard, StatusChip } from './PropiedadStyles';

// Función para calcular el monto mensual promedio desde contratos activos
const calcularMontoMensualDesdeContratos = (contratos = []) => {
  if (!contratos || contratos.length === 0) return 0;
  
  // Buscar contrato activo (no de mantenimiento)
  let contratoReferencia = contratos.find(contrato => 
    contrato.estado === 'ACTIVO' && 
    !contrato.esMantenimiento && 
    contrato.tipoContrato === 'ALQUILER'
  );
  
  // Si no hay activo, buscar planeado
  if (!contratoReferencia) {
    contratoReferencia = contratos.find(contrato => 
      contrato.estado === 'PLANEADO' && 
      !contrato.esMantenimiento && 
      contrato.tipoContrato === 'ALQUILER'
    );
  }
  
  // Si no hay planeado, buscar cualquier contrato de alquiler
  if (!contratoReferencia) {
    contratoReferencia = contratos.find(contrato => 
      !contrato.esMantenimiento && 
      contrato.tipoContrato === 'ALQUILER'
    );
  }
  
  if (!contratoReferencia) return 0;
  
  // Usar la función centralizada de contratoUtils
  return calcularAlquilerMensualPromedio(contratoReferencia);
};





const PropiedadCard = ({ propiedad, onEdit, onDelete, isAssets = false, isExpanded = false, onToggleExpand, viewMode = 'grid', setViewMode = () => {} }) => {


  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [expandedSections, setExpandedSections] = useState({
    inquilinos: false,
    contratos: false,
    detalles: false,
    habitaciones: false,
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
  const color = getEstadoColor(estado, 'PROPIEDAD');
  const icon = getStatusIconComponent(estado, 'PROPIEDAD');
  


  // Extraer valores para mostrar
  const alias = propiedad.alias || 'Sin alias';
  const direccion = propiedad.direccion || '';
  const ciudad = propiedad.ciudad || '';
  const metrosCuadrados = propiedad.metrosCuadrados || 0;
  const montoMensual = calcularMontoMensualDesdeContratos(propiedad.contratos);
  
  // Usar la función centralizada para obtener cuenta y moneda
  const { simbolo, nombreCuenta } = getCuentaYMoneda(propiedad, {});
  
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
  
  // Calcular estado de cuotas para progreso financiero real
  const contratoActivo = contratos.find(contrato => getEstadoContrato(contrato) === 'ACTIVO');
  const estadoCuotas = contratoActivo ? calcularEstadoCuotasContrato(contratoActivo) : {
    montoPagado: 0,
    cuotasPagadas: 0,
    cuotasTotales: 0
  };

  // Combinar documentos y contratos para la sección de documentos
  const documentosCombinados = [
    ...(propiedad.documentos || []),
    ...(propiedad.contratos || [])
      .filter(contrato => contrato.documentoUrl) // Solo contratos con documento real
      .map(contrato => ({
        nombre: `Contrato ${contrato._id}`,
        categoria: 'CONTRATO',
        url: contrato.documentoUrl,
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

  // Componente reutilizable para la barra de progreso
  const renderBarraProgreso = () => {
    if (!progresoOcupacion.tieneContrato) return null;
    
    return (
      <BarraEstadoPropiedad
        diasTranscurridos={progresoOcupacion.diasTranscurridos}
        diasTotales={progresoOcupacion.diasTotales}
        porcentaje={progresoOcupacion.porcentaje}
        simboloMoneda={simbolo}
        montoMensual={montoMensual}
        montoTotal={progresoOcupacion.montoTotal}
        color={progresoOcupacion.estado === 'MANTENIMIENTO' ? 'warning.main' : 'primary.main'}
        estado={progresoOcupacion.estado}
        // Datos de cuotas para progreso financiero real
        montoAcumulado={estadoCuotas.montoPagado}
        cuotasPagadas={estadoCuotas.cuotasPagadas}
        cuotasTotales={estadoCuotas.cuotasTotales}
      />
    );
  };

  // Componente para mostrar el estado de las cuotas
  const renderSeccionFinanzas = () => {
    if (!progresoOcupacion.tieneContrato) return null;
    // Buscar contrato activo
    if (!contratoActivo) return null;
    return (
      <CuotasProvider 
        contratoId={contratoActivo._id || contratoActivo.id}
        formData={contratoActivo}
      >
        <EstadoFinanzasContrato 
          contrato={contratoActivo} 
          contratoId={contratoActivo._id || contratoActivo.id} 
        />
      </CuotasProvider>
    );
  };

  // Componente reutilizable para el header de la propiedad
  const renderHeader = () => (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%'
    }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <PropiedadHeader 
          propiedad={propiedad} 
          showEstado={true}
          iconSize="1.1rem"
          titleSize="subtitle1"
          titleWeight={500}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title={viewMode === 'list' ? "Cambiar a Vista Grid" : "Cambiar a Vista Lista"}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setViewMode(viewMode === 'list' ? 'grid' : 'list');
            }}
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
          itemName={alias}
        />
        <Tooltip title={isExpanded ? "Colapsar" : "Expandir"}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
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
  );

  // Componente reutilizable para el contenido expandido
  const renderContenidoExpandido = () => (
    <>
      {renderSeccionFinanzas()}
      {/* Renderizado de vista seleccionada (grid/list) */}
      {viewMode === 'list' ? (
        <PropiedadListView
          propiedad={propiedad}
          habitaciones={habitaciones}
          habitacionesAgrupadas={habitacionesAgrupadas}
          totalHabitaciones={totalHabitaciones}
          getNombreTipoHabitacion={getNombreTipoHabitacion}
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
          documentos={documentosCombinados}
          precio={montoMensual}
          simboloMoneda={simbolo}
          nombreCuenta={nombreCuenta}
          moneda={moneda}
          ciudad={ciudad}
          metrosCuadrados={metrosCuadrados}
          direccion={direccion}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
      <SeccionDocumentos documentos={documentosCombinados} />
    </>
  );

  return (
    <StyledCard sx={{ bgcolor: 'background.default' }}>
      {/* Header con título y acciones */}
      <Box 
        sx={{ 
          p: 1.5, 
          pb: 1,
          display: 'flex', 
          flexDirection: 'column',
          gap: 1,
          bgcolor: 'background.default',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover'
          }
        }}
        onClick={onToggleExpand}
      >
        {renderHeader()}
        {/* Vista compacta solo en colapsado - solo barra de progreso */}
        {!isExpanded && (
          <CardContent sx={{ p: 1, pb: 0.5 }}>
            {renderBarraProgreso()}
          </CardContent>
        )}
      </Box>
      {isExpanded && renderContenidoExpandido()}
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
