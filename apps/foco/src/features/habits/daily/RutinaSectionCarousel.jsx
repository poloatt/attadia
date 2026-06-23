import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { buildHabitSectionIconsMap, getHabitDisplayLabel } from '@shared/utils/habitSectionIcons';
import { getCurrentTimeOfDay } from '@shared/utils/timeOfDayUtils';
import { resolveRutinaItemConfig } from '@shared/utils/habitVisibilityEngine';
import { getSectionCarouselItems } from '@shared/utils/rutinaDesktopUtils';
import HabitCarouselIconButton from '@foco/features/habits/carousel/HabitCarouselIconButton';
import { getHabitCarouselSurface } from '@foco/features/habits/carousel/habitCarouselSurface';

/**
 * Fila de carrusel horizontal con todos los hábitos de una sección (estilo hub Foco).
 */
export default function RutinaSectionCarousel({
  section,
  rutina,
  habits,
  habitsPreferences = {},
  onToggle,
  interactive = true,
  dense = true,
}) {
  const theme = useTheme();
  const { size, bg, hoverBg, rail, dividerColor } = getHabitCarouselSurface(theme, { dense });
  const currentTimeOfDay = getCurrentTimeOfDay();
  const sectionIconsMap = useMemo(() => buildHabitSectionIconsMap(habits), [habits]);

  const carouselItems = useMemo(
    () => getSectionCarouselItems({ section, rutina, habits, habitsPreferences }),
    [section, rutina, habits, habitsPreferences],
  );

  if (!carouselItems.length) return null;

  return (
    <Box
      role="region"
      aria-label="Hábitos de la sección"
      sx={{
        display: 'flex',
        flexWrap: 'nowrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: dense ? 0.25 : 0.5,
        py: 0.5,
        mb: 0.5,
        overflowX: 'auto',
        overflowY: 'hidden',
        touchAction: 'pan-x',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        borderBottom: '1px solid',
        borderColor: dividerColor,
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {carouselItems.map(({ itemId, label, Icon, isCadenciaDebt }) => {
        if (!Icon) return null;
        const displayLabel = label || getHabitDisplayLabel(section, itemId, habits);
        const itemConfig = resolveRutinaItemConfig(section, itemId, rutina, habitsPreferences);
        const itemValue = rutina?.[section]?.[itemId];

        return (
          <Box key={itemId} sx={{ display: 'inline-flex', flex: '0 0 auto' }}>
            <HabitCarouselIconButton
              section={section}
              itemId={itemId}
              Icon={Icon}
              label={displayLabel}
              itemConfig={itemConfig}
              itemValue={itemValue}
              currentTimeOfDay={currentTimeOfDay}
              rutinaHoy={rutina}
              mode="ahora"
              isCadenciaDebt={Boolean(isCadenciaDebt)}
              dense={dense}
              interactive={interactive}
              showCompletionState
              bg={bg}
              hoverBg={hoverBg}
              rail={rail}
              size={size}
              onToggle={onToggle}
            />
          </Box>
        );
      })}
    </Box>
  );
}
