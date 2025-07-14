import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, List, ListItem, ListItemText, Box } from '@mui/material';

const InventarioDetail = ({ open, onClose, inventario }) => {
  if (!inventario) return null;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 0,
          bgcolor: theme => theme.palette.background.default
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, fontSize: '1.1rem', color: 'text.primary' }}>
        Inventario del contrato
      </DialogTitle>
      <DialogContent>
        {inventario.items && inventario.items.length > 0 ? (
          <List>
            {inventario.items.map((item, idx) => (
              <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                <ListItemText
                  primary={<Typography sx={{ fontSize: '0.95rem', color: 'text.primary' }}>{item.nombre}</Typography>}
                  secondary={item.descripcion ? <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{item.descripcion}</Typography> : null}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No hay items en el inventario.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ borderRadius: 0 }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InventarioDetail; 