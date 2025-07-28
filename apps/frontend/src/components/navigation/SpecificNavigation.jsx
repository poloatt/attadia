import React from 'react';
import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { RutinaNavigation } from '../rutinas/RutinaNavigation';
import { useRutinas } from '../../context/RutinasContext';
import { useRutinasStatistics } from '../../context/RutinasStatisticsContext';

/**
 * Componente que maneja navegaciones específicas para páginas que no pueden usar el Toolbar estándar
 * Se renderiza en el Layout cuando se detecta que una página necesita navegación específica
 */
const SpecificNavigation = ({ currentPath }) => {
  const location = useLocation();
  
  // Para rutinas, necesitamos acceder al contexto de rutinas
  if (currentPath.startsWith('/tiempo/rutinas')) {
    return <RutinaNavigationWrapper />;
  }
  
  // Aquí se pueden agregar más navegaciones específicas para otras páginas
  // if (currentPath.startsWith('/otra/ruta')) {
  //   return <OtraNavegacionEspecifica />;
  // }
  
  return null;
};

/**
 * Wrapper para RutinaNavigation que proporciona los datos necesarios desde el contexto
 */
const RutinaNavigationWrapper = () => {
  const { rutina, rutinas, loading } = useRutinas();
  const { calculateCompletionPercentage } = useRutinasStatistics();
  
  // Calcular página actual y total de páginas
  const currentPage = rutina ? rutinas.findIndex(r => r._id === rutina._id) + 1 : 1;
  const totalPages = rutinas.length;
  
  // Handlers para las acciones
  const handleEdit = (rutina) => {
    // Disparar evento para que la página maneje la edición
    window.dispatchEvent(new CustomEvent('editRutina', { detail: { rutina } }));
  };
  
  const handleAdd = () => {
    // Disparar evento para que la página maneje la adición
    window.dispatchEvent(new CustomEvent('addRutina'));
  };
  
  if (!rutina) return null;
  
  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <RutinaNavigation 
        rutina={rutina}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onEdit={handleEdit}
        onAdd={handleAdd}
      />
    </Box>
  );
};

export default SpecificNavigation; 