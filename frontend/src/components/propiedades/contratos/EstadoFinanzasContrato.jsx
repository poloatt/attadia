import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Collapse,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { ProgressBar } from '../../common';
import {
  MonetizationOnOutlined as MoneyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Payment as PaymentIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { StyledCuotasIconButton } from './ContratoFormStyles';
import CuotaInlineEditor from './CuotaInlineEditor';
import { useCuotasContext } from './context/CuotasContext';
import { calcularEstadoCuotasContrato } from './contratoUtils';

const EstadoFinanzasContrato = ({ 
  contrato, // Recibo el contrato completo, no un estado calculado
  contratoId,
  showTitle = true, 
  compact = false,
  sx = {} 
}) => {
  const [showCuotas, setShowCuotas] = useState(false);
  const [editInline, setEditInline] = useState(false);

  // Usar el contexto de cuotas para estado reactivo
  const { 
    cuotas, 
    updateCuota, 
    guardarCuotasEnBackend, 
    isLoading,
    syncCuotas,
    refrescarCuotasDesdeBackend,
    setCuotas
  } = useCuotasContext();

  // Calcular estado de cuotas dinámicamente desde el contexto y el contrato
  const estadoCuotasCalculado = useMemo(() => {
    if (!contrato || cuotas.length === 0) {
      return {
        cuotasPagadas: 0,
        cuotasTotales: 0,
        montoPagado: 0,
        montoTotal: 0,
        porcentajePagado: 0,
        proximaCuota: null,
        cuotasVencidas: 0,
        cuotasMensuales: []
      };
    }
    // Usar las cuotas del contexto para calcular el estado actual
    const contratoConCuotasActualizadas = {
      ...contrato,
      cuotasMensuales: cuotas
    };
    return calcularEstadoCuotasContrato(contratoConCuotasActualizadas);
  }, [cuotas, contrato]);

  // Extraer datos del estado calculado
  const { cuotasPagadas, cuotasTotales, montoPagado, montoTotal, porcentajePagado, proximaCuota, cuotasVencidas } = estadoCuotasCalculado;
  const simboloMoneda = contrato?.cuenta?.moneda?.simbolo || contrato?.moneda?.simbolo || '$';

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!contrato) {
    return null;
  }

  // Si no hay cuotas válidas, no mostrar nada
  if (cuotasTotales === 0) {
    return null;
  }

  return (
    <Box sx={{ 
      mt: 1, 
      p: compact ? 0.5 : 1, 
      bgcolor: 'background.paper', 
      borderRadius: 0,
      cursor: 'pointer',
      '&:hover': {
        bgcolor: 'action.hover'
      },
      ...sx
    }}
    onClick={() => setShowCuotas((prev) => !prev)}
    >

      
      {/* Progreso de cuotas */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="caption" sx={{ 
          fontSize: compact ? '0.6rem' : '0.65rem', 
          color: 'text.secondary' 
        }}>
          {cuotasPagadas}/{cuotasTotales} cuotas
        </Typography>
        <Typography variant="caption" sx={{ 
          fontSize: compact ? '0.6rem' : '0.65rem', 
          color: 'text.secondary' 
        }}>
          {porcentajePagado}% pagado
        </Typography>
      </Box>
      
      {/* Barra de progreso de cuotas */}
      <ProgressBar
        dataType="cuotas"
        cuotasPagadas={cuotasPagadas}
        cuotasTotales={cuotasTotales}
        montoPagado={montoPagado}
        montoTotalCuotas={montoTotal}
        percentage={porcentajePagado}
        color="success"
        variant={compact ? 'compact' : 'default'}
        showLabels={false}
        sx={{ mb: 0.5 }}
      />
      {/* Montos */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ 
          fontSize: compact ? '0.55rem' : '0.6rem', 
          color: 'text.secondary' 
        }}>
          {simboloMoneda} {montoPagado.toLocaleString()}
        </Typography>
        <Typography variant="caption" sx={{ 
          fontSize: compact ? '0.55rem' : '0.6rem', 
          color: 'text.secondary' 
        }}>
          {simboloMoneda} {montoTotal.toLocaleString()}
        </Typography>
      </Box>

      {/* Chips de cuotas vencidas o al día */}
      {cuotasVencidas > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            mt: 0.5,
            p: compact ? 0.25 : 0.5,
            bgcolor: 'background.default',
            borderRadius: 0,
            border: t => `1px solid ${t.palette.error.main}`,
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <MoneyIcon sx={{ fontSize: compact ? '0.6rem' : '0.7rem', color: 'error.main' }} />
            {!isMobile && (
              <CuotaInlineEditor
                cuota={{ estado: 'VENCIDA' }}
                editable={false}
                tipo="estado"
                sx={{ minWidth: 120 }}
              />
            )}
            <Typography variant="caption" sx={{ fontSize: compact ? '0.6rem' : '0.65rem', color: 'error.main', fontWeight: 600 }}>
              {cuotasVencidas} cuota{cuotasVencidas > 1 ? 's' : ''} vencida{cuotasVencidas > 1 ? 's' : ''}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
            <StyledCuotasIconButton size="small" sx={{ color: 'text.secondary' }}
              onClick={async (e) => {
                e.stopPropagation();
                // Forzar refresh y sobrescribir el estado local con el backend
                const ok = await refrescarCuotasDesdeBackend();
                if (ok && typeof window !== 'undefined') {
                  // Opcional: podrías mostrar una notificación de éxito aquí
                }
              }}
              disabled={isLoading || editInline}
            >
              <RefreshIcon fontSize="small" />
            </StyledCuotasIconButton>
            <StyledCuotasIconButton size="small" sx={{ color: 'text.secondary' }}
              onClick={async (e) => {
                e.stopPropagation();
                if (editInline) {
                  // Siempre guardar al salir del modo edición
                  const exito = await guardarCuotasEnBackend(cuotas);
                  if (exito) {
                    setEditInline(false);
                  } else {
                    alert('Error al guardar cuotas');
                  }
                } else {
                  setEditInline(true);
                  // Si está colapsado, expandir automáticamente
                  if (!showCuotas) {
                    setShowCuotas(true);
                  }
                }
              }}
              disabled={isLoading}
            >
              {editInline ? <SaveIcon fontSize="small" /> : <EditIcon fontSize="small" />}
            </StyledCuotasIconButton>
            <StyledCuotasIconButton 
              size="small" 
              sx={{ color: 'error.main' }} 
              onClick={(e) => {
                e.stopPropagation();
                setShowCuotas((prev) => !prev);
              }}
            >
              {showCuotas ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </StyledCuotasIconButton>
          </Box>
        </Box>
      )}
      {cuotasVencidas === 0 && cuotasTotales > 0 && (
        (() => {
          const pagadas = cuotas.filter(c => c.estado === 'PAGADO').length;
          const pendientes = cuotas.filter(c => c.estado === 'PENDIENTE').length;
          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mt: 0.5,
                p: compact ? 0.25 : 0.5,
                bgcolor: 'background.default',
                borderRadius: 0,
                border: t => `1px solid ${t.palette.success.main}`,
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <MoneyIcon sx={{ fontSize: compact ? '0.6rem' : '0.7rem', color: 'success.main' }} />
                {!isMobile && (
                  <CuotaInlineEditor
                    cuota={{ estado: 'PAGADO' }}
                    editable={false}
                    tipo="estado"
                    sx={{ minWidth: 120 }}
                  />
                )}
                <Typography variant="caption" sx={{ fontSize: compact ? '0.6rem' : '0.65rem', color: 'success.main', fontWeight: 600 }}>
                  {pagadas} cuota{pagadas !== 1 ? 's' : ''} pagada{pagadas !== 1 ? 's' : ''}
                  {pendientes > 0 && (
                    <span style={{ color: '#888', fontWeight: 400 }}>
                      {' · '}{pendientes} pendiente{pendientes !== 1 ? 's' : ''}
                      {proximaCuota && (
                        <span style={{ color: '#888', fontWeight: 400 }}>
                          {' · próxima cuota '}{proximaCuota.index} en {proximaCuota.diasRestantes} días
                        </span>
                      )}
                    </span>
                  )}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
                <StyledCuotasIconButton 
                  size="small" 
                  sx={{ color: 'text.secondary' }} 
                  onClick={(e) => {
                    e.stopPropagation();
                    refrescarCuotasDesdeBackend();
                  }} 
                  disabled={isLoading}
                >
                  <RefreshIcon fontSize="small" />
                </StyledCuotasIconButton>
                <StyledCuotasIconButton 
                  size="small" 
                  sx={{ color: 'text.secondary' }} 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (editInline) {
                      setEditInline(false);
                    } else {
                      setEditInline(true);
                      // Si está colapsado, expandir automáticamente
                      if (!showCuotas) {
                        setShowCuotas(true);
                      }
                    }
                  }} 
                  disabled={isLoading}
                >
                  {editInline ? <SaveIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                </StyledCuotasIconButton>
                <StyledCuotasIconButton 
                  size="small" 
                  sx={{ color: 'success.main' }} 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCuotas((prev) => !prev);
                  }}
                >
                  {showCuotas ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </StyledCuotasIconButton>
              </Box>
            </Box>
          );
        })()
      )}
      
      {/* Lista expandible de cuotas */}
      <Collapse in={showCuotas && cuotasTotales > 0}>
        <Box 
          sx={{ mt: 1, mb: 1, bgcolor: '#222', borderRadius: 0, p: 1 }}
          onClick={(e) => e.stopPropagation()}
        >
          {cuotas && cuotas.length > 0 ? (
            cuotas.map((cuota, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="caption" sx={{ width: 32, color: 'text.secondary' }}>#{cuota.numero}</Typography>
                <Typography variant="caption" sx={{ width: 80, color: 'text.secondary' }}>{cuota.fechaVencimiento ? new Date(cuota.fechaVencimiento).toLocaleDateString('es-ES') : ''}</Typography>
                <CuotaInlineEditor
                  cuota={cuota}
                  onChange={nuevoCuota => {
                    if (!editInline) return;
                    // Usar el contexto para actualizar la cuota
                    updateCuota(idx, nuevoCuota);
                  }}
                  editable={editInline}
                  formData={contrato || {}}
                />
                <Box sx={{ flex: 1 }} />
              </Box>
            ))
          ) : (
            <Typography variant="caption" color="text.secondary">No hay cuotas generadas.</Typography>
          )}
          {/* Botón para guardar cambios si está en modo edición */}
          {editInline && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <StyledCuotasIconButton
                size="small"
                sx={{ color: 'text.secondary' }}
                disabled={isLoading}
                onClick={async (e) => {
                  e.stopPropagation();
                  // Usar el contexto para guardar las cuotas
                  const exito = await guardarCuotasEnBackend(cuotas);
                  if (exito) {
                    setEditInline(false);
                  } else {
                    alert('Error al guardar cuotas');
                  }
                }}
              >
                <SaveIcon fontSize="small" />
              </StyledCuotasIconButton>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default EstadoFinanzasContrato; 
