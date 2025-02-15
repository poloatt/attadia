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

export const EntityActions = memo(({ 
  onEdit, 
  onDelete,
  itemName = 'este registro',
  size = 'small',
  direction = 'row',
  showDelete = true,
  disabled = false
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    onDelete();
    setDeleteDialogOpen(false);
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
        <Tooltip title="Editar">
          <IconButton 
            onClick={onEdit}
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
          >
            <EditIcon />
          </IconButton>
        </Tooltip>

        {showDelete && (
          <Tooltip title="Eliminar">
            <IconButton
              onClick={handleDelete}
              size={size}
              sx={{ 
                color: 'text.secondary',
                p: 0.5,
                '&:hover': {
                  color: 'error.main',
                  backgroundColor: 'transparent'
                },
                '& .MuiSvgIcon-root': {
                  fontSize: '1.25rem'
                }
              }}
            >
              <DeleteIcon />
            </IconButton>
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