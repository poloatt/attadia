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

  AccountBalanceWalletOutlined,
  AccountBalance as BankIcon,
  MonetizationOnOutlined,
  InsertDriveFile as InsertDriveFileIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import CommonActions from '../common/CommonActions';
import CommonCard, { crearSeccionesPropiedad } from '../common/CommonCard';
import { Link } from 'react-router-dom';
import CommonProgressBar from '../common/CommonProgressBar';
import { 
  pluralizar, 
  getEstadoContrato, 
  agruparHabitaciones, 
  calcularProgresoOcupacion, 
  getCuentaYMoneda,
  calcularYearToDate,
  calcularYearToGo,
  getNombreTipoHabitacion
} from './propiedadUtils';
import CommonHeader from '../common/CommonHeader';
import { SeccionInquilinos, SeccionHabitaciones, SeccionDocumentos } from './SeccionesPropiedad';
import { calcularAlquilerMensualPromedio, calcularEstadoCuotasContrato } from './contratos/contratoUtils';
import { getEstadoColor, getEstadoText, getStatusIconComponent } from '../common/StatusSystem';
import { StyledCard, StatusChip } from './PropiedadStyles';
import EstadoIcon from '../common/EstadoIcon';
import TipoPropiedadIcon from './TipoPropiedadIcon';
import { CuotasProvider } from './contratos/context/CuotasContext';
import EstadoFinanzasContrato from './contratos/EstadoFinanzasContrato';


