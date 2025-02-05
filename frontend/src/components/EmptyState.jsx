import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

export function EmptyState({ onAdd, buttonText = 'Crear' }) {
  return (
    <Box 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: 'text.secondary',
        bgcolor: 'background.default',
        borderRadius: 1,
        p: 3
      }}
    >
      <Typography variant="body1" sx={{ mb: 2 }}>
        No hay datos para mostrar
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAdd}
      >
        {buttonText}
      </Button>
    </Box>
  );
}

export default EmptyState; 