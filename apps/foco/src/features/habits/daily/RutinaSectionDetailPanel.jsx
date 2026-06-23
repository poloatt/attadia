import React, { useState, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import ChecklistItem from './ChecklistItem';
import RutinaSectionCarousel from './RutinaSectionCarousel';
import { categorizeSectionHabits } from '@shared/utils/rutinaDesktopUtils';
import { isHabitCompletedForHistorial } from '@shared/utils/habitCompletionUtils';

const SECTION_HEADING_SX = {
  px: 0.5,
  py: 0.75,
  fontWeight: 600,
  color: 'text.secondary',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  fontSize: '0.7rem',
};

function HabitRows({
  items,
  section,
  rutina,
  readOnly,
  onItemClick,
  onConfigChange,
  openSetupItemId,
  onSetupToggle,
}) {
  if (!items.length) return null;

  return items.map((entry) => {
    const { itemId, Icon, label, config, userHabit } = entry;
    const itemValue = rutina?.[section]?.[itemId];
    const isCompleted = isHabitCompletedForHistorial(itemValue);

    return (
      <ChecklistItem
        key={itemId}
        itemId={itemId}
        section={section}
        Icon={Icon}
        isCompleted={isCompleted}
        readOnly={readOnly}
        onItemClick={onItemClick}
        config={config}
        onConfigChange={(newConfig, meta) => onConfigChange(itemId, newConfig, meta)}
        isSetupOpen={openSetupItemId === itemId}
        onSetupToggle={() => onSetupToggle(itemId)}
        habitLabel={label}
        isCustomHabit={Boolean(userHabit)}
      />
    );
  });
}

export default function RutinaSectionDetailPanel({
  section,
  rutina,
  habits,
  habitsPreferences = {},
  readOnly = false,
  onItemClick,
  onConfigChange,
  onToggle,
}) {
  const [openSetupItemId, setOpenSetupItemId] = useState(null);

  const { completed, incomplete, notScheduled } = useMemo(
    () => categorizeSectionHabits({ section, rutina, habits, habitsPreferences }),
    [section, rutina, habits, habitsPreferences],
  );

  const overdue = useMemo(
    () => incomplete.filter((entry) => entry.isCadenciaDebt),
    [incomplete],
  );
  const pendingToday = useMemo(
    () => incomplete.filter((entry) => !entry.isCadenciaDebt),
    [incomplete],
  );

  const handleSetupToggle = (itemId) => {
    setOpenSetupItemId((prev) => (prev === itemId ? null : itemId));
  };

  const blocks = [
    { key: 'completed', title: 'Completados', items: completed },
    { key: 'overdue', title: 'Atrasados', items: overdue },
    { key: 'incomplete', title: 'Pendientes', items: pendingToday },
    { key: 'notScheduled', title: 'No programados hoy', items: notScheduled },
  ];

  const hasAny = blocks.some((b) => b.items.length > 0);

  if (!hasAny) {
    return (
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <RutinaSectionCarousel
          section={section}
          rutina={rutina}
          habits={habits}
          habitsPreferences={habitsPreferences}
          onToggle={onToggle}
          interactive={!readOnly}
        />
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No hay hábitos en esta sección
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      role="region"
      aria-label="Detalle de hábitos"
      sx={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <RutinaSectionCarousel
        section={section}
        rutina={rutina}
        habits={habits}
        habitsPreferences={habitsPreferences}
        onToggle={onToggle}
        interactive={!readOnly}
      />
      {blocks.map(({ key, title, items }) => {
        if (!items.length) return null;
        return (
          <Box key={key}>
            <Typography variant="caption" sx={SECTION_HEADING_SX}>
              {title}
            </Typography>
            <HabitRows
              items={items}
              section={section}
              rutina={rutina}
              readOnly={readOnly}
              onItemClick={onItemClick}
              onConfigChange={onConfigChange}
              openSetupItemId={openSetupItemId}
              onSetupToggle={handleSetupToggle}
            />
          </Box>
        );
      })}
    </Box>
  );
}
