import React from 'react';
import { Box } from '@mui/material';
import TiempoToolbarActions from './TiempoToolbarActions';

export default function TareasToolbarCenter() {
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
      <TiempoToolbarActions section="tareas" dense />
    </Box>
  );
}
