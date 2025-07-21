import React from 'react';
import { Container, Box } from '@mui/material';
import { EntityToolbar } from '../components/EntityViews';
import { 
  PersonOutlineOutlined as DeudoresIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { EntityDetails } from '../components/EntityViews';
import { UnderConstruction } from '../components/common';
import { useEffect } from 'react';

export function Deudores() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleHeaderAdd = (e) => {
      if (e.detail?.type === 'deudores') {
        alert('La función de agregar deudor está en construcción.');
      }
    };
    window.addEventListener('headerAddButtonClicked', handleHeaderAdd);
    return () => window.removeEventListener('headerAddButtonClicked', handleHeaderAdd);
  }, []);

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