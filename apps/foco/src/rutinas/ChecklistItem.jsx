import React, { memo } from 'react';
import { ListItem, Box, IconButton, Typography, Button, Chip } from '@mui/material';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import InlineItemConfigImproved, { getFrecuenciaLabel } from './InlineItemConfigImproved';
import { getTimeOfDayLabels } from '@shared/utils/timeOfDayUtils';
import { SystemButtons } from '@shared/components/common/SystemButtons';
import { ACTIONS } from '@shared/components/common/CommonActions';

// Botón de hábito modularizado para uso en RutinaCard y otros
export const HabitIconButton = ({ isCompleted, Icon, onClick, readOnly, size = 38, iconSize = 'small', mr = 1, ...props }) => (
  <IconButton
    size="small"
    onClick={onClick}
    disabled={readOnly}
    sx={{
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      mr: mr,
      cursor: 'pointer',
      color: isCompleted ? 'primary.main' : 'rgba(255,255,255,0.5)',
      bgcolor: isCompleted ? 'action.selected' : 'transparent',
      borderRadius: '50%',
      transition: 'all 0.2s ease',
      '&:hover': {
        color: isCompleted ? 'primary.main' : 'white',
        bgcolor: isCompleted ? 'action.selected' : 'rgba(255,255,255,0.1)'
      }
    }}
    {...props}
  >
    {Icon && <Icon fontSize={iconSize} />}
  </IconButton>
);

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
  onSetupToggle,
  isCustomHabit = false,
  habitLabel = '',
  onEditHabit,
  onDeleteHabit,
}) => {
  const handleDeleteClick = async (e) => {
    e.stopPropagation();
    if (onDeleteHabit) {
      await onDeleteHabit();
    }
  };

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
            <HabitIconButton
              isCompleted={isCompleted}
              Icon={Icon}
              onClick={(e) => {
                e.stopPropagation();
                onItemClick(itemId, e);
              }}
              readOnly={readOnly}
            />
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 400,
                    color: isCompleted ? 'rgba(255,255,255,0.5)' : 'inherit',
                    textDecoration: isCompleted ? 'line-through' : 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    minWidth: 0
                  }}
                >
                  {isCustomHabit ? habitLabel : itemId}
                </Typography>
              </Box>
              {/* Resumen de configuración centralizado */}
              {config && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2, flexWrap: 'wrap' }}>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {(() => {
                      const tipo = (config?.tipo || 'DIARIO').toUpperCase();
                      const frecuencia = Number(config?.frecuencia || 1);
                      const progresoActual = typeof config?.progresoActual === 'number' ? config.progresoActual : null;
                      // Heurística sin historial: para diario usar estado local; para otros, usar progresoActual si existe
                      const completados = tipo === 'DIARIO'
                        ? (isCompleted ? 1 : 0)
                        : (progresoActual != null ? Math.min(frecuencia, Math.max(0, progresoActual)) : (isCompleted ? 1 : 0));
                      
                      // Construir label sin horarios (para evitar duplicación con el chip)
                      let label = '';
                      switch (tipo) {
                        case 'DIARIO':
                          label = frecuencia === 1 ? 'Diario' : `${frecuencia}x/día`;
                          break;
                        case 'SEMANAL':
                          label = frecuencia === 1 ? 'Semanal' : `${frecuencia}x/sem`;
                          break;
                        case 'MENSUAL':
                          label = frecuencia === 1 ? 'Mensual' : `${frecuencia}x/mes`;
                          break;
                        case 'PERSONALIZADO':
                          const periodo = config?.periodo || 'CADA_DIA';
                          if (periodo === 'CADA_DIA') label = `Cada ${frecuencia}d`;
                          else if (periodo === 'CADA_SEMANA') label = `Cada ${frecuencia}s`;
                          else if (periodo === 'CADA_MES') label = `Cada ${frecuencia}m`;
                          else label = 'Personalizado';
                          break;
                        default:
                          label = 'Diario';
                      }
                      
                      return `${label} • ${completados}/${frecuencia}`;
                    })()}
                  </Typography>
                  {/* Indicador de horarios */}
                  {config?.horarios && Array.isArray(config.horarios) && config.horarios.length > 0 && (
                    <Chip
                      label={getTimeOfDayLabels(config.horarios)}
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: '0.65rem',
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        '& .MuiChip-label': {
                          px: 0.5,
                          py: 0
                        }
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>
          </Box>
          {/* Botones de acción alineados a la derecha */}
          {!readOnly && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              ml: 'auto',
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)'
            }}>
              {isCustomHabit && onEditHabit && (
                <IconButton
                  edge="end"
                  aria-label="edit"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEditHabit) onEditHabit();
                  }}
                  sx={{
                    color: 'rgba(255,255,255,0.3)',
                    borderRadius: 0,
                    width: 24,
                    height: 24,
                    '&:hover': {
                      color: 'primary.main',
                      bgcolor: 'rgba(255,255,255,0.08)'
                    }
                  }}
                >
                  <EditOutlinedIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              )}
              {isCustomHabit && onDeleteHabit && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  '& .MuiIconButton-root': {
                    width: 24,
                    height: 24,
                    borderRadius: 0,
                    padding: 0.25,
                    '& .MuiSvgIcon-root': {
                      fontSize: '1rem'
                    }
                  }
                }}>
                  <SystemButtons
                    actions={[
                      ACTIONS.delete({
                        onClick: handleDeleteClick,
                        itemName: habitLabel || itemId
                      })
                    ]}
                    size="small"
                    gap={0}
                  />
                </Box>
              )}
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
                  width: 24,
                  height: 24,
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: 'rgba(255,255,255,0.08)'
                  }
                }}
              >
                <SettingsOutlinedIcon sx={{ fontSize: '1.2rem' }} />
              </IconButton>
            </Box>
          )}
        </Box>
      </ListItem>
      {/* Setup debajo del ítem - solo para ítems que no son hábitos personalizados */}
      {isSetupOpen && !isCustomHabit && (
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

export default memo(ChecklistItem, (prevProps, nextProps) => {
  // Comparación optimizada - evitar JSON.stringify costoso
  return (
    prevProps.itemId === nextProps.itemId &&
    prevProps.section === nextProps.section &&
    prevProps.isCompleted === nextProps.isCompleted &&
    prevProps.readOnly === nextProps.readOnly &&
    prevProps.isSetupOpen === nextProps.isSetupOpen &&
    prevProps.config?.tipo === nextProps.config?.tipo &&
    prevProps.config?.frecuencia === nextProps.config?.frecuencia &&
    prevProps.config?.activo === nextProps.config?.activo
  );
}); 
