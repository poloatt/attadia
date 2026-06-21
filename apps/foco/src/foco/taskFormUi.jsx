import React from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  KeyboardArrowDown as ChevronDownIcon,
} from '@mui/icons-material';

/** Shared Google Calendar / Tasks–inspired form tokens (dark theme). */

/**
 * Typography scale (single source of truth).
 * Hierarchy: title > body > pill ≈ switch label > caption.
 * Minimal size jumps — Google Calendar style.
 */
export const TASK_FORM_TITLE_FONT_SIZE = '1.375rem';
export const TASK_FORM_TITLE_LINE_HEIGHT = 1.35;
export const TASK_FORM_TITLE_FONT_WEIGHT = 400;

export const TASK_FORM_BODY_FONT_SIZE = '0.875rem';
export const TASK_FORM_BODY_LINE_HEIGHT = 1.45;

export const TASK_FORM_PILL_FONT_SIZE = '0.8125rem';
export const TASK_FORM_PILL_LINE_HEIGHT = 1.35;
export const TASK_FORM_PILL_FONT_WEIGHT = 400;

export const TASK_FORM_CAPTION_FONT_SIZE = '0.75rem';
export const TASK_FORM_CAPTION_LINE_HEIGHT = 1.35;

export const TASK_FORM_BUTTON_FONT_SIZE = TASK_FORM_BODY_FONT_SIZE;
export const TASK_FORM_BUTTON_FONT_WEIGHT = 500;

/** Row icons (schedule, description, etc.). */
export const TASK_FORM_ICON_SIZE = 20;
/** Icons inside pills (prioridad, adjuntar). */
export const TASK_FORM_PILL_ICON_SIZE = 16;
/** Chevron inside pill selects and dropdowns. */
export const TASK_FORM_CHEVRON_ICON_SIZE = 18;
/** Subtarea row action icons (check, delete). */
export const TASK_FORM_ACTION_ICON_SIZE = 20;
/** Subtarea checkbox in read-only expanded cards. */
export const TASK_FORM_SUBTASK_CHECK_ICON_SIZE = 18;
/** Inline attachment icon in file lists. */
export const TASK_FORM_INLINE_ATTACHMENT_ICON_SIZE = 14;

export const TASK_FORM_PILL_HEIGHT = 32;
/** Full capsule radius for 32px-tall interactive pills (Google Calendar "Hoy" style). */
export const TASK_FORM_PILL_BORDER_RADIUS = '9999px';
/** Tags/chips: slightly less rounded than full capsules. */
export const TASK_FORM_PILL_CHIP_BORDER_RADIUS = 16;
export const TASK_FORM_PILL_GAP = 0.75;
/** Fixed width for start/deadline date pills (fits "Miércoles, 31 diciembre" with ellipsis). */
export const TASK_FORM_DATE_PILL_WIDTH = 180;
/** Modular select pills (objetivo, etc.): content-sized like settings row. */
export const TASK_FORM_SELECT_PILL_MIN_WIDTH = 120;
export const TASK_FORM_SELECT_PILL_MAX_WIDTH = 220;
export const TASK_FORM_PILL_BORDER_WIDTH = '1px';
export const TASK_FORM_PILL_OUTLINE_BORDER = 'rgba(255, 255, 255, 0.15)';
export const TASK_FORM_PILL_OUTLINE_BORDER_HOVER = 'rgba(255, 255, 255, 0.25)';
export const TASK_FORM_PILL_OUTLINED_BG = 'transparent';
export const TASK_FORM_PILL_OUTLINED_BG_HOVER = 'rgba(255, 255, 255, 0.08)';
export const TASK_FORM_PILL_FILL_BG = 'rgba(255, 255, 255, 0.08)';
export const TASK_FORM_PILL_FILL_BG_HOVER = 'rgba(255, 255, 255, 0.12)';

export const TASK_FORM_ROW_MIN_HEIGHT = 44;
export const TASK_FORM_ROW_PY = 1.25;
export const TASK_FORM_ROW_GAP = 1.5;
export const TASK_FORM_ICON_COLUMN_WIDTH = 24;

export const taskFormTitleTextSx = {
  fontSize: TASK_FORM_TITLE_FONT_SIZE,
  fontWeight: TASK_FORM_TITLE_FONT_WEIGHT,
  lineHeight: TASK_FORM_TITLE_LINE_HEIGHT,
};

