import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Collapse
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

const PropiedadCardItem = ({ icon, title, expanded, onToggle, details }) => (
  <Box sx={{ mb: 1 }}>
    <Box
      onClick={onToggle}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        cursor: 'pointer',
        '&:hover': { color: 'primary.main' }
      }}
    >
      {icon}
      <Typography variant="body2" sx={{ flex: 1 }}>
        {title}
      </Typography>
      <IconButton
        size="small"
        sx={{
          p: 0.5,
          transform: expanded ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s'
        }}
      >
        <ExpandMoreIcon sx={{ fontSize: '1rem' }} />
      </IconButton>
    </Box>
    <Collapse in={expanded}>
      <Box sx={{ pl: 3, pt: 0.5 }}>
        {details}
      </Box>
    </Collapse>
  </Box>
);

export default PropiedadCardItem; 