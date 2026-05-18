import React from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { Close as CloseIcon, KeyboardArrowDown as ChevronDownIcon } from '@mui/icons-material';

/** Shared Google Calendar / Tasks–inspired form tokens (dark theme). */
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
    fontSize: '1.375rem',
    fontWeight: 400,
    lineHeight: 1.35,
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
  '& .MuiInputBase-root': { fontSize: '0.875rem' },
  '& .MuiInput-underline:before': { borderBottomColor: 'divider' },
  '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
};

export const taskFormRowIconSx = {
  color: 'text.secondary',
  fontSize: 20,
  flexShrink: 0,
  mt: 0.25,
};

export const taskFormPrimaryTextSx = {
  variant: 'body2',
  component: 'div',
  sx: { fontSize: '0.875rem', lineHeight: 1.45, color: 'text.primary' },
};

export const taskFormSecondaryTextSx = {
  fontSize: '0.75rem',
  color: 'text.secondary',
  lineHeight: 1.35,
};

export function TaskFormPrimaryLine({ children, onClick, sx }) {
  const content = (
    <Typography variant="body2" sx={{ fontSize: '0.875rem', lineHeight: 1.45, ...sx }}>
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
      sx={{ display: 'block', fontSize: '0.75rem', lineHeight: 1.35, mt: 0.25, ...sx }}
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
        gap: 2,
        py: 1.25,
        minHeight: 44,
        borderBottom: showDivider ? 1 : 0,
        borderColor: 'divider',
      }}
    >
      {Icon ? <Icon sx={taskFormRowIconSx} /> : <Box sx={{ width: 20, flexShrink: 0 }} />}
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
  borderRadius: '20px',
  px: 2.5,
  py: 0.75,
  minWidth: 88,
  fontWeight: 500,
  fontSize: '0.875rem',
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
          sx={{ textTransform: 'none', color: 'text.secondary', mr: 'auto' }}
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
  createLabel = 'Nuevo',
}) {
  return (
    <Box>
      <TextField
        select
        variant="standard"
        value={value || ''}
        onChange={onChange}
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
          width: '100%',
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            py: 0.75,
            px: 1.5,
            pr: '32px !important',
            borderRadius: '20px',
            bgcolor: 'action.hover',
            fontSize: '0.8125rem',
            color: value ? 'text.primary' : 'text.secondary',
            minHeight: 36,
            boxSizing: 'border-box',
          },
          '& .MuiSelect-icon': {
            right: 8,
            color: 'text.secondary',
            fontSize: 20,
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
      </TextField>
      {onCreate ? (
        <Button
          variant="text"
          size="small"
          onClick={onCreate}
          sx={{ mt: 0.5, textTransform: 'none', color: 'text.secondary', minWidth: 'auto', px: 0 }}
        >
          {createLabel}
        </Button>
      ) : null}
    </Box>
  );
}

export function TaskTipoChips({ value, onChange, options, sx }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, ...sx }}>
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
              height: 32,
              borderRadius: '16px',
              fontWeight: selected ? 500 : 400,
              fontSize: '0.8125rem',
              borderColor: selected ? 'transparent' : 'divider',
              bgcolor: selected ? 'action.selected' : 'transparent',
              color: selected ? 'text.primary' : 'text.secondary',
              '&:hover': {
                bgcolor: selected ? 'action.selected' : 'action.hover',
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
      sx={{ display: 'block', mb: 0.5, fontSize: '0.75rem' }}
    >
      {children}
    </Typography>
  );
}

/** Google Calendar–style pill control (date/time/recurrence). */
export const taskFormPillButtonSx = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 0.5,
  border: 'none',
  borderRadius: '8px',
  bgcolor: 'rgba(255, 255, 255, 0.08)',
  color: 'text.primary',
  fontSize: '0.8125rem',
  fontWeight: 400,
  lineHeight: 1.35,
  px: 1.25,
  py: 0.625,
  minHeight: 32,
  cursor: 'pointer',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  '&:hover:not(:disabled)': {
    bgcolor: 'rgba(255, 255, 255, 0.12)',
  },
  '&:disabled': {
    opacity: 0.45,
    cursor: 'default',
  },
};

export const TaskFormPillButton = React.forwardRef(function TaskFormPillButton(
  {
    children,
    onClick,
    disabled = false,
    sx,
    'aria-label': ariaLabel,
  },
  ref,
) {
  return (
    <Box
      ref={ref}
      component="button"
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      sx={{ ...taskFormPillButtonSx, ...sx }}
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
