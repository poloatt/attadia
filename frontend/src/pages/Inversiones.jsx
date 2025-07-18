import React from 'react';
import { Box, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EntityToolbar from '../components/EntityToolbar';

export default function Inversiones() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
      <EntityToolbar />
      <TrendingUpIcon sx={{ fontSize: 64, color: 'primary.main' }} />
      <Typography variant="h5" color="text.secondary">Página de Inversiones en construcción</Typography>
      <Typography variant="body2" color="text.secondary">Próximamente podrás gestionar tus inversiones aquí.</Typography>
    </Box>
  );
} 