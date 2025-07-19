import React, { useState } from 'react';
import { Box, Grid, IconButton, Tooltip } from '@mui/material';
import { GridOn as GridIcon, List as ListIcon } from '@mui/icons-material';
import ContratoCard from './ContratoCard';
import ContratosGridView from './ContratosGridView';
import ContratosListView from './ContratosListView';
import { EmptyState } from '../../common';
import { useContratoData } from './hooks/useContratoData';
import { useContratoExpansion } from './hooks/useContratoExpansion';

const ContratosContainer = ({ 
  contratos = [], 
  relatedData = {}, 
  onEdit, 
  onDelete,
  onAdd,
  viewMode: initialViewMode = 'grid'
}) => {
  const [viewMode, setViewMode] = useState(initialViewMode);
  
  // Usar hooks personalizados
  const { contratosOrdenados } = useContratoData(contratos, relatedData);
  const { isExpanded, toggleExpansion } = useContratoExpansion(contratos);

  const handleToggleView = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  // Si no hay contratos, mostrar estado vacío
  if (!contratosOrdenados?.length) {
    return <EmptyState onAdd={onAdd} />;
  }

  return (
    <Box sx={{ mt: 2 }}>
      {/* Header con toggle de vista */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        mb: 2,
        px: 1
      }}>
        <Tooltip title={viewMode === 'list' ? 'Cambiar a vista grid' : 'Cambiar a vista lista'}>
          <IconButton 
            onClick={handleToggleView} 
            size="small" 
            sx={{ 
              color: 'text.secondary',
              borderRadius: 0,
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            {viewMode === 'list' ? <GridIcon /> : <ListIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Renderizar vista correspondiente */}
      {viewMode === 'grid' ? (
        <Grid container spacing={2}>
          {contratosOrdenados.map((contrato) => {
            const contratoId = contrato._id || contrato.id;
            
            return (
              <Grid item key={contratoId} xs={12} sm={12} md={6} lg={6}>
                <ContratoCard
                  contrato={contrato}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isExpanded={isExpanded(contratoId)}
                  onToggleExpand={() => toggleExpansion(contratoId)}
                  relatedData={relatedData}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                />
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <ContratosListView
          contratos={contratosOrdenados}
          relatedData={relatedData}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleView={handleToggleView}
          viewMode={viewMode}
        />
      )}
    </Box>
  );
};

export default ContratosContainer; 