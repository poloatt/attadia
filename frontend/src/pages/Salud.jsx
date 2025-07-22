import React from 'react';
import { Container, Button, Box } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { 
  ScienceOutlined as LabIcon,
  RestaurantOutlined as DietaIcon,
  MonitorWeightOutlined as WeightIcon
} from '@mui/icons-material';
import { CommonDetails } from '../components/common';
import { Toolbar } from '../navigation';
import { CommonConstruction } from '../components/common';

export function Salud() {
  return (
    <Box sx={{ px: 0, width: '100%' }}>
      <Toolbar />

      <CommonDetails
        title="Salud"
        action={
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            size="small"
            sx={{ borderRadius: 0 }}
          >
            Nuevo Registro
          </Button>
        }
      >
        <CommonConstruction />
      </CommonDetails>
    </Box>
  );
}

export default Salud; 