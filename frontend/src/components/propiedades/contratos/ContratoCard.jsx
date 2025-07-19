import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Collapse,
  IconButton,
  Tooltip,
  LinearProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Description as ContractIcon,
  CheckCircleOutline,
  PendingActions,
  BookmarkAdded,
  EditOutlined as EditIcon,
  DeleteOutlined as DeleteIcon,
  ViewListOutlined as ListViewIcon,
  GridViewOutlined as GridViewIcon,
  AccountBalanceWalletOutlined as DepositIcon,
  AccountBalance as BankIcon,
  MonetizationOnOutlined as MoneyIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  Visibility as ViewIcon,
  HomeWork
} from '@mui/icons-material';
import ContratosGridView, { crearSeccionesContrato } from './ContratosGridView';
import ContratoDetail from './ContratoDetail';
import { Link } from 'react-router-dom';
import { 
  getEstadoLabel, 
  getEstadoContrato, 
  calcularDuracionTotal, 
  calcularTiempoRestante,
  calcularAlquilerMensualPromedio,
  calcularPrecioTotalContrato,
  calcularProgresoContrato,
  generarCuotasMensuales,
  getCuentaYMoneda,
  calcularEstadoCuotasContrato
} from './contratoUtils';
import { useValuesVisibility } from '../../../context/ValuesVisibilityContext';
import { EntityActions } from '../../EntityViews';
import BarraEstadoPropiedad from '../BarraEstadoPropiedad';
import { StyledCard, StatusChip } from '../PropiedadStyles';
import { getEstadoColor, getEstadoText, getEstadoIcon, getStatusIconComponent } from '../../common/StatusSystem';





// STATUS_COLORS movido a StatusSystem.js

// Color blanco para la barra de estado
const colorBarraEstado = 'common.white';

