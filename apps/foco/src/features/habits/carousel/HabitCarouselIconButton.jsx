import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { HabitCounterBadge } from '@shared/components/common/HabitCounterBadge';
import { getHorarioForCarousel } from '@shared/utils/habitTimeLogic';

/**
 * Botón circular de hábito reutilizado en carrusel y panel desktop de rutinas.
 */
export default function HabitCarouselIconButton({
  section,
  itemId,
  Icon,
  label,
  itemConfig,
  itemValue,
  currentTimeOfDay,
  rutinaHoy,
  mode = 'ahora',
  displayHorario = null,
  dense,
  interactive,
  showCompletionState,
  bg,
  hoverBg,
  rail,
  size,
  onToggle,
}) {
  const horariosConfig = Array.isArray(itemConfig?.horarios) ? itemConfig.horarios : [];
  const completadoHoy = itemValue !== undefined ? itemValue : false;

  const horarioToShow = displayHorario || getHorarioForCarousel(
    mode,
    horariosConfig,
    currentTimeOfDay,
    completadoHoy,
  );

  const isObjectFormat = typeof itemValue === 'object' && itemValue !== null && !Array.isArray(itemValue);
  const isBooleanFormat = typeof itemValue === 'boolean';
  const hasMultipleHorarios = horariosConfig.length > 1;

  let isCompleted = false;
  if (showCompletionState) {
    if (hasMultipleHorarios && isObjectFormat && horarioToShow) {
      isCompleted = itemValue[horarioToShow] === true;
    } else if (hasMultipleHorarios && isObjectFormat) {
      isCompleted = Object.values(itemValue).some(Boolean);
    } else if (isObjectFormat) {
      isCompleted = Object.values(itemValue).some(Boolean);
    } else if (isBooleanFormat) {
      isCompleted = itemValue === true;
    }
  }

  const statusLabel = isCompleted ? 'completado' : 'pendiente';

  return (
    <Tooltip title={label} arrow placement="top">
      <span style={{ display: 'inline-flex' }}>
        <HabitCounterBadge
          config={itemConfig}
          currentTimeOfDay={currentTimeOfDay}
          displayHorario={horarioToShow}
          size={dense ? 'small' : 'medium'}
          rutina={rutinaHoy}
          section={section}
          itemId={itemId}
        >
          <IconButton
            size="small"
            disabled={!interactive}
            aria-label={`${label}, ${statusLabel}`}
            aria-pressed={isCompleted}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(section, itemId);
            }}
            sx={{
              width: size,
              height: size,
              minWidth: size,
              minHeight: size,
              p: 0,
              borderRadius: '50%',
              bgcolor: isCompleted ? 'action.selected' : bg,
              color: isCompleted ? 'primary.main' : 'text.secondary',
              border: '1px solid',
              borderColor: isCompleted ? 'primary.main' : rail,
              flex: '0 0 auto',
              touchAction: 'pan-x',
              transition: showCompletionState ? 'all 0.2s ease' : undefined,
              '&:hover': {
                bgcolor: isCompleted ? 'action.selected' : hoverBg,
                color: isCompleted ? 'primary.main' : 'text.primary',
              },
            }}
          >
            <Icon sx={{ fontSize: dense ? '1.1rem' : '1.2rem' }} />
          </IconButton>
        </HabitCounterBadge>
      </span>
    </Tooltip>
  );
}
