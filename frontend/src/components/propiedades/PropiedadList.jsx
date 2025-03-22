import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import PropiedadCard from './PropiedadCard';
import EmptyState from '../EmptyState';

const PropiedadList = ({ 
  propiedades, 
  onEdit, 
  onDelete, 
  onAdd,
  filteredPropiedades = []
}) => {
  // Usar propiedades filtradas si existen, sino usar todas las propiedades
  const propiedadesToRender = filteredPropiedades.length > 0 ? filteredPropiedades : propiedades;
  
  // Log para depuración
  console.log('PropiedadList - propiedades a renderizar:', propiedadesToRender);
  
  // Si no hay propiedades, mostrar estado vacío
  if (!propiedadesToRender || propiedadesToRender.length === 0) {
    return <EmptyState onAdd={onAdd} />;
  }
  
  return (
    <Grid container spacing={2}>
      {propiedadesToRender.map((propiedad) => {
        // Verificar si hay datos relacionados disponibles
        // Utilizamos un enfoque más seguro para inicializar los arreglos relacionados
        const propiedadConDatos = {
          ...propiedad,
          inquilinos: Array.isArray(propiedad.inquilinos) ? propiedad.inquilinos : [],
          habitaciones: Array.isArray(propiedad.habitaciones) ? propiedad.habitaciones : [],
          contratos: Array.isArray(propiedad.contratos) ? propiedad.contratos : [],
          inventario: Array.isArray(propiedad.inventario) ? propiedad.inventario : []
        };
        
        // Log de depuración para inquilinos
        if (propiedadConDatos.inquilinos.length > 0) {
          console.log(`Inquilinos para ${propiedad.titulo}:`, 
            propiedadConDatos.inquilinos.map(inq => ({
              id: inq._id || inq.id,
              nombre: inq.nombre || 'Sin nombre',
              apellido: inq.apellido || 'Sin apellido'
            }))
          );
        } else {
          console.log(`No hay inquilinos para ${propiedad.titulo}`);
        }
        
        console.log(`PropiedadCard para ${propiedad.titulo}:`, {
          inquilinos: propiedadConDatos.inquilinos.length,
          habitaciones: propiedadConDatos.habitaciones.length,
          contratos: propiedadConDatos.contratos.length,
          inventario: propiedadConDatos.inventario.length
        });
        
        return (
          <Grid 
            item 
            key={propiedad._id || propiedad.id} 
            xs={12} 
            sm={6} 
            md={4} 
            lg={3}
          >
            <PropiedadCard
              propiedad={propiedadConDatos}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </Grid>
        );
      })}
    </Grid>
  );
};

export default PropiedadList; 