const PropiedadCard = ({ propiedad, onEdit, onDelete, isAssets = false, isExpanded = false, onToggleExpand, viewMode = 'grid', setViewMode = () => {}, onOpenDetail = null, onSyncSeccion }) => {


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
  const contratos = propiedad.contratos || [];
  const montoMensual = calcularAlquilerMensualPromedio(contratos.find(contrato => 
    getEstadoContrato(contrato) === 'ACTIVO' && 
    !contrato.esMantenimiento && 
    contrato.tipoContrato === 'ALQUILER'
  ));
  
  // Buscar contrato activo para obtener cuenta y moneda
  const contratoActivo = contratos.find(contrato => 
    getEstadoContrato(contrato) === 'ACTIVO' && 
    !contrato.esMantenimiento && 
    contrato.tipoContrato === 'ALQUILER'
  );
  
  // Obtener cuenta y moneda del contrato activo o de la propiedad
  let simbolo = '$';
  let nombreCuenta = 'No especificada';
  
  if (contratoActivo) {
    const cuentaYMoneda = getCuentaYMoneda(contratoActivo, {});
    simbolo = cuentaYMoneda.simbolo;
    nombreCuenta = cuentaYMoneda.nombreCuenta;
  } else if (propiedad.cuenta) {
    // Si no hay contrato activo, usar la cuenta de la propiedad
    if (typeof propiedad.cuenta === 'object') {
      nombreCuenta = propiedad.cuenta.nombre || nombreCuenta;
      if (propiedad.cuenta.moneda && typeof propiedad.cuenta.moneda === 'object') {
        simbolo = propiedad.cuenta.moneda.simbolo || simbolo;
      }
    }
  }
  
  // Obtener nombre de moneda para mostrar
  const moneda = (() => {
    if (contratoActivo?.cuenta?.moneda?.nombre) {
      return contratoActivo.cuenta.moneda.nombre;
    }
    if (contratoActivo?.moneda?.nombre) {
      return contratoActivo.moneda.nombre;
    }
    if (propiedad.cuenta?.moneda?.nombre) {
      return propiedad.cuenta.moneda.nombre;
    }
    if (propiedad.moneda?.nombre) {
      return propiedad.moneda.nombre;
    }
    return '';
  })();
  

  const habitaciones = propiedad.habitaciones || [];
  const numDormitorios = habitaciones.filter(h => 
    h.tipo === 'DORMITORIO_SIMPLE' || h.tipo === 'DORMITORIO_DOBLE'
  ).length;
  const dormitoriosSimples = habitaciones.filter(h => h.tipo === 'DORMITORIO_SIMPLE').length;
  const dormitoriosDobles = habitaciones.filter(h => h.tipo === 'DORMITORIO_DOBLE').length;
  const banos = habitaciones.filter(h => h.tipo === 'BAÑO' || h.tipo === 'TOILETTE').length;
  const inquilinos = propiedad.inquilinos || [];

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
  const habitacionesAgrupadas = agruparHabitaciones(propiedad.habitaciones || []);
  const dormitorios = (propiedad.habitaciones || []).filter(h => 
    h.tipo === 'DORMITORIO_SIMPLE' || h.tipo === 'DORMITORIO_DOBLE'
  ).length;

  // Calcular progreso de ocupación de la propiedad
  const progresoOcupacion = calcularProgresoOcupacion(propiedad);
  
  // Calcular estado de cuotas para progreso financiero real
  const estadoCuotas = contratoActivo ? calcularEstadoCuotasContrato(contratoActivo) : {
    montoPagado: 0,
    cuotasPagadas: 0,
    cuotasTotales: 0
  };
  
  // Calcular YTD y YTG para la propiedad
  const ytd = calcularYearToDate(propiedad);
  const ytg = calcularYearToGo(propiedad);



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

  // Eliminar la barra de progreso propia, solo dejar la de PropiedadGridView


  // Componente reutilizable para el header de la propiedad
  const renderHeader = () => {
    // Mostrar íconos de estado de todos los contratos relevantes
    const contratos = propiedad.contratos || [];
    const estadosMostrar = ['ACTIVO', 'RESERVADO', 'MANTENIMIENTO', 'PLANEADO'];
    const iconosEstados = contratos
      .filter(c => estadosMostrar.includes(getEstadoContrato(c)))
      .map((contrato, idx) => {
        const estado = getEstadoContrato(contrato);
        const color = getEstadoColor(estado, 'CONTRATO');
        const Icon = getStatusIconComponent(estado, 'CONTRATO').type;
        return (
          <Icon key={idx} sx={{ fontSize: '1.2rem', color, ml: idx > 0 ? 0.5 : 0, flexShrink: 0 }} />
        );
      });
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%'
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, flex: 1 }}>
          <CommonHeader
            icon={TipoPropiedadIcon}
            iconProps={{ tipo: propiedad.tipo, sx: { fontSize: isAssets ? '18px' : '1.1rem' } }}
            title={propiedad.alias || propiedad.titulo || 'Sin alias'}
            estado={propiedad.estado || 'DISPONIBLE'}
            tipo="PROPIEDAD"
            showEstado={false}
            titleSize={isAssets ? 'subtitle1' : 'subtitle1'}
            titleWeight={isAssets ? 600 : 500}
            gap={1}
            // Puedes pasar más props si lo necesitas
          />
        </Box>
        {/* Iconos de estado de contratos alineados a la derecha */}
        {iconosEstados.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1, mr: 1 }}>
            {iconosEstados}
          </Box>
        )}
        {!isAssets && (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {isExpanded && (
              <CommonActions 
                onEdit={() => onEdit(propiedad)}
                onDelete={() => setOpenDeleteDialog(true)}
                itemName={alias}
              />
            )}
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
        )}
        {isAssets && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {onOpenDetail && (
              <Tooltip title="Ver detalles completos">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetail(propiedad);
                  }}
                  sx={{ 
                    color: 'text.secondary',
                    padding: 0.25,
                    transition: 'color 0.2s',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      color: 'primary.main'
                    }
                  }}
                >
                  <OpenInNewIcon sx={{ fontSize: '0.9rem' }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>
    );
  };

  const seccionFinancieraPersonalizada = {
    type: 'primary',
    render: () => (
      <EstadoFinanzasContrato 
        contrato={contratoActivo}
        compact={false}
        sx={{ width: '100%' }}
      />
    )
  };

  const secciones = [
    seccionFinancieraPersonalizada,
    ...crearSeccionesPropiedad(
      propiedad,
      montoMensual,
      simbolo,
      nombreCuenta,
      moneda,
      habitaciones,
      contratos,
      documentosCombinados,
      true // extendida
    )
  ];

  const renderContenidoExpandido = () => (
    <CuotasProvider contratoId={contratoActivo?._id || contratoActivo?.id} formData={contratoActivo}>
      <CommonCard
        type="sections"
        sections={secciones}
        propiedad={propiedad}
        onEdit={onEdit}
        onDelete={onDelete}
        isExpanded={isExpanded}
        onSyncSeccion={onSyncSeccion}
      />
    </CuotasProvider>
  );

  return (
    <StyledCard 
      isAssets={isAssets}
      sx={{ 
        borderRadius: isAssets ? 1 : undefined,
        backgroundColor: isAssets ? '#181818 !important' : undefined
      }}
    >
      {/* Header con título y acciones */}
              <Box 
          sx={{ 
            p: isAssets ? (isExpanded ? 1 : 1) : 1.5, 
            pb: isAssets ? (isExpanded ? 0.5 : 0.5) : 1,
            display: 'flex', 
            flexDirection: 'column',
            gap: isAssets ? (isExpanded ? 0.5 : 0.5) : 1,
            cursor: 'pointer',
            '&:hover': {
              bgcolor: isAssets ? 'transparent' : 'action.hover'
            }
          }}
          onClick={onToggleExpand}
        >
        {renderHeader()}
        {/* Vista compacta solo en colapsado - solo barra de progreso */}
        {/* No mostrar nada en la versión colapsada */}
      </Box>
      {isExpanded && (
        <Box sx={{ 
          p: isAssets ? 1 : 0
        }}>
          {renderContenidoExpandido()}
        </Box>
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