export const taskFormBodyTextSx = {
  fontSize: TASK_FORM_BODY_FONT_SIZE,
  lineHeight: TASK_FORM_BODY_LINE_HEIGHT,
};

export const taskFormPillTextSx = {
  fontSize: TASK_FORM_PILL_FONT_SIZE,
  lineHeight: TASK_FORM_PILL_LINE_HEIGHT,
  fontWeight: TASK_FORM_PILL_FONT_WEIGHT,
};

export const taskFormCaptionTextSx = {
  fontSize: TASK_FORM_CAPTION_FONT_SIZE,
  lineHeight: TASK_FORM_CAPTION_LINE_HEIGHT,
  color: 'text.secondary',
};

export const taskFormFieldInputSx = {
  fontSize: TASK_FORM_BODY_FONT_SIZE,
  lineHeight: TASK_FORM_BODY_LINE_HEIGHT,
  py: 0,
};

export const taskFormSwitchLabelSx = {
  ...taskFormPillTextSx,
  userSelect: 'none',
};

export const taskFormErrorTextSx = {
  fontSize: TASK_FORM_CAPTION_FONT_SIZE,
  lineHeight: TASK_FORM_CAPTION_LINE_HEIGHT,
  color: 'error.main',
};

export const taskFormPillIconSx = { fontSize: TASK_FORM_PILL_ICON_SIZE, flexShrink: 0 };
export const taskFormPillChevronSx = { fontSize: TASK_FORM_CHEVRON_ICON_SIZE, color: 'text.secondary', flexShrink: 0 };
export const taskFormActionIconSx = { fontSize: TASK_FORM_ACTION_ICON_SIZE };
export const taskFormSubtaskCheckIconSx = { fontSize: TASK_FORM_SUBTASK_CHECK_ICON_SIZE };
export const taskFormInlineAttachmentIconSx = { fontSize: TASK_FORM_INLINE_ATTACHMENT_ICON_SIZE };
export const taskFormPillRowSx = { width: '100%', minHeight: TASK_FORM_PILL_HEIGHT };
/** Vertical stack for schedule row 1 (date/time) + row 2 (deadline). */
export const taskFormScheduleStackSx = { width: '100%' };
export const taskFormRowContentIndent = TASK_FORM_ICON_COLUMN_WIDTH / 8 + TASK_FORM_ROW_GAP;

export const taskFormTimeSeparatorSx = {
  px: 0.25,
  userSelect: 'none',
  fontSize: TASK_FORM_PILL_FONT_SIZE,
  color: 'text.secondary',
};

export const taskFormChipSx = {
  height: TASK_FORM_PILL_HEIGHT,
  borderRadius: TASK_FORM_PILL_CHIP_BORDER_RADIUS,
  fontSize: TASK_FORM_PILL_FONT_SIZE,
};

export const taskFormDialogPaperSx = (isMobile) => ({
  borderRadius: isMobile ? 0 : 3,
  bgcolor: 'background.paper',
  backgroundImage: 'none',
  boxShadow: (t) => t.shadows[isMobile ? 16 : 12],
  overflow: 'hidden',
  ...(isMobile && {
    m: 0,
    width: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
    height: '100%',
  }),
});

export const taskFormGooglePaperSx = taskFormDialogPaperSx;

export const taskFormTitleFieldSx = {
  '& .MuiInputBase-input': {
    ...taskFormTitleTextSx,
    py: 0.75,
    px: 0,
  },
  '& .MuiInput-underline:before': { borderBottomColor: 'divider' },
  '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
    borderBottomColor: 'rgba(255, 255, 255, 0.25)',
  },
  '& .MuiInput-underline:after': { borderBottomWidth: 1 },
};

export const taskFormStandardFieldSx = {
  '& .MuiInputBase-root': { fontSize: TASK_FORM_BODY_FONT_SIZE },
  '& .MuiInput-underline:before': { borderBottomColor: 'divider' },
  '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
};

export const taskFormRowIconSx = {
  color: 'text.secondary',
  fontSize: TASK_FORM_ICON_SIZE,
  flexShrink: 0,
};

export const taskFormPrimaryTextSx = {
  variant: 'body2',
  component: 'div',
  sx: { ...taskFormBodyTextSx, color: 'text.primary' },
};

export const taskFormSecondaryTextSx = taskFormCaptionTextSx;

