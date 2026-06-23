import React, { memo, useMemo } from 'react';
import { ListItem, Box, IconButton, Typography } from '@mui/material';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import InlineItemConfigImproved from '../templates/InlineItemConfigImproved';
import { getCurrentTimeOfDay } from '@shared/utils/timeOfDayUtils';
import { HabitCounterBadge } from '@shared/components/common/HabitCounterBadge';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import NightlightIcon from '@mui/icons-material/Nightlight';
import { SystemButtons } from '@shared/components/common/SystemButtons';
import { ACTIONS } from '@shared/components/common/CommonActions';
import { useRutinas } from '@shared/context';
import { contarCompletadosEnPeriodo, obtenerHistorialCompletados } from '@shared/utils/cadenciaUtils';
import {
  getRutinaHabitIconButtonSx,
  rutinaChecklistItemSx,
  rutinaChecklistRowSx,
  rutinaChecklistContentSx,
  rutinaChecklistTextColumnSx,
  rutinaChecklistLabelSx,
  rutinaChecklistMetaSx,
  rutinaHorariosRowSx,
  rutinaHorarioIconButtonSx,
  rutinaHorarioIconSx,
  rutinaRowActionsSx,
  rutinaRowActionIconSx,
  rutinaSystemButtonsSx,
  rutinaInlineConfigSx,
} from '@shared/styles/rutinaPageStyles';

