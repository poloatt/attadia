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
  CheckCircle,
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
  getEstadoColor, 
  getEstadoContrato, 
  calcularTiempoRestante, 
  calcularDuracionTotal 
} from './contratoUtils';

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

// Mapeo de iconos para estados
const STATUS_ICONS = {
  'ACTIVO': <CheckCircle fontSize="small" />,
  'PLANEADO': <PendingActions fontSize="small" />,
  'FINALIZADO': <BookmarkAdded fontSize="small" />,
  'MANTENIMIENTO': <PendingActions fontSize="small" />
};

// Mapeo de colores para estados
const STATUS_COLORS = {
  'ACTIVO': '#4caf50',
  'PLANEADO': '#2196f3',
  'FINALIZADO': '#9e9e9e',
  'MANTENIMIENTO': '#ff9800'
};

// Función para calcular el progreso y tiempos del contrato
export const calcularProgresoContrato = (contrato) => {
  if (!contrato.fechaInicio || !contrato.fechaFin) {
    return {
      porcentaje: 0,
      diasTranscurridos: 0,
      diasTotales: 0,
      diasRestantes: 0,
      estadoTiempo: 'Sin fechas',
      montoAcumulado: 0,
      montoTotal: 0,
      tieneContrato: false
    };
  }

  // Normalizar fechas a medianoche
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicio = new Date(contrato.fechaInicio);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(contrato.fechaFin);
  fin.setHours(0, 0, 0, 0);

  // Calcular días totales
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

  // Calcular montos
  const montoMensual = contrato.montoMensual || 0;
  const montoAcumulado = (diasTranscurridos / 30) * montoMensual;
  const montoTotal = (diasTotales / 30) * montoMensual;

  return {
    porcentaje,
    diasTranscurridos,
    diasTotales,
    diasRestantes,
    estadoTiempo,
    montoAcumulado,
    montoTotal,
    tieneContrato: true
  };
};

const ContratoCard = ({ contrato, onEdit, onDelete, isDashboard = false, isExpanded = false, onToggleExpand, relatedData = {} }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Estado para controlar la vista (list/grid)
  const [viewMode, setViewMode] = useState('grid'); // 'list' o 'grid'
  
  // Estado para controlar el popup de detalle
  const [detailOpen, setDetailOpen] = useState(false);

  // Usar el estado del backend
  const estado = getEstadoContrato(contrato) || 'PLANEADO';
  const color = STATUS_COLORS[estado] || '#9e9e9e';
  const icon = STATUS_ICONS[estado] || <PendingActions fontSize="small" />;
  const tipoIcon = <ContractIcon fontSize="small" />;

  // Extraer valores para mostrar
  let titulo = 'Sin inquilino';
  if (Array.isArray(contrato.inquilino) && contrato.inquilino.length > 0) {
    const inq = contrato.inquilino[0];
    if (typeof inq === 'object' && (inq.nombre || inq.apellido)) {
      titulo = `${inq.nombre || ''} ${inq.apellido || ''}`.trim();
    } else if (typeof inq === 'string') {
      // Si solo hay un ID, mostrar el ID (mejoraría si se resuelve el nombre en otro lado)
      titulo = inq;
    }
  }
  const direccion = contrato.propiedad?.direccion || '';
  const ciudad = contrato.propiedad?.ciudad || '';
  const montoMensual = contrato.montoMensual || 0;
  const simboloMoneda = contrato.moneda?.simbolo || contrato.cuenta?.moneda?.simbolo || '$';
  const nombreCuenta = contrato.cuenta?.nombre || 'No especificada';
  const moneda = contrato.moneda?.nombre || contrato.cuenta?.moneda?.nombre || '';
  const inquilinos = contrato.inquilino || [];
  const fechaInicio = contrato.fechaInicio;
  const fechaFin = contrato.fechaFin;
  const diasRestantes = calcularTiempoRestante(fechaFin);
  const duracionTotal = calcularDuracionTotal(fechaInicio, fechaFin);

  // Calcular progreso del contrato
  const progresoContrato = calcularProgresoContrato(contrato);

  // Datos unificados para ContratosGridView
  const contratoData = {
    ...contrato,
    propiedad: contrato.propiedad,
    inquilino: contrato.inquilino,
    cuenta: contrato.cuenta,
    moneda: contrato.moneda,
    fechaInicio: contrato.fechaInicio,
    fechaFin: contrato.fechaFin,
    montoMensual: contrato.montoMensual,
    tipoContrato: contrato.tipoContrato,
    esMantenimiento: contrato.esMantenimiento
  };

  return (
    <StyledCard sx={{ bgcolor: 'background.default' }}>
      {/* Header con título y acciones */}
      <Box sx={{
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
            {/* Título del contrato */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {tipoIcon}
              <Typography variant="subtitle1" sx={{ 
                fontWeight: 500, 
                fontSize: '0.9rem',
                lineHeight: 1.2
              }}>
                {titulo}
              </Typography>
            </Box>
            
            {/* Estado del contrato */}
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
                {getEstadoLabel(estado)}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Ver detalle">
              <IconButton
                size="small"
                onClick={() => setDetailOpen(true)}
                sx={{ 
                  color: 'text.secondary',
                  padding: 0.25
                }}
              >
                <ViewIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={viewMode === 'list' ? "Cambiar a Vista Grid" : "Cambiar a Vista Lista"}>
              <IconButton
                size="small"
                onClick={() => {
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
            <Tooltip title="Editar">
              <IconButton
                size="small"
                onClick={() => onEdit(contrato)}
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
                onClick={() => onDelete(contrato._id || contrato.id)}
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
          <CardContent sx={{ p: 0, pb: 0.5 }}>
            {/* Barra de progreso del contrato en vista colapsada */}
            {progresoContrato.tieneContrato && (
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                    {progresoContrato.diasTranscurridos} días transcurridos
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                    Duración total: {progresoContrato.diasTotales} días
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={progresoContrato.porcentaje}
                  sx={{ 
                    height: 3,
                    borderRadius: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'primary.main'
                    }
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                    {simboloMoneda} {progresoContrato.montoAcumulado.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                    {simboloMoneda} {progresoContrato.montoTotal.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            )}
            {viewMode === 'grid' ? (
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
            {viewMode === 'grid' ? (
              // Vista Grid: Colapso controlado solo por isExpanded
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {/* Barra de progreso del contrato */}
                {progresoContrato.tieneContrato && (
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                        {progresoContrato.diasTranscurridos} días transcurridos
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                        Duración total: {progresoContrato.diasTotales} días
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={progresoContrato.porcentaje}
                      sx={{ 
                        height: 3,
                        borderRadius: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: 'primary.main'
                        }
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                        {simboloMoneda} {progresoContrato.montoAcumulado.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                        {simboloMoneda} {progresoContrato.montoTotal.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
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