export function TaskFormPrimaryLine({ children, onClick, sx }) {
  const content = (
    <Typography variant="body2" sx={{ ...taskFormBodyTextSx, ...sx }}>
      {children}
    </Typography>
  );
  if (onClick) {
    return (
      <Box
        component="button"
        type="button"
        onClick={onClick}
        sx={{
          border: 'none',
          background: 'none',
          p: 0,
          m: 0,
          textAlign: 'left',
          cursor: 'pointer',
          color: 'text.primary',
          font: 'inherit',
          width: '100%',
          '&:hover': { opacity: 0.85 },
        }}
      >
        {content}
      </Box>
    );
  }
  return content;
}

export function TaskFormSecondaryLine({ children, sx }) {
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ display: 'block', ...taskFormCaptionTextSx, mt: 0.25, ...sx }}
    >
      {children}
    </Typography>
  );
}

export function TaskFormRow({ icon: Icon, children, showDivider = false, align = 'flex-start' }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: align,
        gap: TASK_FORM_ROW_GAP,
        py: TASK_FORM_ROW_PY,
        minHeight: TASK_FORM_ROW_MIN_HEIGHT,
        borderBottom: showDivider ? 1 : 0,
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          width: TASK_FORM_ICON_COLUMN_WIDTH,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: align === 'center' ? 'center' : 'flex-start',
          pt: align === 'flex-start' ? 0.375 : 0,
        }}
      >
        {Icon ? <Icon sx={taskFormRowIconSx} /> : null}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

export function TaskFormHeader({
  onClose,
  closeLabel = 'Cerrar',
  children,
  sx,
}) {
  return (
    <Box sx={{ position: 'relative', px: 2, pt: 1.5, pb: 0.5, ...sx }}>
      {onClose && (
        <IconButton
          size="small"
          onClick={onClose}
          aria-label={closeLabel}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'text.secondary',
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
      {children}
    </Box>
  );
}

export const taskFormSaveButtonSx = {
  textTransform: 'none',
  borderRadius: TASK_FORM_PILL_BORDER_RADIUS,
  px: 2.5,
  py: 0.75,
  minWidth: 88,
  fontWeight: TASK_FORM_BUTTON_FONT_WEIGHT,
  fontSize: TASK_FORM_BUTTON_FONT_SIZE,
  boxShadow: 'none',
  bgcolor: '#8ab4f8',
  color: '#202124',
  '&:hover': {
    bgcolor: '#aecbfa',
    boxShadow: 'none',
  },
  '&.Mui-disabled': {
    bgcolor: 'action.disabledBackground',
    color: 'text.disabled',
  },
};

export function TaskFormFooter({
  onSave,
  saveLabel = 'Guardar',
  saving = false,
  disabled = false,
  leftAction,
  onCancel,
  cancelLabel = 'Cancelar',
  showCancel = false,
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 1,
        px: 2,
        py: 1.5,
        mt: 0.5,
      }}
    >
      {leftAction && <Box sx={{ mr: 'auto' }}>{leftAction}</Box>}
      {showCancel && onCancel && (
        <Button
          size="small"
          onClick={onCancel}
          sx={{ textTransform: 'none', color: 'text.secondary', mr: 'auto', ...taskFormPillTextSx }}
        >
          {cancelLabel}
        </Button>
      )}
      <Button
        size="small"
        variant="contained"
        disabled={disabled || saving}
        onClick={onSave}
        sx={taskFormSaveButtonSx}
      >
        {saveLabel}
      </Button>
    </Box>
  );
}

const TASK_FORM_CREATE_OPTION = '__task_form_create__';

