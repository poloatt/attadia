import React from 'react';
import { Box, Tooltip } from '@mui/material';

/**
 * Tooltip sobre controles que pueden estar disabled (MUI requiere un wrapper que reciba eventos).
 */
export default function TooltipSpan({ title, children, ...tooltipProps }) {
  return (
    <Tooltip title={title} {...tooltipProps}>
      <Box component="span" sx={{ display: 'inline-flex', verticalAlign: 'middle' }}>
        {children}
      </Box>
    </Tooltip>
  );
}
