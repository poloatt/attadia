export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 23;
export const SLOT_HEIGHT_PX = 48;
export const DEFAULT_DURATION_MINUTES = 60;
export const ALL_DAY_ROW_MIN_HEIGHT = 36;
/** Máximo de chips “todo el día” visibles antes de “+N más” (estilo Google Calendar). */
export const ALL_DAY_MAX_VISIBLE = 2;
export const TIME_COLUMN_WIDTH = 52;

/** Fixed chrome heights so day ↔ week toggles do not shift the time grid. */
export const DATE_HEADER_MIN_HEIGHT = 80;
export const CONTEXT_BAR_MIN_HEIGHT = 52;

export const calendarGridColumns = (dayCount = 7) =>
  `${TIME_COLUMN_WIDTH}px repeat(${dayCount}, 1fr)`;

export const calendarContextBarSx = {
  flexShrink: 0,
  borderBottom: 1,
  borderColor: 'divider',
  bgcolor: 'background.default',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: CONTEXT_BAR_MIN_HEIGHT,
  boxSizing: 'border-box',
  px: { xs: 0.5, sm: 1 },
  py: 0.5,
};

export const calendarScrollAreaSx = {
  flex: 1,
  overflowY: 'auto',
  minHeight: 0,
  '&::-webkit-scrollbar': { width: 6 },
  '&::-webkit-scrollbar-thumb': {
    bgcolor: 'action.disabled',
    borderRadius: 3,
  },
};

export const HOUR_LABELS = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
  (_, i) => DAY_START_HOUR + i,
);

export const getGridHeightPx = () => (DAY_END_HOUR - DAY_START_HOUR) * SLOT_HEIGHT_PX;
