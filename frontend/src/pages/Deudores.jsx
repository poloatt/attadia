import React from 'react';
import { Container, Box } from '@mui/material';
import { Toolbar } from '../navigation';
import { 
  PersonOutlineOutlined as DeudoresIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CommonDetails } from '../components/common';
import { CommonConstruction } from '../components/common';
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
      <Toolbar />

      <CommonDetails title="Deudores">
        <CommonConstruction />
      </CommonDetails>
    </Box>
  );
}

export default Deudores; 