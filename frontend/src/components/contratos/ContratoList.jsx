import React, { useState, useEffect } from 'react';
import { Grid, Box, Typography, IconButton } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import ContratoCard from './ContratoCard';
import EmptyState from '../EmptyState';

const ContratoList = ({ 
  contratos, 
  onEdit, 
  onDelete, 
  onAdd,
  filteredContratos = [],
  isDashboard = false,
  relatedData = {}
}) => {
  // Estado global para la vista grid/list
  const [viewMode, setViewMode] = useState('grid');

  // Usar contratos filtrados si existen, sino usar todos los contratos
  const contratosToRender = filteredContratos.length > 0 ? filteredContratos : contratos;

  // Inicializar todas las propiedades como colapsadas por defecto
  const [expandedContratos, setExpandedContratos] = useState(() => {
    const initialExpanded = {};
    contratosToRender.forEach(contrato => {
      initialExpanded[contrato._id || contrato.id] = false;
    });
    return initialExpanded;
  });

  // Actualizar estado cuando cambien los contratosToRender
  useEffect(() => {
    setExpandedContratos(prev => {
      const newExpanded = { ...prev };
      contratosToRender.forEach(contrato => {
        const id = contrato._id || contrato.id;
        if (!(id in newExpanded)) {
          newExpanded[id] = false;
        }
      });
      // Elimina contratos que ya no existen
      Object.keys(newExpanded).forEach(id => {
        if (!contratosToRender.find(c => (c._id || c.id) === id)) {
          delete newExpanded[id];
        }
      });
      return newExpanded;
    });
  }, [contratosToRender]);
  
  // Si no hay contratos, mostrar estado vacío
  if (!contratosToRender?.length) {
    return <EmptyState onAdd={onAdd} />;
  }

  // Solo una expandida a la vez
  const handleToggleExpand = (contratoId) => {
    setExpandedContratos(prev => {
      const newExpanded = {};
      // Colapsar todas las demás
      Object.keys(prev).forEach(id => {
        newExpanded[id] = id === contratoId ? !prev[id] : false;
      });
      return newExpanded;
    });
  };

  return (
    <Grid container spacing={2}>
      {contratosToRender.map((contrato) => {
        const isExpanded = expandedContratos[contrato._id || contrato.id] || false;
        
        return (
          <Grid item key={contrato._id || contrato.id} xs={12}>
            <ContratoCard
              contrato={contrato}
              onEdit={onEdit}
              onDelete={onDelete}
              isDashboard={isDashboard}
              isExpanded={isExpanded}
              onToggleExpand={() => handleToggleExpand(contrato._id || contrato.id)}
              relatedData={relatedData}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          </Grid>
        );
      })}
    </Grid>
  );
};

export default ContratoList; 