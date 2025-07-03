import React, { useState, useEffect } from 'react';
import { Grid, Box, Typography, IconButton } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import PropiedadCard from './PropiedadCard';
import EmptyState from '../EmptyState';

const PropiedadList = ({ 
  propiedades, 
  onEdit, 
  onDelete, 
  onAdd,
  filteredPropiedades = [],
  isDashboard = false,
  contratos = []
}) => {
  // Inicializar todas las propiedades como colapsadas por defecto
  const [expandedProperties, setExpandedProperties] = useState(() => {
    const propiedadesToRender = filteredPropiedades.length > 0 ? filteredPropiedades : propiedades;
    const initialExpanded = {};
    propiedadesToRender.forEach(propiedad => {
      initialExpanded[propiedad._id || propiedad.id] = false;
    });
    return initialExpanded;
  });

  // Usar propiedades filtradas si existen, sino usar todas las propiedades
  const propiedadesToRender = filteredPropiedades.length > 0 ? filteredPropiedades : propiedades;

  // Actualizar estado cuando cambien las propiedades, manteniendo las nuevas como colapsadas
  useEffect(() => {
    setExpandedProperties(prev => {
      const newExpanded = { ...prev };
      propiedadesToRender.forEach(propiedad => {
        const id = propiedad._id || propiedad.id;
        if (!(id in newExpanded)) {
          newExpanded[id] = false;
        }
      });
      // Elimina propiedades que ya no existen
      Object.keys(newExpanded).forEach(id => {
        if (!propiedadesToRender.find(p => (p._id || p.id) === id)) {
          delete newExpanded[id];
        }
      });
      return newExpanded;
    });
  }, [propiedades, filteredPropiedades]);
  
  // Si no hay propiedades, mostrar estado vacío
  if (!propiedadesToRender?.length) {
    return <EmptyState onAdd={onAdd} />;
  }

  // Solo una expandida a la vez
  const handleToggleExpand = (propiedadId) => {
    setExpandedProperties(prev => {
      const newExpanded = {};
      Object.keys(prev).forEach(id => {
        newExpanded[id] = false;
      });
      newExpanded[propiedadId] = !prev[propiedadId];
      return newExpanded;
    });
  };
  
  return (
    <Box sx={{ mt: isDashboard ? 0 : 2 }}>
      {propiedadesToRender.map((propiedad) => {
        // Verificar si hay datos relacionados disponibles
        const propiedadConDatos = {
          ...propiedad,
          inquilinos: Array.isArray(propiedad.inquilinos) ? propiedad.inquilinos : [],
          habitaciones: Array.isArray(propiedad.habitaciones) ? propiedad.habitaciones : [],
          contratos: Array.isArray(propiedad.contratos) ? propiedad.contratos : 
                    contratos.filter(c => c.propiedad?._id === propiedad._id),
          inventario: Array.isArray(propiedad.inventario) ? propiedad.inventario : []
        };
        
        return (
          <Box 
            key={propiedad._id || propiedad.id}
            sx={{ 
              mb: 1,
              pb: 1,
              bgcolor: 'background.default',
              '&:last-child': {
                mb: 0,
                pb: 0
              }
            }}
          >
            <PropiedadCard
              propiedad={propiedadConDatos}
              onEdit={onEdit}
              onDelete={onDelete}
              isDashboard={isDashboard}
              isExpanded={expandedProperties[propiedad._id || propiedad.id] || false}
              onToggleExpand={() => handleToggleExpand(propiedad._id || propiedad.id)}
            />
          </Box>
        );
      })}
    </Box>
  );
};

export default PropiedadList; 