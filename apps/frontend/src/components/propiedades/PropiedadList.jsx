import React, { useState, useEffect } from 'react';
import { Grid, Box, Typography, IconButton } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import PropiedadCard from './PropiedadCard';
import { EmptyState } from '../common';
// Si corresponde, importa { SeccionInquilinos, SeccionHabitaciones, SeccionContratos, SeccionInventario, SeccionDocumentos } from './SeccionesPropiedad';

const PropiedadList = ({ isAssets = false, ...props }) => {
  // Inicializar todas las propiedades como colapsadas por defecto
  const [expandedProperties, setExpandedProperties] = useState(() => {
    const propiedadesToRender = props.filteredPropiedades.length > 0 ? props.filteredPropiedades : props.propiedades;
    const initialExpanded = {};
    propiedadesToRender.forEach(propiedad => {
      initialExpanded[propiedad._id || propiedad.id] = false;
    });
    return initialExpanded;
  });

  // Usar propiedades filtradas si existen, sino usar todas las propiedades
  const propiedadesToRender = props.filteredPropiedades.length > 0 ? props.filteredPropiedades : props.propiedades;

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
  }, [props.propiedades, props.filteredPropiedades]);
  
  // Si no hay propiedades, mostrar estado vacío
  if (!propiedadesToRender?.length) {
    return <EmptyState onAdd={props.onAdd} />;
  }

  // Solo una expandida a la vez
  const handleToggleExpand = (propiedadId) => {
    setExpandedProperties(prev => {
      const newExpanded = {};
      Object.keys(prev).forEach(id => {
        newExpanded[id] = false;
      });
      // Si ya estaba expandida, la colapsa (todas quedan colapsadas)
      // Si no, la expande y las demás quedan colapsadas
      if (!prev[propiedadId]) {
        newExpanded[propiedadId] = true;
      }
      return newExpanded;
    });
  };

  return (
    <Box sx={{ mt: isAssets ? 0 : 2 }}>
      {propiedadesToRender.map((propiedad, idx) => {
        // Verificar si hay datos relacionados disponibles
        const propiedadConDatos = {
          ...propiedad,
          inquilinos: Array.isArray(propiedad.inquilinos) ? propiedad.inquilinos : [],
          habitaciones: Array.isArray(propiedad.habitaciones) ? propiedad.habitaciones : [],
          contratos: Array.isArray(propiedad.contratos) ? propiedad.contratos : 
                    props.contratos.filter(c => c.propiedad?._id === propiedad._id),
          inventario: Array.isArray(propiedad.inventario) ? propiedad.inventario : [],
          documentos: Array.isArray(propiedad.documentos) ? propiedad.documentos : []
        };
        
        return (
          <React.Fragment key={propiedad._id || propiedad.id}>
            <Box 
              sx={{
                mb: (propiedadConDatos.inquilinos.length === 0 && propiedadConDatos.habitaciones.length === 0 && propiedadConDatos.contratos.length === 0 && propiedadConDatos.documentos.length === 0) ? 1 : 0,
                pb: (propiedadConDatos.inquilinos.length === 0 && propiedadConDatos.habitaciones.length === 0 && propiedadConDatos.contratos.length === 0 && propiedadConDatos.documentos.length === 0) ? 1 : 0,
                bgcolor: (theme) => theme.palette.collapse.background,
                border: 1,
                borderColor: (theme) => theme.palette.divider,
                '&:last-child': {
                  mb: 0,
                  pb: 0
                }
              }}
            >
              <PropiedadCard
                propiedad={propiedadConDatos}
                onEdit={props.onEdit}
                onDelete={props.onDelete}
                isAssets={isAssets}
                isExpanded={expandedProperties[propiedad._id || propiedad.id] || false}
                onToggleExpand={() => handleToggleExpand(propiedad._id || propiedad.id)}
              />
            </Box>
            {/* Espacio visual entre propiedades con fondo principal */}
            {idx < propiedadesToRender.length - 1 && (
              <Box sx={{ height: 8, backgroundColor: (theme) => theme.palette.background.default }} />
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
};

export default PropiedadList; 