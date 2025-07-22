import React from 'react';
import { Box, Typography } from '@mui/material';
import { Toolbar } from '../navigation';

export default function Preferencias() {
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Toolbar />
      <Typography variant="h4" gutterBottom>
        Preferencias
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Página en construcción.
      </Typography>
    </Box>
  );
} 