import React from 'react';
import { Box } from '@mui/material';
import useResponsive from '@shared/hooks/useResponsive';
import TiempoToolbarActions from './TiempoToolbarActions';

/** Acciones de contexto en el centro de la toolbar (objetivos). */
export default function ObjetivosToolbarCenter() {
  const { isMobile } = useResponsive();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isMobile ? 'flex-start' : 'center',
        width: '100%',
      }}
    >
      <TiempoToolbarActions section="objetivos" dense />
    </Box>
  );
}
