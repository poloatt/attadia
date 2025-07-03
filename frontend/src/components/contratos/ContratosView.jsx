import React from 'react';
import {
  Box
} from '@mui/material';
import ContratosListView from './ContratosListView';
import ContratosGridView from './ContratosGridView';

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
      {viewMode === 'list' ? (
        <ContratosListView
          contratos={contratos}
          relatedData={relatedData}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleView={onToggleView}
          viewMode={viewMode}
        />
      ) : (
        <ContratosGridView
          type="contratos"
          contratos={contratos}
          relatedData={relatedData}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleView={onToggleView}
          viewMode={viewMode}
        />
      )}
    </Box>
  );
};

export default ContratosView; 