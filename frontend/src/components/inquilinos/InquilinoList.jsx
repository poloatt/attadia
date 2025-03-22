import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Collapse,
  IconButton,
  Chip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Home as HomeIcon,
  Description as ContractIcon,
  Circle as StatusIcon
} from '@mui/icons-material';
import InquilinoCard from './InquilinoCard';

const InquilinoList = ({ 
  inquilinos = [], 
  onEdit, 
  onDelete,
  expandedGroups = {},
  onToggleGroup
}) => {
  if (inquilinos.length === 0) {
    return (
      <Box 
        sx={{ 
          textAlign: 'center', 
          py: 4,
          color: 'text.secondary'
        }}
      >
        <Typography>No hay inquilinos registrados</Typography>
      </Box>
    );
  }

  // Agrupar inquilinos por estado
  const grupos = {
    ACTIVO: {
      id: 'activos',
      titulo: 'Inquilinos Activos',
      color: 'success.main',
      inquilinos: []
    },
    RESERVADO: {
      id: 'reservados',
      titulo: 'Inquilinos con Reserva',
      color: 'warning.main',
      inquilinos: []
    },
    PENDIENTE: {
      id: 'pendientes',
      titulo: 'Inquilinos Pendientes',
      color: 'info.main',
      inquilinos: []
    },
    INACTIVO: {
      id: 'inactivos',
      titulo: 'Inquilinos Inactivos',
      color: 'text.disabled',
      inquilinos: []
    }
  };

  // Clasificar inquilinos por estado
  console.log('Total de inquilinos a clasificar:', inquilinos.length);
  inquilinos.forEach(inquilino => {
    console.log('Clasificando inquilino:', {
      id: inquilino._id || inquilino.id,
      nombre: inquilino.nombre,
      estado: inquilino.estado,
      propiedad: inquilino.propiedad?.titulo || 'Sin propiedad asignada'
    });
    
    // Si el inquilino no tiene estado, asignarle PENDIENTE
    const estado = inquilino.estado || 'PENDIENTE';
    
    if (grupos[estado]) {
      grupos[estado].inquilinos.push(inquilino);
    } else {
      console.warn('Inquilino con estado no reconocido:', estado);
    }
  });

  // Filtrar grupos vacíos y ordenar
  const gruposConInquilinos = Object.values(grupos).filter(g => g.inquilinos.length > 0);
  console.log('Grupos después de clasificar:', Object.fromEntries(
    Object.entries(grupos).map(([key, grupo]) => [
      key,
      {
        ...grupo,
        cantidad: grupo.inquilinos.length,
        inquilinos: grupo.inquilinos.map(i => ({
          id: i._id || i.id,
          nombre: i.nombre,
          estado: i.estado,
          propiedad: i.propiedad?.titulo || 'Sin propiedad asignada'
        }))
      }
    ])
  ));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {gruposConInquilinos.map(grupo => (
        <Box key={grupo.id}>
          {/* Cabecera del grupo */}
          <Box 
            onClick={() => onToggleGroup(grupo.id)}
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 1,
              cursor: 'pointer',
              userSelect: 'none',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <IconButton
              size="small"
              sx={{ 
                p: 0.5,
                transform: expandedGroups[grupo.id] ? 'rotate(-180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
            
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flex: 1
            }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <StatusIcon sx={{ 
                  fontSize: 12, 
                  color: grupo.color 
                }} />
                
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: 'text.primary',
                    fontWeight: 500
                  }}
                >
                  {grupo.titulo}
                </Typography>
              </Box>
            </Box>

            <Chip
              size="small"
              label={`${grupo.inquilinos.length} ${grupo.inquilinos.length === 1 ? 'inquilino' : 'inquilinos'}`}
              sx={{ 
                height: 20,
                borderRadius: 0,
                bgcolor: 'transparent',
                color: grupo.color,
                fontSize: '0.65rem',
                '& .MuiChip-label': {
                  px: 0
                }
              }}
            />
          </Box>

          {/* Lista de inquilinos del grupo */}
          <Collapse in={expandedGroups[grupo.id]} timeout={200}>
            <Grid container spacing={2}>
              {grupo.inquilinos.map(inquilino => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={inquilino._id}>
                  <InquilinoCard
                    inquilino={inquilino}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </Grid>
              ))}
            </Grid>
          </Collapse>
        </Box>
      ))}
    </Box>
  );
};

export default InquilinoList; 