export function TaskFormPillSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar',
  error,
  helperText,
  required,
  emptyLabel = 'Sin objetivo',
  onCreate,
  createLabel = 'Nuevo objetivo',
}) {
  const handleChange = (event) => {
    if (event.target.value === TASK_FORM_CREATE_OPTION) {
      onCreate?.();
      return;
    }
    onChange?.(event);
  };

  return (
    <TextField
      select
      variant="standard"
      value={value || ''}
      onChange={handleChange}
      error={!!error}
      helperText={helperText || error}
      required={required}
      SelectProps={{
        displayEmpty: true,
        IconComponent: ChevronDownIcon,
      }}
      InputProps={{
        disableUnderline: true,
      }}
      sx={{
        width: 'auto',
        maxWidth: '100%',
        alignSelf: 'flex-start',
        flexShrink: 0,
        '& .MuiSelect-select': {
          ...taskFormSelectPillSx,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          textAlign: 'left',
          color: value ? 'text.primary' : 'text.secondary',
          pr: '32px !important',
          boxSizing: 'border-box',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          '& em': { fontStyle: 'normal' },
        },
        '& .MuiInputBase-root:hover .MuiSelect-select:not(.Mui-disabled)': {
          bgcolor: TASK_FORM_PILL_OUTLINED_BG_HOVER,
          borderColor: TASK_FORM_PILL_OUTLINE_BORDER_HOVER,
        },
        '& .MuiSelect-icon': {
          right: 8,
          color: 'text.secondary',
          fontSize: TASK_FORM_ICON_SIZE,
        },
      }}
    >
      <MenuItem value="">
        <em>{emptyLabel}</em>
      </MenuItem>
      {options.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>
          {opt.label}
        </MenuItem>
      ))}
      {onCreate ? (
        <MenuItem
          value={TASK_FORM_CREATE_OPTION}
          sx={{
            color: 'primary.main',
            fontWeight: 500,
            borderTop: 1,
            borderColor: 'divider',
            mt: 0.5,
          }}
        >
          {createLabel}
        </MenuItem>
      ) : null}
    </TextField>
  );
}

export const TASK_FORM_TIPO_EVENTO_TAREA = [
  { value: 'EVENTO', label: 'Evento' },
  { value: 'TAREA', label: 'Tarea' },
];

export const TASK_FORM_TIPO_ALL = [
  ...TASK_FORM_TIPO_EVENTO_TAREA,
  { value: 'HABITO', label: 'Hábito' },
];

const TASK_FORM_TIPO_SEGMENT_PADDING_X = 1.25;

export function TaskFormTipoSelector({
  value,
  onChange,
  options = TASK_FORM_TIPO_EVENTO_TAREA,
  readOnly = false,
  disabled = false,
  sx,
}) {
  const isInteractive = !readOnly && !disabled && typeof onChange === 'function';

  return (
    <Box
      role="group"
      aria-label="Tipo"
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
        width: '100%',
        height: TASK_FORM_PILL_HEIGHT,
        minHeight: TASK_FORM_PILL_HEIGHT,
        borderRadius: TASK_FORM_PILL_BORDER_RADIUS,
        border: `${TASK_FORM_PILL_BORDER_WIDTH} solid ${TASK_FORM_PILL_OUTLINE_BORDER}`,
        overflow: 'hidden',
        boxSizing: 'border-box',
        ...(readOnly || disabled ? { pointerEvents: 'none', opacity: readOnly ? 0.92 : 0.45 } : null),
        ...sx,
      }}
    >
      {options.map((segment, index) => {
        const selected = value === segment.value;
        const isLast = index === options.length - 1;

        return (
          <Box
            key={segment.value}
            component={isInteractive ? 'button' : 'span'}
            type={isInteractive ? 'button' : undefined}
            onClick={isInteractive ? () => onChange(segment.value) : undefined}
            aria-label={segment.label}
            aria-pressed={selected}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'stretch',
              width: '100%',
              minWidth: 0,
              minHeight: TASK_FORM_PILL_HEIGHT,
              height: '100%',
              px: TASK_FORM_TIPO_SEGMENT_PADDING_X,
              py: 0,
              m: 0,
              border: 'none',
              borderRight: isLast
                ? 'none'
                : `${TASK_FORM_PILL_BORDER_WIDTH} solid ${TASK_FORM_PILL_OUTLINE_BORDER}`,
              boxSizing: 'border-box',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              fontSize: TASK_FORM_PILL_FONT_SIZE,
              lineHeight: 1,
              fontWeight: selected ? 500 : 400,
              bgcolor: selected ? 'action.selected' : 'transparent',
              color: selected ? 'text.primary' : 'text.secondary',
              cursor: isInteractive ? 'pointer' : 'default',
              transition: 'background-color 0.15s ease',
              fontFamily: 'inherit',
              '&:hover': isInteractive
                ? { bgcolor: selected ? 'action.selected' : TASK_FORM_PILL_OUTLINED_BG_HOVER }
                : undefined,
            }}
          >
            {segment.label}
          </Box>
        );
      })}
    </Box>
  );
}

