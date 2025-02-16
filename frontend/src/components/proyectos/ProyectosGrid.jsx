import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import ProyectoCard from './ProyectoCard';
import EmptyState from '../EmptyState';

const ProyectosGrid = ({ proyectos, onEdit, onDelete, onAdd }) => {
  if (proyectos.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <EmptyState onAdd={onAdd} />
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {proyectos.map((proyecto) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={proyecto.id}>
          <Box
            sx={{
              p: 2,
              height: '100%',
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.paper',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                borderColor: 'primary.main',
                transform: 'translateY(-2px)',
                boxShadow: t => `0 4px 8px ${t.palette.divider}`
              }
            }}
          >
            <ProyectoCard
              proyecto={proyecto}
              onEdit={() => onEdit(proyecto)}
              onDelete={() => onDelete(proyecto.id)}
            />
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};

export default ProyectosGrid; 