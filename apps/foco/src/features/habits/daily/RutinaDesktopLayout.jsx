import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { useHabits, useRutinas } from '@shared/context';
import { getCurrentTimeOfDay } from '@shared/utils/timeOfDayUtils';
import { getDefaultSelectedSection } from '@shared/utils/rutinaDesktopUtils';
import { computeRutinaToggleValue } from '@shared/domain/habits';
import useHabitCarouselToggle from '@foco/features/habits/carousel/useHabitCarouselToggle';
import useHabitsPreferences from '@foco/features/habits/carousel/hooks/useHabitsPreferences';
import RutinaSectionNav from './RutinaSectionNav';
import RutinaSectionDetailPanel from './RutinaSectionDetailPanel';

/**
 * Layout master-detail para rutinas en desktop (md+).
 */
export default function RutinaDesktopLayout({
  rutina,
  readOnly = false,
  onMarkComplete,
}) {
  const { habits } = useHabits();
  const { habitsPreferences, prefsReady } = useHabitsPreferences();
  const { markItemComplete, patchRutinaSection } = useRutinas();
  const dragRef = useRef({ moved: false });
  const prefs = prefsReady ? (habitsPreferences || {}) : {};
  const [selectedSection, setSelectedSection] = useState(() =>
    getDefaultSelectedSection(rutina, habits, prefs),
  );

  useEffect(() => {
    if (!prefsReady) return;
    setSelectedSection(getDefaultSelectedSection(rutina, habits, prefs));
  }, [rutina?._id, habits, prefsReady, habitsPreferences]);

  const handleToggle = useHabitCarouselToggle({
    mode: 'ahora',
    interactive: !readOnly,
    dragRef,
    rutinaHoy: rutina,
    markItemComplete,
    patchRutinaSection,
    currentTimeOfDay: getCurrentTimeOfDay(),
    habitsPreferences: prefs,
  });

  const handleItemClick = useCallback((itemId, _event, horario = null) => {
    if (readOnly || !rutina?._id) return;

    const section = selectedSection;
    const prevSection = rutina[section] || {};
    const previousValue = prevSection[itemId];
    const newValue = computeRutinaToggleValue({
      section,
      itemId,
      rutina,
      habitsPreferences: prefs,
      horario,
      currentTimeOfDay: getCurrentTimeOfDay(),
    });

    const itemData = { [itemId]: newValue };
    if (patchRutinaSection) {
      patchRutinaSection(rutina._id, section, itemData);
    }

    const persist = onMarkComplete(rutina._id, section, itemData);
    if (persist?.catch) {
      persist.catch(() => {
        if (patchRutinaSection) {
          patchRutinaSection(rutina._id, section, { [itemId]: previousValue });
        }
      });
    }
  }, [readOnly, rutina, selectedSection, onMarkComplete, patchRutinaSection, prefs]);

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        width: '100%',
        minHeight: 0,
        alignItems: 'flex-start',
      }}
    >
      <RutinaSectionNav
        rutina={rutina}
        habits={habits}
        habitsPreferences={prefs}
        selectedSection={selectedSection}
        onSelectSection={setSelectedSection}
      />
      <RutinaSectionDetailPanel
        section={selectedSection}
        rutina={rutina}
        habits={habits}
        habitsPreferences={prefs}
        readOnly={readOnly}
        onItemClick={handleItemClick}
        onToggle={handleToggle}
      />
    </Box>
  );
}
