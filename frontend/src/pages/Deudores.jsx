import React from 'react';
import { Container, Box } from '@mui/material';
import { EntityToolbar } from '../components/EntityViews';
import { 
  AccountBalanceOutlined as BankIcon,
  AccountBalanceWalletOutlined as WalletIcon,
  CurrencyExchangeOutlined as CurrencyIcon,
  AutorenewOutlined as RecurrentIcon,
  PersonOutlineOutlined as DeudoresIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { EntityDetails } from '../components/EntityViews';
import { UnderConstruction } from '../components/common';

export function Deudores() {
  const navigate = useNavigate();

  return (
    <Box sx={{ px: 0, width: '100%' }}>
      <EntityToolbar />

      <EntityDetails title="Deudores">
        <UnderConstruction />
      </EntityDetails>
    </Box>
  );
}

export default Deudores; 