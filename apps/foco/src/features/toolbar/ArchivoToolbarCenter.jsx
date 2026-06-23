import React from 'react';
import { Box } from '@mui/material';
import TiempoToolbarActions from './TiempoToolbarActions';

/** Acciones de contexto en el centro de la toolbar (archivo). */
export default function ArchivoToolbarCenter() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
      <TiempoToolbarActions section="archivo" dense />
    </Box>
  );
}
