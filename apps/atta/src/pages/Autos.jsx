import React from 'react';
import { Box, Typography } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { Toolbar } from '@shared/navigation';

export default function Autos() {
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
        <DirectionsCarIcon sx={{ fontSize: 64, color: 'primary.main' }} />
        <Typography variant="h5" color="text.secondary">Página de Autos en construcción</Typography>
        <Typography variant="body2" color="text.secondary">Próximamente podrás gestionar tus autos aquí.</Typography>
      </Box>
    </Box>
  );
} 