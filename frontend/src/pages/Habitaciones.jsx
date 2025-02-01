import React from 'react';
import { Container } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import { 
  HomeOutlined as HomeIcon,
  PeopleOutlined as PeopleIcon,
  DescriptionOutlined as DescriptionIcon,
  AttachMoneyOutlined as AttachMoneyIcon,
  AccountBalanceWalletOutlined as AccountBalanceWalletIcon,
  Inventory2Outlined as InventoryIcon
} from '@mui/icons-material';

export function Habitaciones() {
  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => {}}
        searchPlaceholder="Buscar habitaciones..."
        navigationItems={[
          {
            icon: <HomeIcon sx={{ fontSize: 20 }} />,
            label: 'Propiedades',
            to: '/propiedades'
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

// Aseguramos tener tanto la exportación nombrada como la default
export default Habitaciones; 