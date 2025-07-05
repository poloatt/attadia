import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Grid,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Close as CloseIcon,
  Description as ContractIcon,
  CheckCircle,
  PendingActions,
  BookmarkAdded,
  MonetizationOnOutlined as MoneyIcon,
  AccountBalanceWalletOutlined as DepositIcon,
  AccountBalance as BankIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  LocationOn as LocationIcon,
  Home as HomeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { 
  getEstadoLabel, 
  getEstadoColor, 
  getEstadoContrato, 
  calcularTiempoRestante, 
  calcularDuracionTotal 
} from './contratoUtils';

// Componente Paper estilizado geométrico
const GeometricPaper = styled(Paper)(({ theme }) => ({
  borderRadius: 0,
  padding: theme.spacing(1.5),
  border: 'none',
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.98)' : 'rgba(240,240,240,1)',
  boxShadow: '0 1px 0 0 rgba(0,0,0,0.18)',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(40,40,40,1)',
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

// Función para calcular el progreso del contrato
const calcularProgresoContrato = (contrato) => {
  if (!contrato.fechaInicio || !contrato.fechaFin) {
    return {
      porcentaje: 0,
      diasTranscurridos: 0,
      diasTotales: 0,
      montoAcumulado: 0,
      montoTotal: 0,
      tieneContrato: false
    };
  }

  const hoy = new Date();
  const inicio = new Date(contrato.fechaInicio);
  const fin = new Date(contrato.fechaFin);

  // Calcular días totales
  const diasTotales = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));

  // Calcular días transcurridos
  const diasTranscurridos = Math.min(
    Math.max(0, Math.ceil((hoy - inicio) / (1000 * 60 * 60 * 24))),
    diasTotales
  );

  // Calcular porcentaje
  const porcentaje = Math.min(100, (diasTranscurridos / diasTotales) * 100);

  // Calcular montos
  const montoMensual = contrato.montoMensual || 0;
  const montoAcumulado = (diasTranscurridos / 30) * montoMensual;
  const montoTotal = (diasTotales / 30) * montoMensual;

  return {
    porcentaje,
    diasTranscurridos,
    diasTotales,
    montoAcumulado,
    montoTotal,
    tieneContrato: true
  };
};