/** @deprecated Use TaskFormTipoSelector */
export const TaskFormTipoSegmentedToggle = TaskFormTipoSelector;

export function TaskTipoChips({ value, onChange, options, sx }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: TASK_FORM_PILL_GAP, ...sx }}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <Chip
            key={opt.value}
            label={opt.label}
            size="small"
            onClick={() => onChange(opt.value)}
            variant={selected ? 'filled' : 'outlined'}
            sx={{
              ...taskFormChipSx,
              fontWeight: selected ? 500 : 400,
              borderColor: selected ? 'transparent' : TASK_FORM_PILL_OUTLINE_BORDER,
              bgcolor: selected ? 'action.selected' : 'transparent',
              color: selected ? 'text.primary' : 'text.secondary',
              '&:hover': {
                bgcolor: selected ? 'action.selected' : TASK_FORM_PILL_OUTLINED_BG_HOVER,
                borderColor: selected ? 'transparent' : TASK_FORM_PILL_OUTLINE_BORDER_HOVER,
              },
            }}
          />
        );
      })}
    </Box>
  );
}

export function TaskFormSectionLabel({ children }) {
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ display: 'block', mb: 0.5, ...taskFormCaptionTextSx }}
    >
      {children}
    </Typography>
  );
}

const taskFormPillBaseSx = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: TASK_FORM_PILL_GAP,
  borderRadius: TASK_FORM_PILL_BORDER_RADIUS,
  fontSize: TASK_FORM_PILL_FONT_SIZE,
  fontWeight: 400,
  lineHeight: TASK_FORM_PILL_LINE_HEIGHT,
  px: 1.25,
  py: 0,
  height: TASK_FORM_PILL_HEIGHT,
  minHeight: TASK_FORM_PILL_HEIGHT,
  boxSizing: 'border-box',
  cursor: 'pointer',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  transition: 'background-color 0.15s ease, border-color 0.15s ease',
  '&:disabled': {
    opacity: 0.45,
    cursor: 'default',
  },
};

/** Outlined capsule (Google Calendar "Hoy" / "Semana" toolbar style). */
export const taskFormPillOutlinedSx = {
  ...taskFormPillBaseSx,
  border: `${TASK_FORM_PILL_BORDER_WIDTH} solid ${TASK_FORM_PILL_OUTLINE_BORDER}`,
  bgcolor: TASK_FORM_PILL_OUTLINED_BG,
  color: 'text.primary',
  '&:hover:not(:disabled)': {
    bgcolor: TASK_FORM_PILL_OUTLINED_BG_HOVER,
    borderColor: TASK_FORM_PILL_OUTLINE_BORDER_HOVER,
  },
};

/** Solid fill capsule (selected state or emphasis). */
export const taskFormPillSolidSx = {
  ...taskFormPillBaseSx,
  border: 'none',
  bgcolor: TASK_FORM_PILL_FILL_BG,
  color: 'text.primary',
  '&:hover:not(:disabled)': {
    bgcolor: TASK_FORM_PILL_FILL_BG_HOVER,
  },
};

