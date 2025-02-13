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
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  EditOutlined as EditIcon, 
  DeleteOutlined as DeleteIcon
} from '@mui/icons-material';

const TransaccionTable = ({ transacciones, onEdit, onDelete }) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleRowClick = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const getMontoStyle = (tipo) => ({
    fontWeight: 500,
    color: tipo === 'INGRESO' ? '#5a9b5f' : '#b15757',
    fontSize: '0.95rem'
  });

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
                <TableCell align="right" sx={{ width: isMobile ? '35%' : '140px' }}>
                  <Typography sx={getMontoStyle(transaccion.tipo)}>
                    {transaccion.moneda?.simbolo} {transaccion.monto}
                  </Typography>
                </TableCell>
                <TableCell className="descripcion">
                  {transaccion.descripcion}
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
                        display: 'grid', 
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: 'repeat(2, 1fr)',
                          md: 'repeat(auto-fit, minmax(150px, 1fr))'
                        },
                        gap: 2
                      }}>
                        <Box>
                          <Typography variant="caption" sx={{ 
                            color: 'text.secondary', 
                            fontSize: '0.75rem',
                            display: 'block',
                            mb: 0.5
                          }}>
                            Tipo
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontSize: '0.875rem',
                            fontWeight: 500
                          }}>
                            {transaccion.tipo}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                            Estado
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                            {transaccion.estado}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                            Fecha
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                            {new Date(transaccion.fecha).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                            Categoría
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                            {transaccion.categoria}
                          </Typography>
                        </Box>
                        {transaccion.cuenta && (
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                              Cuenta
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
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
