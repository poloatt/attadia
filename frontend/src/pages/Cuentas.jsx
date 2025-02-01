import React from 'react';
import { Container } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import { 
  CurrencyExchangeOutlined as CurrencyIcon,
  AccountBalanceWalletOutlined as WalletIcon
} from '@mui/icons-material';

export function Cuentas() {
  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => {}}
        navigationItems={[
          {
            icon: <CurrencyIcon sx={{ fontSize: 20 }} />,
            label: 'Monedas',
            to: '/monedas'
          },
          {
            icon: <WalletIcon sx={{ fontSize: 20 }} />,
            label: 'Transacciones',
            to: '/transacciones'
          }
        ]}
      />
      {/* Implementar contenido */}
    </Container>
  );
}

export default Cuentas; 