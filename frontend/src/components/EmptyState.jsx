import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FolderIcon from '@mui/icons-material/Folder';

export function EmptyState() {
  const theme = useTheme();

  return (
    <Box 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        color: theme.palette.text.primary,
        bgcolor: 'transparent',
        borderRadius: 1,
        p: 2,
        textAlign: 'center',
        boxShadow: 0,
        margin: '16px 0'
      }}
    >
      <FolderIcon sx={{ fontSize: 40, color: theme.palette.grey[500], mb: 1 }} />
      <Typography 
        variant="body2"
        sx={{ 
          mb: 1,
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.9)'
        }}
      >
        ¡Parece que aún no tienes datos!
      </Typography>
    </Box>
  );
}

export default EmptyState; 