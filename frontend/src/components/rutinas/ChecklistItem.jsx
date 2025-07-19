import React, { useState, useEffect } from 'react';
import { ListItem, Box, IconButton, Typography } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

const ChecklistItem = ({
  itemId,
  section,
  Icon,
  isCompleted,
  readOnly,
  onItemClick,
  contextMenu,
  handleConfigItem,
  isConfigOpen,
  historialData,
  config,
  rutina,
  getItemCadenciaStatus
}) => {
  const [cadenciaStatus, setCadenciaStatus] = useState("Cargando...");

  useEffect(() => {
    let isMounted = true;
    
    const cargarCadencia = async () => {
      try {
        const estado = await getItemCadenciaStatus(itemId, section, rutina, config);
        if (isMounted) {
          setCadenciaStatus(estado);
        }
      } catch (error) {
        console.error(`Error cargando cadencia para ${section}.${itemId}:`, error);
        if (isMounted) {
          setCadenciaStatus("Error");
        }
      }
    };
    
    cargarCadencia();
    
    return () => {
      isMounted = false;
    };
  }, [itemId, section, rutina?._id, isCompleted, getItemCadenciaStatus, config]);

  return (
    <ListItem 
      disablePadding
      sx={{ 
        mb: 0.5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        bgcolor: 'transparent'
      }}
    >
      <Box sx={{ 
        width: '100%', 
        display: 'flex',
        alignItems: 'center',
        py: 0.5
      }}>
        {!readOnly && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onItemClick(itemId, e);
            }}
            sx={{
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1,
              cursor: 'pointer',
              color: isCompleted ? 'primary.main' : 'rgba(255,255,255,0.5)',
              bgcolor: isCompleted ? 'action.selected' : 'transparent',
              borderRadius: '50%',
              '&:hover': {
                color: isCompleted ? 'primary.main' : 'white',
                bgcolor: isCompleted ? 'action.selected' : 'rgba(255,255,255,0.1)'
              }
            }}
          >
            {Icon && <Icon fontSize="small" />}
          </IconButton>
        )}
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          flexGrow: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: isCompleted ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.9)'
        }}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 400,
                color: isCompleted ? 'rgba(255,255,255,0.5)' : 'inherit',
                textDecoration: isCompleted ? 'line-through' : 'none'
              }}
            >
              {itemId}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.6)'
              }}
            >
              {cadenciaStatus}
            </Typography>
          </Box>
        </Box>

        {!readOnly && (
          <IconButton
            edge="end"
            aria-label="configurar"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleConfigItem(itemId);
            }}
            sx={{
              color: isConfigOpen ? 'primary.main' : 'rgba(255,255,255,0.3)',
              '&:hover': {
                color: 'primary.main'
              }
            }}
          >
            <SettingsIcon sx={{ fontSize: '1.1rem' }} />
          </IconButton>
        )}
      </Box>
    </ListItem>
  );
};

export default React.memo(ChecklistItem, (prevProps, nextProps) => {
  return (
    prevProps.isCompleted === nextProps.isCompleted &&
    prevProps.isConfigOpen === nextProps.isConfigOpen &&
    JSON.stringify(prevProps.historialData) === JSON.stringify(nextProps.historialData) &&
    JSON.stringify(prevProps.config) === JSON.stringify(nextProps.config) &&
    prevProps.rutina?._id === nextProps.rutina?._id
  );
}); 
