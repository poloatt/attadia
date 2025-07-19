import React from 'react';
import { Box, Typography } from '@mui/material';
import { EntityToolbar } from '../components/EntityViews';

export default function Preferencias() {
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <EntityToolbar />
      <Typography variant="h4" gutterBottom>
        Preferencias
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Página en construcción.
      </Typography>
    </Box>
  );
} 