import React from 'react';
import { Box } from '@mui/material';

/**
 * Track centrado que alinea su contenido con el main.
 * - Desktop: se ancla a la izquierda en mainMargin y reserva a la derecha rightWidth.
 * - Mobile/Tablet: ocupa todo el ancho y aplica paddings left/right.
 */
export default function CenteredTrack({
  isMobileOrTablet,
  mainMargin,
  leftWidth = 0,
  rightWidth = 0,
  height,
  children,
}) {
  const sx = isMobileOrTablet
    ? {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        pl: `${leftWidth}px`,
        pr: `${rightWidth}px`,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }
    : {
        position: 'absolute',
        left: `${mainMargin}px`,
        right: `${rightWidth}px`,
        top: 0,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      };

  return (
    <Box sx={sx}>
      {children}
    </Box>
  );
}


