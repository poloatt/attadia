import React from 'react';
import { Container, Button, Box } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { 
  ScienceOutlined as LabIcon,
  RestaurantOutlined as DietaIcon,
  MonitorWeightOutlined as WeightIcon
} from '@mui/icons-material';
import { EntityToolbar, EntityDetails } from '../components/EntityViews';
import { UnderConstruction } from '../components/common';

export function Salud() {
  return (
    <Box sx={{ px: 0, width: '100%' }}>
      <EntityToolbar
        navigationItems={[
          {
            icon: <LabIcon sx={{ fontSize: 21.6 }} />,
            label: 'Lab',
            to: '/lab'
          },
          {
            icon: <DietaIcon sx={{ fontSize: 21.6 }} />,
            label: 'Dieta',
            to: '/dieta'
          },
          {
            icon: <WeightIcon sx={{ fontSize: 21.6 }} />,
            label: 'Composición Corporal',
            to: '/datacorporal'
          }
        ]}
      />

      <EntityDetails
        title="Salud"
        action={
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            size="small"
            sx={{ borderRadius: 0 }}
          >
            Nuevo Registro
          </Button>
        }
      >
        <UnderConstruction />
      </EntityDetails>
    </Box>
  );
}

export default Salud; 