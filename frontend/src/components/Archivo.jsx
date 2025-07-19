import React from 'react';
import { EntityToolbar } from './EntityViews';
import { Box, IconButton, Tooltip } from '@mui/material';
import { ArchiveIcon, ProjectIcon, TaskIcon, FilterListIcon } from '../icons';

const Archivo = () => {
  return (
    <EntityToolbar 
      title="Archivo"
      icon={<ArchiveIcon sx={{ fontSize: 20 }} />}
      showAddButton={false}
      navigationItems={[
        { 
          icon: <ProjectIcon sx={{ fontSize: 20 }} />, 
          label: 'Proyectos', 
          to: '/proyectos',
          current: false
        },
        {
          icon: <TaskIcon sx={{ fontSize: 20 }} />,
          label: 'Tareas',
          to: '/tareas',
          current: false
        }
      ]}
    >
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="Filtros">
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <FilterListIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </EntityToolbar>
  );
};

export default Archivo; 