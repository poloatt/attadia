import React from 'react';
import { Box, Typography } from '@mui/material';
import { DesktopAppsSection } from '../components/pwa';

export default function Preferencias() {
  return (
    <Box
      component="main"
      className="page-main-content"
      sx={{
        width: '100%',
        flex: 1,
        px: { xs: 1, sm: 2, md: 3 },
        py: 4,
        maxWidth: 900,
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center' }}>
        Preferencias
      </Typography>
      <DesktopAppsSection />
    </Box>
  );
}
