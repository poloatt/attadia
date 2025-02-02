import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const EntityDetails = ({ 
  title, 
  children, 
  action,
  elevation = 0,
  showTitle = false
}) => {
  return (
    <Paper 
      elevation={elevation}
      sx={{ 
        backgroundColor: 'background.default',
        height: '100%',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      {showTitle && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: 'text.secondary',
              fontWeight: 500
            }}
          >
            {title}
          </Typography>
          {action && (
            <Box>
              {action}
            </Box>
          )}
        </Box>
      )}
      <Box sx={{ 
        p: 2,
        minHeight: 100
      }}>
        {children || (
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary',
              textAlign: 'center',
              py: 4
            }}
          >
            No hay datos para mostrar
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default EntityDetails;