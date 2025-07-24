import React from 'react';
import { Box, Typography } from '@mui/material';
import { Toolbar } from '../navigation';

export default function Preferencias() {
  return (
    <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: '100%', md: 1200, lg: 1440 }, mx: 'auto', px: { xs: 1, sm: 2, md: 3, lg: 4 }, py: 4, textAlign: 'center' }}>
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