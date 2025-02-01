import React from 'react';
import { Container } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import { 
  AccountBalanceOutlined as BankIcon,
  AccountBalanceWalletOutlined as WalletIcon
} from '@mui/icons-material';

export function Monedas() {
  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => {}}
        entityName="moneda"
        navigationItems={[
          {
            icon: <BankIcon sx={{ fontSize: 18 }} />,
            label: 'Cuentas',
            to: '/cuentas'
          },
          {
            icon: <WalletIcon sx={{ fontSize: 18 }} />,
            label: 'Transacciones',
            to: '/transacciones'
          }
        ]}
      />
      {/* Implementar contenido */}
    </Container>
  );
}

export default Monedas; 