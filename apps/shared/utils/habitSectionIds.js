/** ID helpers for habits — safe for Node/backend (no React/MUI imports). */

/** ID estable para API y rutina (prioriza `id` sobre `_id` de subdocumento). */
export function getHabitId(habit) {
  if (!habit) return null;
  if (habit.id != null && String(habit.id).length > 0) return String(habit.id);
  if (habit._id != null) return String(habit._id);
  return null;
}

/** Compara un hábito con un id recibido (soporta `id` o `_id`). */
export function habitIdsMatch(habit, habitId) {
  if (!habit || habitId == null) return false;
  const needle = String(habitId);
  if (habit.id != null && String(habit.id) === needle) return true;
  if (habit._id != null && String(habit._id) === needle) return true;
  return false;
}

export function findHabitIndexInSection(sectionHabits, habitId) {
  if (!Array.isArray(sectionHabits)) return -1;
  return sectionHabits.findIndex((h) => habitIdsMatch(h, habitId));
}