const ContratoCard = ({ 
  contrato, 
  onEdit, 
  onDelete, 
  isExpanded = false, 
  onToggleExpand, 
  viewMode = 'grid',
  relatedData = {},
  showValues = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showValues: globalShowValues } = useValuesVisibility();
  const finalShowValues = showValues !== undefined ? showValues : globalShowValues;
  
  // Estados locales
  const [detailOpen, setDetailOpen] = useState(false);
  const [localViewMode, setLocalViewMode] = useState(viewMode);

  // Usar el estado del backend
  const estado = getEstadoContrato(contrato) || 'PLANEADO';
  const color = getEstadoColor(estado, 'CONTRATO');
  const icon = getStatusIconComponent(estado, 'CONTRATO');

  // Extraer valores para mostrar
  let titulo = 'Sin inquilino';
  if (Array.isArray(contrato.inquilino) && contrato.inquilino.length > 0) {
    const inq = contrato.inquilino[0];
    if (typeof inq === 'object' && (inq.nombre || inq.apellido)) {
      titulo = `${inq.nombre || ''} ${inq.apellido || ''}`.trim();
    } else if (typeof inq === 'string') {
      titulo = inq;
    }
  }

  const direccion = contrato.propiedad?.direccion || '';
  const ciudad = contrato.propiedad?.ciudad || '';
  const montoMensual = calcularAlquilerMensualPromedio(contrato);
  
  // Usar la función centralizada para obtener cuenta y moneda
  const { simboloMoneda, nombreCuenta } = getCuentaYMoneda(contrato, relatedData);
  
  const moneda = contrato.moneda?.nombre || contrato.cuenta?.moneda?.nombre || '';
  const inquilinos = contrato.inquilino || [];
  const fechaInicio = contrato.fechaInicio;
  const fechaFin = contrato.fechaFin;

  // Calcular progreso del contrato
  const progresoContrato = calcularProgresoContrato(contrato);

  // Calcular estado de cuotas
  const estadoCuotas = calcularEstadoCuotasContrato(contrato);
  const cuotasVencidas = estadoCuotas.cuotasVencidas;
  const proximaCuota = estadoCuotas.proximaCuota;

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(contrato);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(contrato._id || contrato.id);
  };

  const handleToggleExpand = (e) => {
    e.stopPropagation();
    if (onToggleExpand) {
      onToggleExpand(contrato._id || contrato.id);
    }
  };

  // Datos unificados para ContratosGridView
  const contratoData = {
    ...contrato,
    propiedad: contrato.propiedad,
    inquilino: contrato.inquilino,
    cuenta: contrato.cuenta,
    moneda: contrato.moneda,
    fechaInicio: contrato.fechaInicio,
    fechaFin: contrato.fechaFin,
    montoMensual: calcularAlquilerMensualPromedio(contrato),
    tipoContrato: contrato.tipoContrato,
    esMantenimiento: contrato.esMantenimiento
  };

  return (
    <StyledCard sx={{ bgcolor: 'background.default' }}>
      {/* Header con título y acciones */}
      <Box 
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          bgcolor: 'background.default',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover'
          }
        }}
        onClick={() => setDetailOpen(true)}
      >
        {/* Título y botones de acción */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%'
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
            {/* Título del contrato */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ContractIcon sx={{ fontSize: '1.1rem', color: 'text.primary' }} />
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: 500, 
                    fontSize: '0.9rem',
                    lineHeight: 1.2
                  }}>
                    {titulo}
                  </Typography>
                </Box>
                <StatusChip customcolor={color}>
                  {icon}
                  <span>{getEstadoText(estado, 'CONTRATO')}</span>
                </StatusChip>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Ver detalle">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailOpen(true);
                }}
                sx={{ 
                  color: 'text.secondary',
                  padding: 0.25
                }}
              >
                <ViewIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
            {/* Elimino los botones de cambiar vista y colapsar */}
            <EntityActions 
              onEdit={(e) => {
                e.stopPropagation();
                onEdit(contrato);
              }}
              onDelete={(e) => {
                e.stopPropagation();
                onDelete(contrato._id || contrato.id);
              }}
              itemName={titulo}
            />
          </Box>
        </Box>
        {/* Vista compacta solo en colapsado */}
        {!isExpanded && (
          <CardContent sx={{ p: 0, pb: 0.5 }}>
            {/* Barra de progreso del contrato en vista colapsada */}
            {progresoContrato.tieneContrato && (
              <BarraEstadoPropiedad
                diasTranscurridos={progresoContrato.diasTranscurridos}
                diasTotales={progresoContrato.diasTotales}
                porcentaje={progresoContrato.porcentaje}
                simboloMoneda={simboloMoneda}
                montoMensual={montoMensual}
                montoTotal={progresoContrato.montoTotal}
                color={colorBarraEstado}
                estado={estado}
                // Datos de cuotas para progreso financiero real
                montoAcumulado={estadoCuotas.montoPagado}
                cuotasPagadas={estadoCuotas.cuotasPagadas}
                cuotasTotales={estadoCuotas.cuotasTotales}
              />
            )}
            {localViewMode === 'grid' ? (
              <ContratosGridView
                type="sections"
                data={{ extendida: false }}
                title={null}
                contrato={contratoData}
                relatedData={relatedData}
                sectionGridSize={{ xs: 12, sm: 12, md: 12, lg: 12 }}
                showCollapseButton={false}
                isCollapsed={false}
              />
            ) : (
              // Vista Lista: Solo info financiera e inquilinos (sin fechas ni ubicación)
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {/* Información financiera */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  justifyContent: 'space-between',
                  p: 1,
                  borderRadius: 0
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <MoneyIcon sx={{ fontSize: '0.8rem', color: 'success.main' }} />
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      {simboloMoneda} {montoMensual.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <BankIcon sx={{ fontSize: '0.8rem', color: 'info.main' }} />
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      {nombreCuenta}
                    </Typography>
                  </Box>
                </Box>

                {/* Información de inquilinos */}
                {inquilinos.length > 0 && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    p: 1,
                    borderRadius: 0
                  }}>
                    <PeopleIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      {inquilinos.length} {inquilinos.length === 1 ? 'inquilino' : 'inquilinos'}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        )}
      </Box>

      {isExpanded && (
        <CardContent sx={{
          p: 0,
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            {localViewMode === 'grid' ? (
              // Vista Grid: Colapso controlado solo por isExpanded
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {/* Barra de progreso del contrato */}
                {progresoContrato.tieneContrato && (
                  <BarraEstadoPropiedad
                    diasTranscurridos={progresoContrato.diasTranscurridos}
                    diasTotales={progresoContrato.diasTotales}
                    porcentaje={progresoContrato.porcentaje}
                    simboloMoneda={simboloMoneda}
                    montoMensual={montoMensual}
                    montoTotal={progresoContrato.montoTotal}
                    color={colorBarraEstado}
                    estado={estado}
                    // Datos de cuotas para progreso financiero real
                    montoAcumulado={estadoCuotas.montoPagado}
                    cuotasPagadas={estadoCuotas.cuotasPagadas}
                    cuotasTotales={estadoCuotas.cuotasTotales}
                  />
                )}
                <ContratosGridView
                  type="sections"
                  data={{ extendida: true }}
                  title={null}
                  contrato={contratoData}
                  relatedData={relatedData}
                  sectionGridSize={{ xs: 12, sm: 12, md: 12, lg: 12 }}
                  showCollapseButton={false}
                  isCollapsed={false}
                />
              </Box>
            ) : (
              // Vista Lista: Información detallada
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {/* Información financiera */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  justifyContent: 'space-between',
                  p: 1,
                  borderRadius: 0
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <MoneyIcon sx={{ fontSize: '0.8rem', color: 'success.main' }} />
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      {simboloMoneda} {montoMensual.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <BankIcon sx={{ fontSize: '0.8rem', color: 'info.main' }} />
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      {nombreCuenta}
                    </Typography>
                  </Box>
                </Box>

                {/* Información de inquilinos */}
                {inquilinos.length > 0 && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    p: 1,
                    borderRadius: 0
                  }}>
                    <PeopleIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      {inquilinos.length} {inquilinos.length === 1 ? 'inquilino' : 'inquilinos'}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </CardContent>
      )}
      
      {/* Popup de detalle */}
      <ContratoDetail
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        contrato={contrato}
        onEdit={onEdit}
        onDelete={onDelete}
        relatedData={relatedData}
      />
    </StyledCard>
  );
};

export default ContratoCard; 
