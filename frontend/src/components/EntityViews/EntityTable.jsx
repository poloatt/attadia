import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  EditOutlined as EditIcon, 
  DeleteOutlined as DeleteIcon
} from '@mui/icons-material';

const EntityTable = ({ data, columns, onEdit, onDelete }) => {
  const renderCell = (item, column) => {
    if (column.type === 'chip') {
      return (
        <Chip 
          label={column.render ? column.render(item) : item[column.field]}
          size="small"
          color={column.getColor?.(item[column.field]) || 'default'}
          variant="outlined"
        />
      );
    }

    if (column.type === 'actions') {
      return (
        <>
          {onEdit && (
            <Tooltip title="Editar">
              <IconButton size="small" onClick={() => onEdit(item)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Eliminar">
              <IconButton size="small" onClick={() => onDelete(item)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </>
      );
    }

    if (column.render) {
      return column.render(item);
    }

    return item[column.field];
  };

  return (
    <TableContainer component={Paper} elevation={0}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell 
                key={column.field}
                align={column.align || 'left'}
                width={column.width}
              >
                {column.headerName}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              {columns.map((column) => (
                <TableCell 
                  key={`${item.id}-${column.field}`}
                  align={column.align || 'left'}
                >
                  {renderCell(item, column)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default EntityTable; 
