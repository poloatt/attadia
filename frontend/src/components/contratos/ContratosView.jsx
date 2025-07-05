import React from 'react';
import {
  Box
} from '@mui/material';
import ContratoList from './ContratoList';

const ContratosView = ({ 
  contratos = [], 
  relatedData = {}, 
  onEdit, 
  onDelete,
  viewMode = 'list',
  onToggleView
}) => {
  // Debug: Verificar montoMensual en ContratosView
  console.log('🔍 ContratosView montoMensual:', contratos.map(c => ({
    id: c._id,
    montoMensual: c.montoMensual,
    tipo: typeof c.montoMensual,
    esMantenimiento: c.esMantenimiento
  })));

  return (
    <Box sx={{ mt: 2 }}>
      {/* Renderizar la vista correspondiente */}
      <ContratoList
        contratos={contratos}
        relatedData={relatedData}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </Box>
  );
};

export default ContratosView; 