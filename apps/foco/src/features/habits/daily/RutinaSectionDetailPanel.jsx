import React, { useState, useMemo, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import RutinaSectionCarousel from './RutinaSectionCarousel';
import RutinaDayGroupList from './RutinaDayGroupList';
import HabitFormDialog from '@shared/components/HabitFormDialog';
import { useHabits } from '@shared/context';
import { groupSectionHabitsByDaySchedule } from '@shared/utils/rutinaDesktopUtils';

export default function RutinaSectionDetailPanel({
  section,
  rutina,
  habits,
  habitsPreferences = {},
  readOnly = false,
  onItemClick,
  onToggle,
}) {
  const { deleteHabit, fetchHabits } = useHabits();
  const [editingHabitDialog, setEditingHabitDialog] = useState({
    open: false,
    habit: null,
    section: null,
  });

  const { today, notToday } = useMemo(
    () => groupSectionHabitsByDaySchedule({
      section,
      rutina,
      habits,
      habitsPreferences,
    }),
    [section, rutina, habits, habitsPreferences],
  );

  const handleEditHabit = useCallback((habit, habitSection) => {
    setEditingHabitDialog({ open: true, habit, section: habitSection });
  }, []);

  const handleDeleteHabit = useCallback(async (habitId, habitSection) => {
    try {
      await deleteHabit(habitId, habitSection);
      await fetchHabits();
    } catch (error) {
      console.error('[RutinaSectionDetailPanel] Error al eliminar hábito:', error);
    }
  }, [deleteHabit, fetchHabits]);

  const hasAny = today.length > 0 || notToday.length > 0;

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
    <>
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
        <RutinaDayGroupList
          today={today}
          notToday={notToday}
          section={section}
          rutina={rutina}
          readOnly={readOnly}
          onItemClick={onItemClick}
          onEditHabit={handleEditHabit}
          onDeleteHabit={handleDeleteHabit}
        />
      </Box>

      <HabitFormDialog
        open={editingHabitDialog.open}
        onClose={() => setEditingHabitDialog({ open: false, habit: null, section: null })}
        editingHabit={editingHabitDialog.habit}
        editingSection={editingHabitDialog.section}
      />
    </>
  );
}
