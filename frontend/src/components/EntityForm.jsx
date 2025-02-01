import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box
} from '@mui/material';

const EntityForm = ({ 
  open, 
  onClose, 
  entityName 
}) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    // Implementar lógica de guardado
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Nuevo {entityName}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 2,
            py: 2
          }}>
            <TextField
              label="Nombre"
              fullWidth
              required
            />
            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={4}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained"
          >
            Guardar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EntityForm;