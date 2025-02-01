import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import { 
  AddOutlined,
  ArrowBackOutlined,
  HomeOutlined as HomeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const EntityToolbar = ({ 
  onAdd,
  showAddButton = true,
  showBackButton = true,
  showDivider = true,
  navigationItems = []
}) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ 
      display: 'flex',
      alignItems: 'center',
      mb: 3,
      height: 40, // Altura fija para consistencia
      pl: 0 // Elimina el padding izquierdo
    }}>
      {/* Sección de Navegación */}
      <Box sx={{ 
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minWidth: 200, // Espacio fijo para navegación
      }}>
        {showBackButton && (
          <Tooltip title="Volver">
            <IconButton 
              onClick={() => navigate(-1)}
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': { color: 'text.primary' }
              }}
            >
              <ArrowBackOutlined sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        )}

        {navigationItems.map((item, index) => (
          <Tooltip 
            key={index} 
            title={`Ir a ${item.label}`}
            arrow
          >
            <IconButton
              size="small"
              onClick={() => navigate(item.to)}
              sx={{ 
                color: 'text.secondary',
                '&:hover': { 
                  color: 'text.primary',
                  backgroundColor: 'action.hover'
                }
              }}
            >
              {item.icon}
            </IconButton>
          </Tooltip>
        ))}
      </Box>

      {/* Separador */}
      {showDivider && showAddButton && (
        <Divider orientation="vertical" flexItem />
      )}

      {/* Sección de Herramientas */}
      <Box sx={{ 
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        ml: 2
      }}>
        {showAddButton && (
          <Tooltip title="Agregar">
            <IconButton 
              onClick={onAdd}
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': { color: 'text.primary' }
              }}
            >
              <AddOutlined sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export default EntityToolbar; 