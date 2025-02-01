import React from 'react';
import { Container } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import { 
  ScienceOutlined as LabIcon,
  TaskAltOutlined as RutinasIcon
} from '@mui/icons-material';
import EntityDetails from '../components/EntityDetails';

export function Dieta() {
  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => {}}
        navigationItems={[
          {
            icon: <LabIcon sx={{ fontSize: 20 }} />,
            label: 'Lab',
            to: '/lab'
          },
          {
            icon: <RutinasIcon sx={{ fontSize: 20 }} />,
            label: 'Rutinas',
            to: '/rutinas'
          }
        ]}
      />
      <EntityDetails>
        {/* Contenido de dieta */}
      </EntityDetails>
    </Container>
  );
}

export default Dieta; 