import React from 'react';
import { Box } from '@mui/material';
import useResponsive from '@shared/hooks/useResponsive';
import AgendaToolbarCenter from './AgendaToolbarCenter';
import TiempoToolbarActions from './TiempoToolbarActions';

export default function TareasToolbarCenter() {
  const { isMobileOrTablet } = useResponsive();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        width: '100%',
        flexWrap: 'wrap',
      }}
    >
      {isMobileOrTablet && <AgendaToolbarCenter />}
      <TiempoToolbarActions section="tareas" dense />
    </Box>
  );
}
