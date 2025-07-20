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





const PropiedadCard = ({ propiedad, onEdit, onDelete, isAssets = false, isExpanded = false, onToggleExpand, viewMode = 'grid', setViewMode = () => {}, onOpenDetail = null }) => {


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
  const montoMensual = calcularMontoMensualDesdeContratos(contratos);
  
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
    // Mostrar barra siempre, pero con diferentes datos según el estado
    if (progresoOcupacion.tieneContrato) {
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
          isCompact={isAssets && !isExpanded}
        />
      );
    } else {
      // Mostrar barra para propiedades sin contrato
      return (
        <BarraEstadoPropiedad
          diasTranscurridos={0}
          diasTotales={30}
          porcentaje={0}
          simboloMoneda={simbolo}
          montoMensual={0}
          montoTotal={0}
          color="text.secondary"
          estado={estado}
          // Sin datos de cuotas
          montoAcumulado={0}
          cuotasPagadas={0}
          cuotasTotales={0}
          isCompact={isAssets && !isExpanded}
        />
      );
    }
  };

  // Componente para mostrar el estado de las cuotas
  const renderSeccionFinanzas = () => {
    // Solo mostrar si hay contrato activo
    if (!contratoActivo) return null;
    return (
      <Box sx={{ 
        bgcolor: isAssets ? '#111' : 'transparent',
        '& .MuiPaper-root': {
          bgcolor: isAssets ? '#111' : undefined
        }
      }}>
        <CuotasProvider 
          contratoId={contratoActivo._id || contratoActivo.id}
          formData={contratoActivo}
        >
          <EstadoFinanzasContrato 
            contrato={contratoActivo} 
            contratoId={contratoActivo._id || contratoActivo.id} 
          />
        </CuotasProvider>
      </Box>
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
          iconSize={isAssets ? "18px" : "1.1rem"}
          titleSize={isAssets ? "subtitle1" : "subtitle1"}
          titleWeight={isAssets ? 600 : 500}
        />
      </Box>
      {!isAssets && (
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
      )}
      {isAssets && onOpenDetail && (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
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
        </Box>
      )}
    </Box>
  );

  // Componente reutilizable para el contenido expandido
  const renderContenidoExpandido = () => (
    <>
      {renderSeccionFinanzas()}
      {/* Renderizado de vista seleccionada (grid/list) */}
      {viewMode === 'list' ? (
        <Box sx={{ 
          bgcolor: isAssets ? '#222' : 'transparent',
          '& .MuiPaper-root': {
            bgcolor: isAssets ? '#222' : undefined
          }
        }}>
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
        </Box>
      ) : (
        <Box sx={{ 
          bgcolor: isAssets ? '#222' : 'transparent',
          '& .MuiPaper-root': {
            bgcolor: isAssets ? '#222' : undefined
          }
        }}>
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
        </Box>
              )}
        <Box sx={{ 
          bgcolor: isAssets ? '#222' : 'transparent',
          '& .MuiPaper-root': {
            bgcolor: isAssets ? '#222' : undefined
          }
        }}>
          <SeccionDocumentos documentos={documentosCombinados} />
        </Box>
    </>
  );

  return (
    <StyledCard sx={{ 
      bgcolor: isAssets ? '#222' : 'background.default',
      borderRadius: isAssets ? 1 : undefined
    }}>
      {/* Header con título y acciones */}
              <Box 
          sx={{ 
            p: isAssets ? (isExpanded ? 2 : 1) : 1.5, 
            pb: isAssets ? (isExpanded ? 1 : 0.5) : 1,
            display: 'flex', 
            flexDirection: 'column',
            gap: isAssets ? (isExpanded ? 1 : 0.5) : 1,
            bgcolor: isAssets ? '#222' : 'background.default',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: isAssets ? 'rgba(255,255,255,0.05)' : 'action.hover'
            }
          }}
          onClick={onToggleExpand}
        >
        {renderHeader()}
        {/* Vista compacta solo en colapsado - solo barra de progreso */}
        {!isExpanded && (
                      isAssets ? (
              <Box sx={{ 
                px: 0.25,
                pt: 0.25,
                bgcolor: '#222'
              }}>
                {renderBarraProgreso()}
              </Box>
            ) : (
            <CardContent sx={{ 
              p: 1,
              pb: 0.5,
              bgcolor: 'transparent'
            }}>
              {renderBarraProgreso()}
            </CardContent>
          )
        )}
      </Box>
      {isExpanded && (
        <Box sx={{ 
          bgcolor: isAssets ? '#222' : 'transparent',
          p: isAssets ? 2 : 0
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
