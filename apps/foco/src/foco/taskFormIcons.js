import {
  AddOutlined,
  CheckCircleOutlined,
  Close,
  EventAvailableOutlined,
  EventNoteOutlined,
  Label,
  NotesOutlined,
  PriorityHigh,
  TimerOutlined,
  TrackChangesOutlined,
} from '@mui/icons-material';
import { getIconByKey } from '@shared/navigation/menuIcons';

/** Iconos centralizados para formularios de tarea (alineados con menuIcons). */
export const TaskFormIcons = {
  schedule: getIconByKey('calendarToday'),
  calendar: getIconByKey('calendarToday'),
  duration: TimerOutlined,
  deadline: EventAvailableOutlined,
  description: NotesOutlined,
  notes: NotesOutlined,
  proyecto: getIconByKey('objetivo'),
  objetivo: getIconByKey('objetivo'),
  subtarea: getIconByKey('task'),
  estado: Label,
  prioridad: PriorityHigh,
  habit: EventNoteOutlined,
  recurrence: TrackChangesOutlined,
  add: AddOutlined,
  close: Close,
  completed: CheckCircleOutlined,
  folder: getIconByKey('folder'),
};
