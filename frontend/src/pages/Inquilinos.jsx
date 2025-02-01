import React from 'react';
import { Container } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import { 
  ApartmentOutlined as BuildingIcon,
  BedOutlined as BedIcon,
  DescriptionOutlined as DescriptionIcon,
  Inventory2Outlined as InventoryIcon
} from '@mui/icons-material';

export function Inquilinos() {
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
            icon: <DescriptionIcon sx={{ fontSize: 20 }} />,
            label: 'Contratos',
            to: '/contratos'
          },
          {
            icon: <InventoryIcon sx={{ fontSize: 20 }} />,
            label: 'Inventario',
            to: '/inventario'
          }
        ]}
      />
      {/* Implementar contenido */}
    </Container>
  );
}

export default Inquilinos; 