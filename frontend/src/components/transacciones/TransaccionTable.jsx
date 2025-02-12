import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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

  const renderExpandedContent = (transaccion) => (
    <Box sx={{ 
      py: 0.5,
      px: 2,
      bgcolor: 'rgba(0, 0, 0, 0.02)'
    }}>
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(auto-fit, minmax(150px, 1fr))'
        },
        gap: 1
      }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
            Tipo
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
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
        gap: 0.5,
        borderTop: '1px solid rgba(224, 224, 224, 0.4)',
        pt: 0.5
      }}>
        <Tooltip title="Editar">
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(transaccion);
            }}
            sx={{ 
              color: 'text.secondary',
              p: 0.5,
              '&:hover': { 
                color: 'text.primary',
                bgcolor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <EditIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar">
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(transaccion);
            }}
            sx={{ 
              color: 'text.secondary',
              p: 0.5,
              '&:hover': { 
                color: 'text.primary',
                bgcolor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <DeleteIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <TableContainer 
      component={Paper} 
      elevation={0}
      sx={{
        border: 'none',
        width: '100%',
        overflowX: 'auto',
        '& .MuiTableCell-root': {
          borderBottom: '1px solid rgba(224, 224, 224, 0.4)',
          py: 0.5,
          px: 1,
          fontSize: '0.875rem',
          height: 24,
          lineHeight: 1,
          whiteSpace: 'nowrap'
        },
        '& .MuiTableBody-root .MuiTableRow-root': {
          borderBottom: 'none'
        }
      }}
    >
      <Table size="small" sx={{ minWidth: isMobile ? 'unset' : 400 }}>
        <TableHead>
          <TableRow>
            <TableCell 
              sx={{ 
                fontWeight: 500,
                bgcolor: theme.palette.background.default,
                borderBottom: '1px solid rgba(224, 224, 224, 0.4)',
                color: theme.palette.text.secondary
              }}
            >
              Descripción
            </TableCell>
            <TableCell 
              align="right"
              sx={{ 
                fontWeight: 500,
                bgcolor: theme.palette.background.default,
                borderBottom: '1px solid rgba(224, 224, 224, 0.4)',
                color: theme.palette.text.secondary,
                width: isMobile ? '30%' : '120px'
              }}
            >
              Monto
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transacciones.map((transaccion) => (
            <React.Fragment key={transaccion.id}>
              <TableRow 
                onClick={() => handleRowClick(transaccion.id)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: expandedRow === transaccion.id ? 
                    'rgba(0, 0, 0, 0.02)' : 'inherit',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.02)'
                  }
                }}
              >
                <TableCell>{transaccion.descripcion}</TableCell>
                <TableCell align="right">
                  {transaccion.moneda?.simbolo} {transaccion.monto}
                </TableCell>
              </TableRow>
              <TableRow 
                sx={{ 
                  display: expandedRow === transaccion.id ? 'table-row' : 'none',
                  '& > td': {
                    py: 0,
                    border: 'none'
                  }
                }}
              >
                <TableCell colSpan={2} sx={{ p: 0 }}>
                  <Collapse in={expandedRow === transaccion.id}>
                    {renderExpandedContent(transaccion)}
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
