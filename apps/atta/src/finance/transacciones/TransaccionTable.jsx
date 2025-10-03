import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  IconButton,
  Tooltip,
  Collapse,
  Box,
  Typography
} from '@mui/material';
import { useResponsive } from '@shared/hooks';
import { 
  EditOutlined as EditIcon, 
  DeleteOutlined as DeleteIcon,
  AccountBalanceOutlined as AccountIcon,
  CheckCircleOutline as CheckIcon,
  PendingOutlined as PendingIcon,
  CancelOutlined as CancelIcon,
  Receipt,
  Fastfood,
  HealthAndSafety,
  Checkroom as Shirt,
  LocalBar as Cocktail,
  DirectionsBus,
  Devices,
  MoreHoriz
} from '@mui/icons-material';

const TransaccionTable = ({ transacciones, onEdit, onDelete, showValues = true }) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const { isMobile, theme } = useResponsive();

  const handleRowClick = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const getMontoStyle = (transaccion) => ({
    fontWeight: 500,
    color: transaccion.tipo === 'INGRESO' ? 
      (transaccion.cuenta?.moneda?.color || '#75AADB') : // Color de la moneda o celeste por defecto
      '#b15757', // Rojo para gastos
    fontSize: '0.875rem'
  });

  const formatMonto = (monto) => {
    if (!showValues) return '****';
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'PAGADO':
        return <CheckIcon sx={{ fontSize: 16, color: '#5a9b5f' }} />;
      case 'PENDIENTE':
        return <PendingIcon sx={{ fontSize: 16, color: '#ffb74d' }} />;
      case 'CANCELADO':
        return <CancelIcon sx={{ fontSize: 16, color: '#b15757' }} />;
      default:
        return null;
    }
  };

  const getCategoriaIcon = (categoria) => {
    const iconProps = { sx: { fontSize: 18, color: 'text.secondary' } };
    switch (categoria) {
      case 'Contabilidad y Facturas':
        return <Receipt {...iconProps} />;
      case 'Comida y Mercado':
        return <Fastfood {...iconProps} />;
      case 'Salud y Belleza':
        return <HealthAndSafety {...iconProps} />;
      case 'Ropa':
        return <Shirt {...iconProps} />;
      case 'Fiesta':
        return <Cocktail {...iconProps} />;
      case 'Transporte':
        return <DirectionsBus {...iconProps} />;
      case 'Tecnología':
        return <Devices {...iconProps} />;
      default:
        return <MoreHoriz {...iconProps} />;
    }
  };

  const formatEstado = (estado) => {
    return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
  };

  const formatFecha = (fecha) => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const date = new Date(fecha);
    return `${date.getDate()}${meses[date.getMonth()]}`;
  };

  return (
    <TableContainer 
      sx={{
        width: '100%',
        overflowX: 'auto',
        backgroundColor: 'transparent',
        '& .MuiTableCell-root': {
          border: 'none',
          py: 0.75,
          px: 1.5,
          fontSize: '0.875rem',
          height: 32,
          lineHeight: 1.2,
          whiteSpace: 'nowrap'
        },
        '& .descripcion': {
          color: 'text.secondary',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: {
            xs: '180px',
            sm: '300px',
            md: '500px'
          }
        },
        '& .MuiTableRow-root': {
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        },
        '& .MuiTableRow-root:last-of-type': {
          borderBottom: 'none'
        }
      }}
    >
      <Table size="small" sx={{ minWidth: isMobile ? 'unset' : 400 }}>
        <TableBody>
          {transacciones.map((transaccion) => (
            <React.Fragment key={transaccion.id}>
              <TableRow 
                onClick={() => handleRowClick(transaccion.id)}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  bgcolor: expandedRow === transaccion.id ? 
                    'rgba(0, 0, 0, 0.03)' : 'inherit',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.02)',
                    transform: 'translateX(4px)'
                  }
                }}
              >
                <TableCell sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  {getCategoriaIcon(transaccion.categoria)}
                  <Typography className="descripcion">
                    {transaccion.descripcion}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ width: isMobile ? '35%' : '140px' }}>
                  <Typography sx={getMontoStyle(transaccion)}>
                    {transaccion.cuenta?.moneda?.simbolo} {formatMonto(transaccion.monto)}
                  </Typography>
                </TableCell>
              </TableRow>
              <TableRow 
                sx={{ 
                  display: expandedRow === transaccion.id ? 'table-row' : 'none'
                }}
              >
                <TableCell colSpan={2} sx={{ p: 0 }}>
                  <Collapse in={expandedRow === transaccion.id}>
                    <Box sx={{ 
                      py: 1,
                      px: 2,
                      bgcolor: 'rgba(0, 0, 0, 0.02)',
                      borderRadius: 1,
                      mx: 1,
                      my: 0.5
                    }}>
                      <Box sx={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                      }}>
                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <Typography variant="caption" sx={{ 
                            color: 'text.secondary', 
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}>
                            Fecha
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontSize: '0.875rem',
                            color: 'text.secondary'
                          }}>
                            {formatFecha(transaccion.fecha)}
                          </Typography>
                        </Box>

                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <Typography variant="caption" sx={{ 
                            color: 'text.secondary', 
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}>
                            Estado
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {getEstadoIcon(transaccion.estado, 'TRANSACCION')}
                            <Typography variant="body2" sx={{ 
                              fontSize: '0.875rem',
                              color: 'text.secondary'
                            }}>
                              {formatEstado(transaccion.estado)}
                            </Typography>
                          </Box>
                        </Box>

                        {transaccion.cuenta && (
                          <Box sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <Typography variant="caption" sx={{ 
                              color: 'text.secondary', 
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}>
                              <AccountIcon sx={{ fontSize: 16 }} />
                              Cuenta
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              fontSize: '0.875rem',
                              color: 'text.secondary'
                            }}>
                              {transaccion.cuenta.nombre}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end',
                        gap: 1,
                        mt: 2,
                        pt: 1,
                        borderTop: '1px solid rgba(224, 224, 224, 0.4)'
                      }}>
                        <Tooltip title="Editar" arrow>
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(transaccion);
                            }}
                            sx={{ 
                              color: 'text.secondary',
                              '&:hover': { 
                                color: theme.palette.primary.main,
                                bgcolor: theme.palette.primary.light + '20'
                              }
                            }}
                          >
                            <EditIcon sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar" arrow>
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(transaccion);
                            }}
                            sx={{ 
                              color: 'text.secondary',
                              '&:hover': { 
                                color: theme.palette.error.main,
                                bgcolor: theme.palette.error.light + '20'
                              }
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Collapse>
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TransaccionTable;
