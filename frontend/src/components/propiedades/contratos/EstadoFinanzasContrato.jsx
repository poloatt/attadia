import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Collapse,
  IconButton
} from '@mui/material';
import ProgressBar from '../../common/ProgressBar';
import {
  MonetizationOnOutlined as MoneyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import DoneIcon from '@mui/icons-material/Done';
import { StyledCuotasIconButton } from './ContratoFormStyles';
import CuotaInlineEditor from './CuotaInlineEditor';
import { useCuotasContext } from './context/CuotasContext';
import { calcularEstadoCuotasContrato } from './contratoUtils';

const EstadoFinanzasContrato = ({ 
  estadoFinanzas, 
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
    syncCuotas 
  } = useCuotasContext();

  // Sincronizar cuotas desde el prop inicial si el contexto está vacío
  useEffect(() => {
    if (estadoFinanzas?.estadoCuotas?.cuotasMensuales && cuotas.length === 0) {
      syncCuotas(estadoFinanzas.estadoCuotas.cuotasMensuales, estadoFinanzas.contrato || {});
    }
  }, [estadoFinanzas, cuotas.length, syncCuotas]);

  // Calcular estado de cuotas dinámicamente desde el contexto
  const estadoCuotasCalculado = useMemo(() => {
    if (!estadoFinanzas?.contrato || cuotas.length === 0) {
      return estadoFinanzas?.estadoCuotas || {
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
      ...estadoFinanzas.contrato,
      cuotasMensuales: cuotas
    };
    
    return calcularEstadoCuotasContrato(contratoConCuotasActualizadas);
  }, [cuotas, estadoFinanzas?.contrato, estadoFinanzas?.estadoCuotas]);

  // Extraer datos del estado calculado
  const { cuotasPagadas, cuotasTotales, montoPagado, montoTotal, porcentajePagado, proximaCuota, cuotasVencidas } = estadoCuotasCalculado;
  const simboloMoneda = estadoFinanzas?.simboloMoneda || '$';

  if (!estadoFinanzas || !estadoFinanzas.tieneContrato) {
    return null;
  }

  return (
    <Box sx={{ 
      mt: 1, 
      p: compact ? 0.5 : 1, 
      bgcolor: 'background.paper', 
      borderRadius: 0,
      ...sx
    }}>

      
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
            border: t => `1px solid ${t.palette.error.main}`
          }}
        >
          <MoneyIcon sx={{ fontSize: compact ? '0.6rem' : '0.7rem', color: 'error.main' }} />
          <CuotaInlineEditor
            cuota={{ estado: 'VENCIDA' }}
            editable={false}
            tipo="estado"
            sx={{ minWidth: 120 }}
          />
          <Typography variant="caption" sx={{ fontSize: compact ? '0.6rem' : '0.65rem', color: 'error.main', fontWeight: 600 }}>
            {cuotasVencidas} cuota{cuotasVencidas > 1 ? 's' : ''} vencida{cuotasVencidas > 1 ? 's' : ''}
          </Typography>
          <StyledCuotasIconButton size="small" sx={{ color: 'error.main', ml: 1 }} onClick={() => setShowCuotas((prev) => !prev)}>
            {showCuotas ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </StyledCuotasIconButton>
          <StyledCuotasIconButton size="small" sx={{ color: editInline ? 'success.main' : 'text.secondary', ml: 0.5 }} onClick={() => setEditInline((v) => !v)} disabled={isLoading}>
            {editInline ? <DoneIcon fontSize="small" /> : <EditIcon fontSize="small" />}
          </StyledCuotasIconButton>
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
                border: t => `1px solid ${t.palette.success.main}`
              }}
            >
              <MoneyIcon sx={{ fontSize: compact ? '0.6rem' : '0.7rem', color: 'success.main' }} />
              <CuotaInlineEditor
                cuota={{ estado: 'PAGADO' }}
                editable={false}
                tipo="estado"
                sx={{ minWidth: 120 }}
              />
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
              <StyledCuotasIconButton size="small" sx={{ color: 'success.main', ml: 1 }} onClick={() => setShowCuotas((prev) => !prev)}>
                {showCuotas ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </StyledCuotasIconButton>
              <StyledCuotasIconButton size="small" sx={{ color: editInline ? 'success.main' : 'text.secondary', ml: 0.5 }} onClick={() => setEditInline((v) => !v)} disabled={isLoading}>
                {editInline ? <DoneIcon fontSize="small" /> : <EditIcon fontSize="small" />}
              </StyledCuotasIconButton>
            </Box>
          );
        })()
      )}
      
      {/* Lista expandible de cuotas */}
      <Collapse in={showCuotas && cuotasTotales > 0}>
        <Box sx={{ mt: 1, mb: 1, bgcolor: '#222', borderRadius: 0, p: 1 }}>
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
                  formData={estadoFinanzas?.contrato || {}}
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
              <button
                style={{ background: '#1976d2', color: 'white', border: 'none', borderRadius: 0, padding: '4px 12px', fontSize: '0.85rem', cursor: 'pointer' }}
                disabled={isLoading}
                onClick={async () => {
                  // Usar el contexto para guardar las cuotas
                  const exito = await guardarCuotasEnBackend(cuotas);
                  if (exito) {
                    setEditInline(false);
                  } else {
                    alert('Error al guardar cuotas');
                  }
                }}
              >
                Guardar cambios
              </button>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default EstadoFinanzasContrato; 