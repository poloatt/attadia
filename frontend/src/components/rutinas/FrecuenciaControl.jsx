import React from 'react';
import {
  Box,
  Typography,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

const FrecuenciaControl = ({ value, onChange, tipo = 'DIARIO', periodo = 'CADA_DIA' }) => {
  // Asegurar que siempre trabajamos con un número
  const numValue = parseInt(value, 10) || 1;
  
  // Normalizar los valores para evitar problemas con undefined
  const tipoNormalizado = (tipo || 'DIARIO').toUpperCase();
  const periodoNormalizado = (periodo || 'CADA_DIA').toUpperCase();
  
  console.log(`FrecuenciaControl - Valor actual: ${numValue}, tipo: ${tipoNormalizado}, periodo: ${periodoNormalizado}`);
  
  const handleDecrease = () => {
    const newValue = Math.max(1, numValue - 1);
    console.log(`FrecuenciaControl - Disminuyendo de ${numValue} a ${newValue}`);
    onChange(newValue);
  };

  const handleIncrease = () => {
    let maxValue = 10;
    if (tipoNormalizado === 'PERSONALIZADO') {
      if (periodoNormalizado === 'CADA_DIA') maxValue = 31;
      if (periodoNormalizado === 'CADA_SEMANA') maxValue = 52;
      if (periodoNormalizado === 'CADA_MES') maxValue = 12;
    }
    
    const newValue = Math.min(maxValue, numValue + 1);
    console.log(`FrecuenciaControl - Aumentando de ${numValue} a ${newValue}`);
    onChange(newValue);
  };

  const handleChange = (event) => {
    // Validar entrada directa
    let inputValue = event.target.value.replace(/[^0-9]/g, '');
    let newValue = parseInt(inputValue, 10);
    
    if (isNaN(newValue) || newValue < 1) {
      newValue = 1;
    }
    
    let maxValue = 10;
    if (tipoNormalizado === 'PERSONALIZADO') {
      if (periodoNormalizado === 'CADA_DIA') maxValue = 31;
      if (periodoNormalizado === 'CADA_SEMANA') maxValue = 52;
      if (periodoNormalizado === 'CADA_MES') maxValue = 12;
    }
    
    newValue = Math.min(maxValue, newValue);
    console.log(`FrecuenciaControl - Cambiando a través de input a: ${newValue}`);
    onChange(newValue);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      px: 1
    }}>
      <IconButton
        size="small"
        onClick={handleDecrease}
        disabled={numValue <= 1}
      >
        <RemoveIcon fontSize="small" />
      </IconButton>
      <Typography 
        sx={{ 
          width: 40, 
          textAlign: 'center',
          userSelect: 'none'
        }}
      >
        {numValue}
      </Typography>
      <IconButton
        size="small"
        onClick={handleIncrease}
      >
        <AddIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default FrecuenciaControl; 