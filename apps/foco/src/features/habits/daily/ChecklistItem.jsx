import React, { memo, useMemo, useCallback } from 'react';
import { ListItem, Box, Typography } from '@mui/material';
import { getCurrentTimeOfDay } from '@shared/utils/timeOfDayUtils';
import { HabitCounterBadge, HabitCrudActions } from '@shared/components/common';
import { useRutinas } from '@shared/context';
import { isHabitHorarioCompleted } from '@shared/utils/habitCompletionUtils';
import { contarCompletadosEnPeriodo, obtenerHistorialCompletados } from '@shared/utils/cadenciaUtils';
import {
  getRutinaHabitIconButtonSx,
  rutinaChecklistItemSx,
  rutinaChecklistRowSx,
  rutinaChecklistContentSx,
  rutinaChecklistTextColumnSx,
  rutinaChecklistLabelSx,
  rutinaChecklistMetaSx,
  rutinaRowActionsSx,
  rutinaSystemButtonsSx,
} from '@shared/styles/rutinaPageStyles';
import { IconButton } from '@mui/material';

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
  displayHorario = null,
  overlap = 'subtle',
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
      displayHorario={displayHorario}
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
  isCustomHabit = false,
  habitLabel = '',
  onEditHabit,
  onDeleteHabit,
  localData = null,
  completionValue = undefined,
}) => {
  const { rutina } = useRutinas();

  const isHorarioCompleted = (horario) => {
    const itemValue = localData?.[itemId] !== undefined
      ? localData[itemId]
      : (completionValue !== undefined ? completionValue : rutina?.[section]?.[itemId]);
    return isHabitHorarioCompleted(itemValue, horario);
  };

  const handleDeleteClick = useCallback(async () => {
    if (onDeleteHabit) {
      await onDeleteHabit();
    }
  }, [onDeleteHabit]);

  const habitCrudItemName = habitLabel || itemId;

  const secondaryText = useMemo(() => {
    if (!config) return '';

    const tipo = (config?.tipo || 'DIARIO').toUpperCase();
    const frecuencia = Number(config?.frecuencia || 1);
    const periodo = config?.periodo ? config.periodo.toUpperCase() : 'CADA_DIA';

    let completados = 0;

    if (tipo === 'DIARIO') {
      const horariosConfig = Array.isArray(config.horarios) ? config.horarios : [];
      if (horariosConfig.length > 0) {
        return frecuencia === 1 ? 'Diario' : `${frecuencia}x/día`;
      }

      const itemValue = rutina?.[section]?.[itemId];
      const isObjectFormat = typeof itemValue === 'object' && itemValue !== null && !Array.isArray(itemValue);

      if (horariosConfig.length > 1 && isObjectFormat) {
        completados = Object.values(itemValue).filter(Boolean).length;
      } else {
        completados = isCompleted ? 1 : 0;
      }
    } else if (tipo === 'SEMANAL' || tipo === 'MENSUAL' ||
               (tipo === 'PERSONALIZADO' && periodo !== 'CADA_DIA')) {
      if (rutina) {
        const historial = obtenerHistorialCompletados(itemId, section, rutina);
        const hoy = new Date();
        completados = contarCompletadosEnPeriodo(hoy, tipo, periodo, historial);

        if (isCompleted) {
          const hoyStr = hoy.toISOString().split('T')[0];
          const yaEstaEnHistorial = historial.some((fecha) => {
            const fechaStr = fecha.toISOString().split('T')[0];
            return fechaStr === hoyStr;
          });

          if (!yaEstaEnHistorial) {
            completados++;
          }
        }
      } else {
        completados = isCompleted ? 1 : 0;
      }
    } else {
      completados = isCompleted ? 1 : 0;
    }

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

    const horariosConfig = Array.isArray(config?.horarios) ? config.horarios : [];
    if (tipo === 'DIARIO' && horariosConfig.length > 0) {
      return label;
    }

    return `${label} • ${completados}/${frecuencia}`;
  }, [config, isCompleted, rutina, section, itemId]);

  const horariosConfig = Array.isArray(config?.horarios) ? config.horarios : [];
  const hasMultipleFranjas = horariosConfig.length > 1;
  const singleDisplayHorario = horariosConfig.length === 1
    ? String(horariosConfig[0]).toUpperCase()
    : null;

  const renderHabitActionButtons = () => {
    if (readOnly) return null;

    if (hasMultipleFranjas) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.35,
            flexShrink: 0,
            mr: 0.75,
          }}
        >
          {horariosConfig.map((horario) => {
            const normalizedHorario = String(horario).toUpperCase();
            const franjaCompleted = isHorarioCompleted(normalizedHorario);
            return (
              <HabitIconButton
                key={normalizedHorario}
                isCompleted={franjaCompleted}
                Icon={Icon}
                onClick={(e) => {
                  e.stopPropagation();
                  onItemClick(itemId, e, normalizedHorario);
                }}
                readOnly={readOnly}
                config={config}
                currentTimeOfDay={getCurrentTimeOfDay()}
                displayHorario={normalizedHorario}
                rutina={rutina}
                section={section}
                itemId={itemId}
                size={36}
                mr={0}
              />
            );
          })}
        </Box>
      );
    }

    return (
      <HabitIconButton
        isCompleted={isCompleted}
        Icon={Icon}
        onClick={(e) => {
          e.stopPropagation();
          onItemClick(itemId, e, singleDisplayHorario);
        }}
        readOnly={readOnly}
        config={config}
        currentTimeOfDay={getCurrentTimeOfDay()}
        displayHorario={singleDisplayHorario}
        rutina={rutina}
        section={section}
        itemId={itemId}
      />
    );
  };

  return (
    <ListItem disablePadding sx={rutinaChecklistItemSx}>
      <Box sx={rutinaChecklistRowSx}>
        {renderHabitActionButtons()}
        <Box sx={rutinaChecklistContentSx}>
          <Box sx={rutinaChecklistTextColumnSx}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={rutinaChecklistLabelSx(isCompleted)}>
                {habitLabel || itemId}
              </Typography>
            </Box>
            {config && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2, flexWrap: 'wrap' }}>
                <Typography variant="caption" sx={rutinaChecklistMetaSx}>
                  {secondaryText}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        {!readOnly && isCustomHabit && (onEditHabit || onDeleteHabit) && (
          <Box sx={rutinaRowActionsSx}>
            <HabitCrudActions
              onEdit={onEditHabit}
              onDelete={handleDeleteClick}
              itemName={habitCrudItemName}
              showEdit={Boolean(onEditHabit)}
              showDelete={Boolean(onDeleteHabit)}
              size="small"
              gap={0}
              sx={rutinaSystemButtonsSx}
            />
          </Box>
        )}
      </Box>
    </ListItem>
  );
};

export default memo(ChecklistItem, (prevProps, nextProps) => {
  const prevHorarios = JSON.stringify(prevProps.config?.horarios || []);
  const nextHorarios = JSON.stringify(nextProps.config?.horarios || []);
  const prevCompletion = JSON.stringify(
    prevProps.localData?.[prevProps.itemId] ?? prevProps.completionValue ?? null,
  );
  const nextCompletion = JSON.stringify(
    nextProps.localData?.[nextProps.itemId] ?? nextProps.completionValue ?? null,
  );

  return (
    prevProps.itemId === nextProps.itemId &&
    prevProps.section === nextProps.section &&
    prevProps.isCompleted === nextProps.isCompleted &&
    prevProps.readOnly === nextProps.readOnly &&
    prevProps.isCustomHabit === nextProps.isCustomHabit &&
    prevProps.config?.tipo === nextProps.config?.tipo &&
    prevProps.config?.frecuencia === nextProps.config?.frecuencia &&
    prevProps.config?.activo === nextProps.config?.activo &&
    prevHorarios === nextHorarios &&
    prevCompletion === nextCompletion
  );
});
