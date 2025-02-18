import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Grid,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Home as HomeIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  MeetingRoom as RoomIcon,
  Engineering as EngineeringIcon,
  AccountBalance as AccountIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  Engineering as MaintenanceIcon,
  BookmarkAdded as ReservedIcon,
  People as PeopleIcon
} from '@mui/icons-material';

const ContratosView = ({ 
  contratos = [], 
  relatedData = {}, 
  onEdit, 
  onDelete 
}) => {
  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const calcularPeriodo = (fechaInicio, fechaFin) => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const meses = (fin.getFullYear() - inicio.getFullYear()) * 12 + 
                 (fin.getMonth() - inicio.getMonth());
    return `${meses} meses`;
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'ACTIVO': return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'FINALIZADO': return <CheckCircleIcon sx={{ color: 'error.main' }} />;
      case 'PLANEADO': return <PendingIcon sx={{ color: 'info.main' }} />;
      case 'MANTENIMIENTO': return <MaintenanceIcon sx={{ color: 'warning.main' }} />;
      default: return null;
    }
  };

  return (
    <Grid container spacing={2}>
      {contratos.map((contrato) => {
        const propiedad = contrato.propiedad || {};
        const habitacion = contrato.habitacion || {};
        const cuenta = contrato.cuenta || {};
        const inquilinos = Array.isArray(contrato.inquilino) ? contrato.inquilino : [];
        const periodo = calcularPeriodo(contrato.fechaInicio, contrato.fechaFin);

        return (
          <Grid item xs={12} sm={6} md={4} key={contrato._id}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                position: 'relative',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              {/* Header */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                width: '100%'
              }}>
                {getEstadoIcon(contrato.estado)}
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {`${propiedad.titulo || 'Propiedad no encontrada'} - ${periodo}`}
                </Typography>
              </Box>

              {/* Fechas */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                <Typography variant="body2">
                  {formatFecha(contrato.fechaInicio)} - {formatFecha(contrato.fechaFin)}
                </Typography>
              </Box>

              {/* Inquilinos */}
              {!contrato.esMantenimiento && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <PeopleIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {inquilinos.map(inquilino => (
                      <Chip
                        key={inquilino._id}
                        label={`${inquilino.nombre || ''} ${inquilino.apellido || ''}`}
                        size="small"
                        sx={{ 
                          borderRadius: 0,
                          height: 24,
                          '& .MuiChip-label': {
                            fontSize: '0.75rem',
                            px: 1
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Montos */}
              {!contrato.esMantenimiento && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <MoneyIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2">
                      Alquiler mensual: {cuenta?.moneda?.simbolo || '$'}{contrato.montoMensual || 0}
                    </Typography>
                    {(contrato.deposito || 0) > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        Depósito: {cuenta?.moneda?.simbolo || '$'}{contrato.deposito}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      Cuenta: {cuenta?.nombre || 'No especificada'}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Observaciones */}
              {contrato.observaciones && (
                <Typography variant="caption" color="text.secondary">
                  {contrato.observaciones}
                </Typography>
              )}

              {/* Actions */}
              <Box sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                display: 'flex',
                gap: 0.5
              }}>
                <Tooltip title="Editar">
                  <IconButton 
                    size="small" 
                    onClick={() => onEdit(contrato)}
                    sx={{ 
                      color: 'text.secondary',
                      padding: 0.5,
                      '&:hover': { color: 'primary.main' }
                    }}
                  >
                    <EditIcon sx={{ fontSize: '1.25rem' }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton 
                    size="small" 
                    onClick={() => onDelete(contrato._id)}
                    sx={{ 
                      color: 'text.secondary',
                      padding: 0.5,
                      '&:hover': { color: 'error.main' }
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: '1.25rem' }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default ContratosView; 