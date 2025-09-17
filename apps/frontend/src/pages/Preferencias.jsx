import React from 'react';
import { Box, Typography } from '@mui/material';
import { Toolbar } from '../navigation';

export default function Preferencias() {
  return (
    <Box component="main" className="page-main-content" sx={{ width: '100%', flex: 1, px: { xs: 1, sm: 2, md: 3 }, py: 4, textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom>
        Preferencias
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Página en construcción.
      </Typography>
    </Box>
  );
} 