const ContratoDetail = ({ 
  open, 
  onClose, 
  contrato, 
  onEdit, 
  onDelete,
  relatedData = {} 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!contrato) return null;

  // Usar el estado del backend
  const estado = getEstadoContrato(contrato) || 'PLANEADO';
  const color = STATUS_COLORS[estado] || '#9e9e9e';
  const icon = STATUS_ICONS[estado] || <PendingActions fontSize="small" />;

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

  const handleEdit = () => {
    onEdit(contrato);
    onClose();
  };

  const handleDelete = () => {
    onDelete(contrato._id || contrato.id);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: 0,
          backgroundColor: 'background.default',
          minHeight: isMobile ? '100vh' : 'auto'
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ 
        p: 2, 
        pb: 1,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ContractIcon sx={{ fontSize: '1.5rem', color: 'primary.main' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              {titulo}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Box sx={{ 
                fontSize: '1.2rem', 
                color: color,
                display: 'flex',
                alignItems: 'center'
              }}>
                {icon}
              </Box>
              <Typography variant="body2" sx={{ 
                fontSize: '0.8rem',
                color: color,
                fontWeight: 500
              }}>
                {getEstadoLabel(estado)}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size="small"
            onClick={handleEdit}
            sx={{ color: 'text.secondary' }}
          >
            <EditIcon sx={{ fontSize: '1.1rem' }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleDelete}
            sx={{ color: 'text.secondary' }}
          >
            <DeleteIcon sx={{ fontSize: '1.1rem' }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon sx={{ fontSize: '1.1rem' }} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2, pt: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          
          {/* Barra de progreso */}
          {progresoContrato.tieneContrato && (
            <GeometricPaper>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Progreso del contrato
              </Typography>
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {progresoContrato.diasTranscurridos}/{progresoContrato.diasTotales} días
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {Math.round(progresoContrato.porcentaje)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={progresoContrato.porcentaje}
                  sx={{ 
                    height: 4,
                    borderRadius: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'primary.main'
                    }
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    Acumulado: {simboloMoneda} {progresoContrato.montoAcumulado.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    Total: {simboloMoneda} {progresoContrato.montoTotal.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </GeometricPaper>
          )}

          {/* Información principal */}
          <Grid container spacing={2}>
            {/* Información financiera */}
            <Grid item xs={12} md={6}>
              <GeometricPaper>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <MoneyIcon sx={{ fontSize: '1.2rem', color: 'success.main' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Información financiera
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                      Monto mensual:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                      {simboloMoneda} {montoMensual.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                      Depósito:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                      {simboloMoneda} {(montoMensual * 2).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                      Cuenta:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                      {nombreCuenta}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                      Moneda:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                      {moneda}
                    </Typography>
                  </Box>
                </Box>
              </GeometricPaper>
            </Grid>

            {/* Información temporal */}
            <Grid item xs={12} md={6}>
              <GeometricPaper>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CalendarIcon sx={{ fontSize: '1.2rem', color: 'info.main' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Fechas y duración
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                      Inicio:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                      {fechaInicio ? new Date(fechaInicio).toLocaleDateString() : 'No especificada'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                      Fin:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                      {fechaFin ? new Date(fechaFin).toLocaleDateString() : 'No especificada'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                      Duración:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                      {duracionTotal || 'No especificada'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                      Días restantes:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                      {diasRestantes || 'Finalizado'}
                    </Typography>
                  </Box>
                </Box>
              </GeometricPaper>
            </Grid>

            {/* Información de inquilinos */}
            <Grid item xs={12} md={6}>
              <GeometricPaper>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PeopleIcon sx={{ fontSize: '1.2rem', color: 'primary.main' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Inquilinos ({inquilinos.length})
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {inquilinos.length > 0 ? (
                    inquilinos.map((inquilino, idx) => (
                      <Box key={idx} sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        p: 0.5,
                        bgcolor: 'rgba(255,255,255,0.02)',
                        borderRadius: 0
                      }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                          {inquilino && (inquilino.nombre || inquilino.apellido) 
                            ? `${inquilino.nombre || ''} ${inquilino.apellido || ''}`.trim()
                            : 'Sin nombre'
                          }
                        </Typography>
                        {inquilino?.email && (
                          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                            ({inquilino.email})
                          </Typography>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontStyle: 'italic' }}>
                      No hay inquilinos asignados
                    </Typography>
                  )}
                </Box>
              </GeometricPaper>
            </Grid>

            {/* Información de propiedad */}
            <Grid item xs={12} md={6}>
              <GeometricPaper>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <HomeIcon sx={{ fontSize: '1.2rem', color: 'warning.main' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Propiedad
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                      Dirección:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                      {direccion || 'No especificada'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                      Ciudad:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                      {ciudad || 'No especificada'}
                    </Typography>
                  </Box>
                  {contrato.propiedad?.metrosCuadrados && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                        Metros cuadrados:
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                        {contrato.propiedad.metrosCuadrados} m²
                      </Typography>
                    </Box>
                  )}
                  {contrato.propiedad?.tipo && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                        Tipo:
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                        {contrato.propiedad.tipo}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </GeometricPaper>
            </Grid>
          </Grid>

          {/* Información adicional */}
          {(contrato.observaciones || contrato.documentoUrl) && (
            <GeometricPaper>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Información adicional
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {contrato.observaciones && (
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 0.5 }}>
                      Observaciones:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontStyle: 'italic' }}>
                      {contrato.observaciones}
                    </Typography>
                  </Box>
                )}
                {contrato.documentoUrl && (
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 0.5 }}>
                      Documento:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      component="a"
                      href={contrato.documentoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ 
                        fontSize: '0.8rem',
                        color: 'primary.main',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      Ver documento
                    </Typography>
                  </Box>
                )}
              </Box>
            </GeometricPaper>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 0 }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContratoDetail; 