import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { useHabits, useRutinas } from '@shared/context';
import { getCurrentTimeOfDay } from '@shared/utils/timeOfDayUtils';
import { getDefaultSelectedSection } from '@shared/utils/rutinaDesktopUtils';
import { resolveRutinaItemConfig } from '@shared/utils/habitVisibilityEngine';
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
  onConfigChange,
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
    const currentValue = prevSection[itemId];
    const itemConfig = resolveRutinaItemConfig(section, itemId, rutina, prefs);
    const horariosConfig = Array.isArray(itemConfig.horarios) ? itemConfig.horarios : [];

    let newValue;
    if (horario && horariosConfig.length > 1) {
      const normalized = String(horario).toUpperCase();
      const base = typeof currentValue === 'object' && currentValue !== null
        ? { ...currentValue }
        : {};
      base[normalized] = !base[normalized];
      newValue = base;
    } else if (typeof currentValue === 'object' && currentValue !== null) {
      const allDone = Object.values(currentValue).every(Boolean);
      newValue = !allDone;
    } else {
      newValue = !(currentValue === true);
    }

    const newData = { ...prevSection, [itemId]: newValue };
    onMarkComplete(rutina._id, section, newData);
  }, [readOnly, rutina, selectedSection, onMarkComplete, prefs]);

  const handleSectionConfigChange = useCallback((itemId, newConfig, meta) => {
    onConfigChange(selectedSection, itemId, newConfig, meta);
  }, [onConfigChange, selectedSection]);

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
        onConfigChange={handleSectionConfigChange}
        onToggle={handleToggle}
      />
    </Box>
  );
}
