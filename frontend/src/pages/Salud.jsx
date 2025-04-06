import React from 'react';
import { Container, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { 
  ScienceOutlined as LabIcon,
  RestaurantOutlined as DietaIcon,
  MonitorWeightOutlined as WeightIcon
} from '@mui/icons-material';
import EntityToolbar from '../components/EntityToolbar';
import EntityDetails from '../components/EntityViews/EntityDetails';
import UnderConstruction from '../components/UnderConstruction';

export function Salud() {
  return (
    <Container maxWidth="lg">
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
    </Container>
  );
}

export default Salud; 