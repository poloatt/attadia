import React, { memo } from 'react';
import {
  IconButton,
  Tooltip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useState } from 'react';

const DeleteConfirmDialog = memo(({ open, onClose, onConfirm, itemName }) => (
  <Dialog 
    open={open} 
    onClose={onClose}
    PaperProps={{
      sx: {
        borderRadius: 0,
        bgcolor: 'background.default'
      }
    }}
  >
    <DialogTitle>Confirmar Eliminación</DialogTitle>
    <DialogContent>
      <Typography>
        ¿Estás seguro que deseas eliminar {itemName}?
        Esta acción no se puede deshacer.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>
        Cancelar
      </Button>
      <Button 
        onClick={onConfirm} 
        color="error" 
        variant="contained"
      >
        Eliminar
      </Button>
    </DialogActions>
  </Dialog>
));

/**
 * EntityActions: Componente de acciones reutilizable y extensible.
 * Props:
 * - onEdit: función para editar
 * - onDelete: función para eliminar
 * - itemName: nombre del ítem para el diálogo de confirmación
 * - size: tamaño de los botones
 * - direction: dirección del layout
 * - showDelete: mostrar botón eliminar
 * - disabled: deshabilitar acciones
 * - extraActions: array de objetos { icon, label, onClick, color, show, disabled, tooltip, ... }
 */
export const EntityActions = memo(({ 
  onEdit, 
  onDelete,
  itemName = 'este registro',
  size = 'small',
  direction = 'row',
  showDelete = true,
  showEdit = true,
  disabled = false,
  extraActions = [] // [{ icon: <ViewIcon />, label: 'Ver', onClick, color, show, disabled, tooltip }]
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = (e) => {
    e?.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    onDelete && onDelete();
    setDeleteDialogOpen(false);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit && onEdit();
  };

  return (
    <>
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: direction,
          gap: 0.5,
          opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? 'none' : 'auto'
        }}
      >
        {/* Acciones extra (custom) */}
        {extraActions && extraActions.map((action, idx) => (
          action.show !== false && (
            <Tooltip title={action.tooltip || action.label || ''} key={action.label || idx}>
              <span>
                <IconButton
                  onClick={e => { e.stopPropagation(); action.onClick && action.onClick(e); }}
                  size={action.size || size}
                  sx={{
                    color: action.color || 'text.secondary',
                    p: 0.5,
                    '&:hover': {
                      color: action.hoverColor || 'primary.main',
                      backgroundColor: 'transparent'
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.25rem'
                    }
                  }}
                  disabled={action.disabled}
                >
                  {action.icon}
                </IconButton>
              </span>
            </Tooltip>
          )
        ))}

        {/* Acción Editar */}
        {showEdit && onEdit && (
          <Tooltip title="Editar">
            <span>
              <IconButton 
                onClick={handleEdit}
                size={size}
                sx={{ 
                  color: 'text.secondary',
                  p: 0.5,
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: 'transparent'
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.25rem'
                  }
                }}
                disabled={disabled}
              >
                <EditIcon />
              </IconButton>
            </span>
          </Tooltip>
        )}

        {/* Acción Eliminar */}
        {showDelete && onDelete && (
          <Tooltip title="Eliminar">
            <span>
              <IconButton
                onClick={handleDelete}
                size={size}
                sx={{ 
                  color: '#8B0000',
                  p: 0.5,
                  '&:hover': {
                    color: '#4B0000',
                    backgroundColor: 'transparent'
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.25rem'
                  }
                }}
                disabled={disabled}
              >
                <DeleteIcon />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={itemName}
      />
    </>
  );
}); 