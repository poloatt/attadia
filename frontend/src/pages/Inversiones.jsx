import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { EntityToolbar } from '../components/EntityViews';

export default function Inversiones() {
  useEffect(() => {
    const handleHeaderAdd = (e) => {
      if (e.detail?.type === 'inversiones') {
        alert('La función de agregar inversión está en construcción.');
      }
    };
    window.addEventListener('headerAddButtonClicked', handleHeaderAdd);
    return () => window.removeEventListener('headerAddButtonClicked', handleHeaderAdd);
  }, []);

  return (
    <Box sx={{ px: 0, width: '100%' }}>
      <EntityToolbar />
      <Box sx={{ 
        width: '100%',
        maxWidth: 900,
        mx: 'auto',
        px: { xs: 1, sm: 2, md: 3 },
        py: 2,
        pb: { xs: 10, sm: 4 },
        boxSizing: 'border-box',
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh'
      }}>
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