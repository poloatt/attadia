import React from 'react';
import { Box } from '@mui/material';

export default function PageContainer({ children, sx = {}, ...props }) {
  return (
    <Box
      sx={{
        width: '100%',
        flex: 1,
        px: { xs: 2, sm: 4, md: 6 }, // Más padding horizontal
        py: 3, // Más padding vertical
        ...sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
} 