// Botón de hábito modularizado para uso en RutinaCard y otros
export const HabitIconButton = ({ 
  isCompleted, 
  Icon, 
  onClick, 
  readOnly, 
  size = 38, 
  iconSize = 'small', 
  mr = 1,
  config = {},
  currentTimeOfDay,
  overlap = 'subtle', // Por defecto 'subtle' para superposición sutil en vista expandida
  rutina = null,
  section = null,
  itemId = null,
  ...props 
}) => {
  const timeOfDay = currentTimeOfDay || getCurrentTimeOfDay();
  
  return (
    <HabitCounterBadge
      config={config}
      currentTimeOfDay={timeOfDay}
      size={size <= 32 ? 'small' : 'medium'}
      overlap={overlap}
      rutina={rutina}
      section={section}
      itemId={itemId}
    >
  <IconButton
    size="small"
    onClick={onClick}
    disabled={readOnly}
    sx={getRutinaHabitIconButtonSx({ isCompleted, size, mr })}
    {...props}
  >
    {Icon && <Icon fontSize={iconSize} />}
  </IconButton>
    </HabitCounterBadge>
);
};

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
  localData = null, // Prop opcional para acceso a estado local optimista
}) => {
  const { rutina } = useRutinas();
  
  // Función helper para verificar si un horario específico está completado
  // Prioriza localData (estado local) sobre rutina (estado del servidor) para respuesta inmediata
  const isHorarioCompleted = (horario) => {
    // Priorizar localData si está disponible (para actualizaciones optimistas)
    const itemValue = localData?.[itemId] !== undefined ? localData[itemId] : (rutina?.[section]?.[itemId]);
    if (!itemValue) return false;
    
    const isObjectFormat = typeof itemValue === 'object' && itemValue !== null && !Array.isArray(itemValue);
    if (isObjectFormat) {
      const normalizedHorario = String(horario).toUpperCase();
      return itemValue[normalizedHorario] === true;
    }
    
    // Formato legacy: si está completado, todos los horarios están completados
    return itemValue === true;
  };
  
  const handleDeleteClick = async (e) => {
    e.stopPropagation();
    if (onDeleteHabit) {
      await onDeleteHabit();
    }
  };
  
  // Calcular el texto secundario con los completados del período actual
  const secondaryText = useMemo(() => {
    if (!config) return '';
    
    const tipo = (config?.tipo || 'DIARIO').toUpperCase();
    const frecuencia = Number(config?.frecuencia || 1);
    const periodo = config?.periodo ? config.periodo.toUpperCase() : 'CADA_DIA';
    
    // Calcular completados usando las funciones centralizadas
    let completados = 0;
    
    if (tipo === 'DIARIO') {
      // Para diario, verificar si tiene múltiples horarios configurados
      const horariosConfig = Array.isArray(config.horarios) ? config.horarios : [];
      const itemValue = rutina?.[section]?.[itemId];
      const isObjectFormat = typeof itemValue === 'object' && itemValue !== null && !Array.isArray(itemValue);
      
      if (horariosConfig.length > 1 && isObjectFormat) {
        // Si tiene múltiples horarios y está en formato objeto, contar horarios completados
        const horariosCompletados = Object.values(itemValue).filter(Boolean).length;
        completados = horariosCompletados;
      } else {
        // Formato legacy o un solo horario: usar lógica simple
        completados = isCompleted ? 1 : 0;
      }
    } else if (tipo === 'SEMANAL' || tipo === 'MENSUAL' || 
               (tipo === 'PERSONALIZADO' && periodo !== 'CADA_DIA')) {
      // Para hábitos periódicos, usar el historial real
      if (rutina) {
        const historial = obtenerHistorialCompletados(itemId, section, rutina);
        const hoy = new Date();
        completados = contarCompletadosEnPeriodo(hoy, tipo, periodo, historial);
        
        // Agregar hoy si está completado y no está en el historial
        if (isCompleted) {
          const hoyStr = hoy.toISOString().split('T')[0];
          const yaEstaEnHistorial = historial.some(fecha => {
            const fechaStr = fecha.toISOString().split('T')[0];
            return fechaStr === hoyStr;
          });
          
          if (!yaEstaEnHistorial) {
            completados++;
          }
        }
      } else {
        // Si no hay rutina, usar estado local como fallback
        completados = isCompleted ? 1 : 0;
      }
    } else {
      // Para otros tipos, usar estado local
      completados = isCompleted ? 1 : 0;
    }
    
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
        if (periodo === 'CADA_DIA') label = `Cada ${frecuencia}d`;
        else if (periodo === 'CADA_SEMANA') label = `Cada ${frecuencia}s`;
        else if (periodo === 'CADA_MES') label = `Cada ${frecuencia}m`;
        else label = 'Personalizado';
        break;
      default:
        label = 'Diario';
    }
    
    return `${label} • ${completados}/${frecuencia}`;
  }, [config, isCompleted, rutina, section, itemId]);

  return (
    <>
      <ListItem disablePadding sx={rutinaChecklistItemSx}>
        <Box sx={rutinaChecklistRowSx}>
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
              config={config}
              currentTimeOfDay={getCurrentTimeOfDay()}
              rutina={rutina}
              section={section}
              itemId={itemId}
            />
          )}
          {/* Contenido principal */}
          <Box sx={rutinaChecklistContentSx}>
            <Box sx={rutinaChecklistTextColumnSx}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={rutinaChecklistLabelSx(isCompleted)}>
                  {habitLabel || itemId}
                </Typography>
              </Box>
              {/* Resumen de configuración centralizado */}
              {config && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={rutinaChecklistMetaSx}>
                    {secondaryText}
                  </Typography>
                  {config?.horarios && Array.isArray(config.horarios) && config.horarios.length > 0 && (
                    <Box sx={rutinaHorariosRowSx}>
                      {config.horarios.map((horario, index) => {
                        const normalizedHorario = String(horario).toUpperCase();
                        let IconComponent = null;
                        
                        switch (normalizedHorario) {
                          case 'MAÑANA':
                            IconComponent = WbSunnyIcon;
                            break;
                          case 'TARDE':
                            IconComponent = WbTwilightIcon;
                            break;
                          case 'NOCHE':
                            IconComponent = NightlightIcon;
                            break;
                          default:
                            return null;
                        }
                        
                        if (!IconComponent) return null;
                        
                        const horarioCompleted = isHorarioCompleted(horario);
                        
                        return (
                          <IconButton
                            key={`${horario}-${index}`}
                            size="small"
                            disabled={readOnly}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onItemClick) {
                                onItemClick(itemId, e, normalizedHorario);
                              }
                            }}
                            sx={rutinaHorarioIconButtonSx(horarioCompleted)}
                          >
                            <IconComponent sx={rutinaHorarioIconSx} />
                          </IconButton>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>
          {/* Botones de acción alineados a la derecha */}
          {!readOnly && (
            <Box sx={rutinaRowActionsSx}>
              {isCustomHabit && onEditHabit && (
                <IconButton
                  edge="end"
                  aria-label="edit"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEditHabit) onEditHabit();
                  }}
                  sx={rutinaRowActionIconSx(false)}
                >
                  <EditOutlinedIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              )}
              {isCustomHabit && onDeleteHabit && (
                <Box sx={rutinaSystemButtonsSx}>
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
                sx={rutinaRowActionIconSx(isSetupOpen)}
              >
                <SettingsOutlinedIcon sx={{ fontSize: '1.2rem' }} />
              </IconButton>
            </Box>
          )}
        </Box>
      </ListItem>
      {/* Setup debajo del ítem - solo para ítems que no son hábitos personalizados */}
      {isSetupOpen && !isCustomHabit && (
        <Box sx={rutinaInlineConfigSx}>
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
