import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  Payment as PaymentIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { generarCuotasMensuales } from '../contratoUtils';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: 0,
  backgroundColor: 'transparent',
  '& .MuiTable-root': {
    backgroundColor: 'transparent'
  },
  '& .MuiTableCell-root': {
    borderColor: theme.palette.divider,
    padding: theme.spacing(1, 1.5),
    fontSize: '0.875rem'
  },
  '& .MuiTableHead-root .MuiTableCell-root': {
    backgroundColor: theme.palette.background.paper,
    fontWeight: 600,
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }
}));

const PaymentCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 0,
  backgroundColor: alpha(theme.palette.background.paper, 0.5),
  display: 'flex',
  flexDirection: 'column',
  gap: 1
}));

const PaymentsStep = ({
  formData,
  onFormDataChange,
  onErrorsChange,
  onStepComplete,
  errors,
  relatedData,
  theme
}) => {
  const [cuotas, setCuotas] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [totalCalculado, setTotalCalculado] = useState(0);
  const [diferencia, setDiferencia] = useState(0);

  // Generar cuotas automáticamente cuando cambian las fechas o precio total
  useEffect(() => {
    if (formData.fechaInicio && formData.fechaFin && formData.precioTotal && !formData.esMantenimiento) {
      const cuotasGeneradas = generarCuotasMensuales({
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        precioTotal: parseFloat(formData.precioTotal) || 0,
        esMantenimiento: false
      });
      
      setCuotas(cuotasGeneradas);
      onFormDataChange({ cuotasMensuales: cuotasGeneradas });
    } else {
      setCuotas([]);
      onFormDataChange({ cuotasMensuales: [] });
    }
  }, [formData.fechaInicio, formData.fechaFin, formData.precioTotal, formData.esMantenimiento]);

  // Calcular total y diferencia
  useEffect(() => {
    const total = cuotas.reduce((sum, cuota) => sum + (cuota.monto || 0), 0);
    setTotalCalculado(total);
    
    const precioTotal = parseFloat(formData.precioTotal) || 0;
    setDiferencia(precioTotal - total);
  }, [cuotas, formData.precioTotal]);

  const validateStep = () => {
    const newErrors = {};
    
    // Para contratos de mantenimiento, no hay validación de cuotas
    if (formData.esMantenimiento) {
      onStepComplete(3, true);
      return;
    }
    
    // Validar que haya cuotas generadas
    if (!cuotas || cuotas.length === 0) {
      newErrors.cuotas = 'No se pudieron generar las cuotas. Verifica las fechas y el precio total.';
    }
    
    // Validar que el total coincida con el precio total (con tolerancia de 1%)
    if (Math.abs(diferencia) > parseFloat(formData.precioTotal) * 0.01) {
      newErrors.total = 'El total de las cuotas debe coincidir con el precio total del contrato.';
    }
    
    onErrorsChange(newErrors);
    
    const isValid = Object.keys(newErrors).length === 0;
    onStepComplete(3, isValid);
  };

  useEffect(() => {
    validateStep();
  }, [cuotas, diferencia, formData.esMantenimiento]);

  const handleEditStart = (index, value) => {
    setEditingIndex(index);
    setEditingValue(value.toString());
  };

  const handleEditSave = () => {
    if (editingIndex !== null) {
      const newCuotas = [...cuotas];
      newCuotas[editingIndex].monto = parseFloat(editingValue) || 0;
      setCuotas(newCuotas);
      onFormDataChange({ cuotasMensuales: newCuotas });
      setEditingIndex(null);
      setEditingValue('');
    }
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleRegenerarCuotas = () => {
    if (formData.fechaInicio && formData.fechaFin && formData.precioTotal) {
      const cuotasGeneradas = generarCuotasMensuales({
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        precioTotal: parseFloat(formData.precioTotal) || 0,
        esMantenimiento: false
      });
      
      setCuotas(cuotasGeneradas);
      onFormDataChange({ cuotasMensuales: cuotasGeneradas });
    }
  };

  const formatCurrency = (amount, currency = '$') => {
    return `${currency} ${parseFloat(amount || 0).toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      month: 'short',
      year: 'numeric'
    });
  };

  const getMonedaSimbolo = () => {
    const cuenta = relatedData.cuentas?.find(c => 
      c._id === formData.cuenta || c.id === formData.cuenta
    );
    return cuenta?.moneda?.simbolo || '$';
  };

  const monedaSimbolo = getMonedaSimbolo();

  // Si es contrato de mantenimiento, mostrar mensaje especial
  if (formData.esMantenimiento) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Título del paso */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <PaymentIcon sx={{ fontSize: '1.5rem', color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Cuotas y Pagos
          </Typography>
        </Box>

        <Alert severity="info" sx={{ borderRadius: 0 }}>
          <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
            Contrato de Mantenimiento
          </Typography>
          <Typography variant="body2">
            Los contratos de mantenimiento no generan cuotas mensuales automáticas. 
            Los pagos se gestionan manualmente según los servicios prestados y se registran 
            como transacciones individuales.
          </Typography>
        </Alert>

        <PaymentCard>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <MoneyIcon sx={{ color: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Monto Total del Contrato
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600 }}>
            {formatCurrency(formData.precioTotal, monedaSimbolo)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Este monto se distribuirá según los servicios de mantenimiento prestados
          </Typography>
        </PaymentCard>

        {/* Resumen del paso */}
        <Box sx={{ 
          p: 2, 
          bgcolor: alpha(theme.palette.background.paper, 0.5),
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 0
        }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            <strong>Resumen:</strong> Contrato de mantenimiento por {formatCurrency(formData.precioTotal, monedaSimbolo)} 
            sin cuotas automáticas. Los pagos se gestionarán manualmente.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Título del paso */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <PaymentIcon sx={{ fontSize: '1.5rem', color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Cuotas y Pagos
        </Typography>
      </Box>

      {/* Resumen de cuotas */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <PaymentCard>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CalendarIcon sx={{ color: 'primary.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Total de Cuotas
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 600 }}>
              {cuotas.length}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Cuotas mensuales
            </Typography>
          </PaymentCard>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <PaymentCard>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <MoneyIcon sx={{ color: 'success.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Total Calculado
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ color: 'success.main', fontWeight: 600 }}>
              {formatCurrency(totalCalculado, monedaSimbolo)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Suma de todas las cuotas
            </Typography>
          </PaymentCard>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <PaymentCard>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {diferencia === 0 ? (
                <CheckIcon sx={{ color: 'success.main' }} />
              ) : (
                <WarningIcon sx={{ color: 'warning.main' }} />
              )}
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Diferencia
              </Typography>
            </Box>
            <Typography 
              variant="h4" 
              sx={{ 
                color: diferencia === 0 ? 'success.main' : 'warning.main', 
                fontWeight: 600 
              }}
            >
              {formatCurrency(diferencia, monedaSimbolo)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {diferencia === 0 ? 'Perfecto' : 'Ajustar cuotas'}
            </Typography>
          </PaymentCard>
        </Grid>
      </Grid>

      {/* Barra de progreso de coincidencia */}
      {Math.abs(diferencia) > 0 && (
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Coincidencia con precio total
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {Math.round(((totalCalculado / parseFloat(formData.precioTotal)) * 100) * 100) / 100}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min((totalCalculado / parseFloat(formData.precioTotal)) * 100, 100)}
            sx={{
              height: 8,
              borderRadius: 0,
              backgroundColor: 'rgba(255,255,255,0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: diferencia === 0 ? 'success.main' : 'warning.main'
              }
            }}
          />
        </Box>
      )}

      {/* Botón para regenerar cuotas */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="outlined"
          onClick={handleRegenerarCuotas}
          startIcon={<RefreshIcon />}
          sx={{ borderRadius: 0 }}
        >
          Regenerar Cuotas Automáticamente
        </Button>
      </Box>

      {/* Tabla de cuotas */}
      {cuotas.length > 0 && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
            Cuotas Mensuales
          </Typography>
          
          <StyledTableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>N°</TableCell>
                  <TableCell>Mes</TableCell>
                  <TableCell>Monto</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cuotas.map((cuota, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                        {formatFecha(cuota.fecha)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {editingIndex === index ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <input
                            type="number"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            style={{
                              width: '80px',
                              padding: '4px 8px',
                              border: '1px solid #ccc',
                              borderRadius: 0,
                              backgroundColor: 'transparent',
                              color: 'inherit'
                            }}
                          />
                          <IconButton size="small" onClick={handleEditSave}>
                            <SaveIcon sx={{ fontSize: '1rem' }} />
                          </IconButton>
                          <IconButton size="small" onClick={handleEditCancel}>
                            <CancelIcon sx={{ fontSize: '1rem' }} />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MoneyIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                          {formatCurrency(cuota.monto, monedaSimbolo)}
                          <Tooltip title="Editar monto">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditStart(index, cuota.monto)}
                            >
                              <EditIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label="Pendiente"
                        size="small"
                        sx={{ 
                          fontSize: '0.7rem',
                          height: 20,
                          borderRadius: 0,
                          backgroundColor: alpha(theme.palette.warning.main, 0.1),
                          color: 'warning.main'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {/* Acciones adicionales si es necesario */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </StyledTableContainer>
        </Box>
      )}

      {/* Alertas */}
      {errors.cuotas && (
        <Alert severity="error" sx={{ borderRadius: 0 }}>
          {errors.cuotas}
        </Alert>
      )}

      {errors.total && (
        <Alert severity="warning" sx={{ borderRadius: 0 }}>
          {errors.total}
        </Alert>
      )}

      {diferencia === 0 && cuotas.length > 0 && (
        <Alert severity="success" sx={{ borderRadius: 0 }}>
          Las cuotas están perfectamente distribuidas y coinciden con el precio total del contrato.
        </Alert>
      )}

      {/* Resumen del paso */}
      <Box sx={{ 
        p: 2, 
        bgcolor: alpha(theme.palette.background.paper, 0.5),
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 0
      }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          <strong>Resumen:</strong> 
          {` ${cuotas.length} cuotas mensuales por un total de ${formatCurrency(totalCalculado, monedaSimbolo)}`}
          {diferencia !== 0 && ` (diferencia de ${formatCurrency(diferencia, monedaSimbolo)})`}
          {diferencia === 0 && ' - Perfectamente distribuidas'}
        </Typography>
      </Box>
    </Box>
  );
};

export default PaymentsStep; 