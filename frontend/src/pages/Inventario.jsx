import React from 'react';
import { Container } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import { 
  ApartmentOutlined as BuildingIcon,
  BedOutlined as BedIcon,
  PeopleOutlined as PeopleIcon,
  DescriptionOutlined as DescriptionIcon
} from '@mui/icons-material';

export function Inventario() {
  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => {}}
        navigationItems={[
          {
            icon: <BuildingIcon sx={{ fontSize: 20 }} />,
            label: 'Propiedades',
            to: '/propiedades'
          },
          {
            icon: <BedIcon sx={{ fontSize: 20 }} />,
            label: 'Habitaciones',
            to: '/habitaciones'
          },
          {
            icon: <PeopleIcon sx={{ fontSize: 20 }} />,
            label: 'Inquilinos',
            to: '/inquilinos'
          },
          {
            icon: <DescriptionIcon sx={{ fontSize: 20 }} />,
            label: 'Contratos',
            to: '/contratos'
          }
        ]}
      />
      {/* Implementar contenido */}
    </Container>
  );
}

export default Inventario;
