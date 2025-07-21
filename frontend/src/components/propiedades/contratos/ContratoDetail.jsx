import React from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  IconButton,
  Grid,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import CommonProgressBar from '../../common/CommonProgressBar';
import { GeometricPaper, GeometricModalHeader, EstadoChip, GeometricDialog } from '../../common/CommonDetails';
import CommonActions from '../../common/CommonActions';
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
  getEstadoContrato, 
  calcularTiempoRestante, 
  calcularDuracionTotal,
  calcularEstadoFinanzasContrato,
  getCuentaYMoneda,
  calcularProgresoContrato,
  calcularAlquilerMensualPromedio,
  calcularEstadoCuotasContrato
} from './contratoUtils';
import EstadoFinanzasContrato from './EstadoFinanzasContrato';
import { CuotasProvider } from './context/CuotasContext';
import { getEstadoColor, getEstadoText, getEstadoIcon, getStatusIconComponent } from '../../common/StatusSystem';
// EntityActions se importa desde EntityDetails.jsx
import { useNavigate, useLocation } from 'react-router-dom';

// STATUS_COLORS movido a StatusSystem.js

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
  const navigate = useNavigate();
  const location = useLocation();

  if (!contrato) return null;

  // Usar el estado del backend
  const estado = getEstadoContrato(contrato) || 'PLANEADO';
  
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
  const diasRestantes = calcularTiempoRestante(fechaFin);
  const duracionTotal = calcularDuracionTotal(fechaInicio, fechaFin);
  // Calcular meses restantes
  let mesesRestantes = null;
  if (fechaFin) {
    const hoy = new Date();
    const fin = new Date(fechaFin);
    mesesRestantes = (fin.getFullYear() - hoy.getFullYear()) * 12 + (fin.getMonth() - hoy.getMonth());
    if (mesesRestantes < 0) mesesRestantes = 0;
  }

  // Calcular progreso del contrato usando la función centralizada
  const progresoContrato = calcularProgresoContrato(contrato);
  
  // Calcular estado de cuotas para progreso financiero
  const estadoCuotas = calcularEstadoCuotasContrato(contrato);

  const handleEdit = () => {
    if (typeof onEdit === 'function') {
      onEdit(contrato);
    } else if (contrato && contrato._id) {
      navigate('/contratos', { state: { editContract: true, contratoId: contrato._id, from: location.pathname + location.search } });
    }
    if (onClose) onClose();
  };

  const handleDelete = () => {
    if (typeof onDelete === 'function') {
      onDelete(contrato._id || contrato.id);
    }
    if (onClose) onClose();
  };

  return (
    <GeometricDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      actions={
        <CommonActions
          onEdit={onEdit}
          onDelete={onDelete}
          itemName={titulo}
          size="medium"
          direction="row"
          showDelete={true}
          showEdit={true}
          disabled={false}
        />
      }
    >
      <GeometricModalHeader
        icon={ContractIcon}
        title={titulo}
        chip={<EstadoChip estado={estado} tipo="CONTRATO" />}
        onClose={onClose}
      />

      <DialogContent sx={{ p: 2, pt: 1, backgroundColor: '#181818' }}>
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
                <CommonProgressBar
                  percentage={progresoContrato.porcentaje}
                  color="primary"
                  variant="large"
                  showLabels={false}
                  sx={{ mb: 0.5 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    Pagado: {simboloMoneda} {estadoCuotas.montoPagado.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    Total: {simboloMoneda} {estadoCuotas.montoTotal.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </GeometricPaper>
          )}

          {/* Estado de finanzas */}
          {(() => {
            const estadoFinanzas = calcularEstadoFinanzasContrato(contrato, simboloMoneda);
            if (estadoFinanzas.tieneContrato) {
              return (
                <GeometricPaper>
                  <CuotasProvider contratoId={contrato._id || contrato.id} formData={contrato}>
                    <EstadoFinanzasContrato 
                      contrato={contrato}
                      contratoId={contrato._id || contrato.id}
                      showTitle={true}
                      compact={false}
                      sx={{ mt: 0, p: 0, bgcolor: 'transparent' }}
                    />
                  </CuotasProvider>
                </GeometricPaper>
              );
            }
            return null;
          })()}

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
                      Meses restantes:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                      {mesesRestantes !== null ? mesesRestantes : 'Finalizado'}
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

    </GeometricDialog>
  );
};

export default ContratoDetail; 
