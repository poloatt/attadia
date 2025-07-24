import React, { useState, useEffect } from 'react';
import { ListItem, Box, IconButton, Typography, Button } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import InlineItemConfigImproved, { getFrecuenciaLabel } from './InlineItemConfigImproved';

const ChecklistItem = ({
  itemId,
  section,
  Icon,
  isCompleted,
  readOnly,
  onItemClick,
  config = {},
  onConfigChange,
  isSetupOpen,
  onSetupToggle
}) => {

  return (
    <>
      <ListItem 
        disablePadding
        sx={{ 
          mb: 0.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          bgcolor: 'transparent',
        }}
      >
        <Box sx={{ 
          width: '100%', 
          display: 'flex',
          alignItems: 'center',
          py: 0.5,
          position: 'relative'
        }}>
          {/* Icono de hábito */}
          {!readOnly && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation(); // Prevenir que el evento se propague al contenedor
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
                borderRadius: 0, // geométrico
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: isCompleted ? 'primary.main' : 'white',
                  bgcolor: isCompleted ? 'action.selected' : 'rgba(255,255,255,0.1)'
                }
              }}
            >
              {Icon && <Icon fontSize="small" />}
            </IconButton>
          )}
          {/* Contenido principal */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexGrow: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: isCompleted ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.9)',
            pr: 0 // sin padding derecho, para que el engranaje quede pegado
          }}>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              minWidth: 0,
              flexGrow: 1,
              overflow: 'hidden',
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 400,
                  color: isCompleted ? 'rgba(255,255,255,0.5)' : 'inherit',
                  textDecoration: isCompleted ? 'line-through' : 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%'
                }}
              >
                {itemId}
              </Typography>
              {/* Resumen de configuración centralizado */}
              {config && (
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ fontSize: '0.7rem', mt: 0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}
                >
                  {getFrecuenciaLabel(config)}
                </Typography>
              )}
            </Box>
          </Box>
          {/* Engranaje alineado a la derecha */}
          {!readOnly && (
            <IconButton
              edge="end"
              aria-label="setup"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (onSetupToggle) onSetupToggle();
              }}
              sx={{
                color: isSetupOpen ? 'primary.main' : 'rgba(255,255,255,0.3)',
                borderRadius: 0,
                ml: 'auto',
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: 'rgba(255,255,255,0.08)'
                }
              }}
            >
              <TuneIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>
          )}
        </Box>
      </ListItem>
      {/* Setup debajo del ítem */}
      {isSetupOpen && (
        <Box sx={{ width: '100%', mt: 1 }}>
          <InlineItemConfigImproved
            config={config}
            onConfigChange={onConfigChange}
            itemId={itemId}
            sectionId={section}
          />
        </Box>
      )}
    </>
  );
};

export default React.memo(ChecklistItem, (prevProps, nextProps) => {
  return (
    prevProps.isCompleted === nextProps.isCompleted &&
    prevProps.isSetupOpen === nextProps.isSetupOpen &&
    JSON.stringify(prevProps.config) === JSON.stringify(nextProps.config)
  );
}); 
