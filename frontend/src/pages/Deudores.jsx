import React from 'react';
import { Container } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import { 
  AccountBalanceOutlined as BankIcon,
  AccountBalanceWalletOutlined as WalletIcon,
  CurrencyExchangeOutlined as CurrencyIcon,
  AutorenewOutlined as RecurrentIcon,
  PersonOutlineOutlined as DeudoresIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import EntityDetails from '../components/EntityViews/EntityDetails';
import UnderConstruction from '../components/UnderConstruction';

export function Deudores() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      <EntityToolbar
        showBackButton={true}
        onBack={() => navigate('/dashboard')}
        title="Deudores"
        icon={<DeudoresIcon />}
        navigationItems={[
          {
            icon: <BankIcon sx={{ fontSize: 21.6 }} />,
            label: 'Cuentas',
            to: '/cuentas'
          },
          {
            icon: <WalletIcon sx={{ fontSize: 21.6 }} />,
            label: 'Transacciones',
            to: '/transacciones'
          },
          {
            icon: <CurrencyIcon sx={{ fontSize: 21.6 }} />,
            label: 'Monedas',
            to: '/monedas'
          },
          {
            icon: <RecurrentIcon sx={{ fontSize: 21.6 }} />,
            label: 'Recurrentes',
            to: '/recurrente'
          }
        ]}
      />

      <EntityDetails title="Deudores">
        <UnderConstruction />
      </EntityDetails>
    </Container>
  );
}

export default Deudores; 