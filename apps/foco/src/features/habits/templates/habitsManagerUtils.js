import { HABIT_SECTIONS, DEFAULT_HABIT_CONFIG } from './habitFormDefaults';
import { normalizeTimeOfDay } from '@shared/utils/timeOfDayUtils';

export const SECTIONS = HABIT_SECTIONS;

export function getDefaultHabitConfig(habit = {}) {
  return {
    ...DEFAULT_HABIT_CONFIG,
    activo: habit.activo !== undefined ? habit.activo : true,
    horarios: [],
  };
}

export function getHabitConfig(habitsConfig, section, habitId, habit = {}) {
  return habitsConfig?.[section]?.[habitId] || getDefaultHabitConfig(habit);
}

export function normalizeManagerConfig(newConfig) {
  return {
    tipo: (newConfig.tipo || 'DIARIO').toUpperCase(),
    frecuencia: Number(newConfig.frecuencia || 1),
    activo: newConfig.activo !== undefined ? Boolean(newConfig.activo) : true,
    periodo: newConfig.periodo || 'CADA_DIA',
    diasSemana: Array.isArray(newConfig.diasSemana) ? [...newConfig.diasSemana] : [],
    diasMes: Array.isArray(newConfig.diasMes) ? [...newConfig.diasMes] : [],
    horarios: normalizeTimeOfDay(newConfig.horarios),
    esPreferenciaUsuario: true,
    ultimaActualizacion: new Date().toISOString(),
  };
}