/** Shared fixed width for fecha inicio / fecha límite pills and read-only date columns. */
export const taskFormDatePillSx = {
  width: TASK_FORM_DATE_PILL_WIDTH,
  minWidth: TASK_FORM_DATE_PILL_WIDTH,
  maxWidth: TASK_FORM_DATE_PILL_WIDTH,
  justifyContent: 'center',
  textAlign: 'center',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

export const taskFormDatePillColumnSx = {
  width: TASK_FORM_DATE_PILL_WIDTH,
  minWidth: TASK_FORM_DATE_PILL_WIDTH,
  maxWidth: TASK_FORM_DATE_PILL_WIDTH,
  flexShrink: 0,
  textAlign: 'center',
};

/** Fecha y hora: outlined capsules compartidos. */
export const taskFormSchedulePillButtonSx = {
  ...taskFormPillOutlinedSx,
};

/** Estado, prioridad, cadencia, adjuntar: mismo patrón visual que schedule. */
export const taskFormSettingsPillButtonSx = {
  ...taskFormSchedulePillButtonSx,
};

/** Select/dropdown pill (objetivo): modular width like settings pills. */
export const taskFormSelectPillSx = {
  ...taskFormSettingsPillButtonSx,
  justifyContent: 'flex-start',
  textAlign: 'left',
  width: 'auto',
  minWidth: TASK_FORM_SELECT_PILL_MIN_WIDTH,
  maxWidth: TASK_FORM_SELECT_PILL_MAX_WIDTH,
};

/** @deprecated Use taskFormSchedulePillButtonSx or taskFormSettingsPillButtonSx */
export const taskFormRecurrencePillButtonSx = taskFormSettingsPillButtonSx;

/** @deprecated Use taskFormSchedulePillButtonSx or taskFormSettingsPillButtonSx */
export const taskFormPillButtonSx = taskFormSchedulePillButtonSx;

/** Read-only body text (description, subtarea titles). */
export const taskFormReadOnlyBodyLineSx = {
  ...taskFormBodyTextSx,
  color: 'text.primary',
  textAlign: 'left',
};

/** Read-only metadata (schedule, settings, objetivo) — matches pill text size. */
export const taskFormReadOnlyMetaLineSx = {
  ...taskFormPillTextSx,
  color: 'text.primary',
  textAlign: 'left',
};

/** @deprecated Use taskFormReadOnlyBodyLineSx or taskFormReadOnlyMetaLineSx */
export const taskFormReadOnlyLineSx = taskFormReadOnlyMetaLineSx;

export const taskFormReadOnlySeparatorSx = {
  ...taskFormCaptionTextSx,
  px: 0.5,
  userSelect: 'none',
};

/** Plain read-only text (no pill background/border) for expanded task cards. */
export function TaskFormReadOnlyLine({ children, component = 'span', variant = 'meta', sx }) {
  const variantSx = variant === 'body' ? taskFormReadOnlyBodyLineSx : taskFormReadOnlyMetaLineSx;

  return (
    <Typography
      component={component}
      variant="body2"
      sx={{ ...variantSx, ...sx }}
    >
      {children}
    </Typography>
  );
}

export function TaskFormReadOnlySeparator({ children = '·' }) {
  return (
    <Typography component="span" variant="body2" sx={taskFormReadOnlySeparatorSx}>
      {children}
    </Typography>
  );
}

export function TaskFormReadOnlyPill({ children, variant = 'settings', sx }) {
  if (variant === 'flat') {
    return <TaskFormReadOnlyLine sx={sx}>{children}</TaskFormReadOnlyLine>;
  }

  const variantSx = variant === 'schedule'
    ? taskFormSchedulePillButtonSx
    : taskFormSettingsPillButtonSx;

  return (
    <Box
      component="span"
      sx={{
        ...variantSx,
        cursor: 'default',
        pointerEvents: 'none',
        '&:hover': { bgcolor: variantSx.bgcolor },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

export const TaskFormPillButton = React.forwardRef(function TaskFormPillButton(
  {
    children,
    onClick,
    disabled = false,
    variant = 'schedule',
    component = 'button',
    sx,
    'aria-label': ariaLabel,
  },
  ref,
) {
  const variantSx = variant === 'solid'
    ? taskFormPillSolidSx
    : variant === 'settings'
      ? taskFormSettingsPillButtonSx
      : taskFormSchedulePillButtonSx;

  return (
    <Box
      ref={ref}
      component={component}
      type={component === 'button' ? 'button' : undefined}
      onClick={disabled ? undefined : onClick}
      disabled={component === 'button' ? disabled : undefined}
      aria-label={ariaLabel}
      aria-disabled={component !== 'button' && disabled ? true : undefined}
      sx={{ ...variantSx, ...sx }}
    >
      {children}
    </Box>
  );
});

export const taskFormPickerPopoverPaperSx = {
  borderRadius: 2,
  bgcolor: 'background.default',
  boxShadow: (t) => t.shadows[8],
  mt: 0.5,
  overflow: 'hidden',
};

/** Switch "Todo el día" alineado a la derecha (estilo Google Calendar). */
export function TaskFormAllDaySwitch({
  checked,
  onChange,
  label = 'Todo el día',
  disabled = false,
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.75}
      sx={{ flexShrink: 0, ml: 'auto', minHeight: TASK_FORM_PILL_HEIGHT }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={taskFormSwitchLabelSx}
      >
        {label}
      </Typography>
      <Switch
        size="small"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        inputProps={{ 'aria-label': label }}
      />
    </Stack>
  );
}
