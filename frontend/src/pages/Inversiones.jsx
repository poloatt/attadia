import React from 'react';
import { Box, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EntityToolbar from '../components/EntityToolbar';

export default function Inversiones() {
  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <EntityToolbar />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: { xs: 4, md: 8 }, px: 2 }}>
        <TrendingUpIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" color="text.secondary" align="center" sx={{ mb: 1 }}>
          Página de Inversiones en construcción
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Próximamente podrás gestionar tus inversiones aquí.
        </Typography>
      </Box>
    </Box>
  );
} 