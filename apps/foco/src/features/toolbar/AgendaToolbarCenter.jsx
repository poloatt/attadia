import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';
import { matchTiempoSection } from '@shared/navigation/tiempoToolbarPaths';
import {
  getTaskHorizonCopy,
  TASK_HORIZON_GROUP_ARIA,
} from '@shared/copy/agendaTerminology';
import { TAREAS_TOOLBAR_OPTION_MIN_WIDTH } from './tareasToolbarLayout';

const OPTIONS = ['ahora', 'luego'].map((value) => ({
  value,
  ...getTaskHorizonCopy(value),
}));

/** Ancho fijo por opción para que el peso activo no mueva la barra. */
const OPTION_MIN_WIDTH = TAREAS_TOOLBAR_OPTION_MIN_WIDTH;

const toggleGroupSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  flexShrink: 0,
  minHeight: 26,
  height: 26,
  userSelect: 'none',
};

const separatorSx = (theme) => ({
  fontSize: '0.75rem',
  lineHeight: 1,
  width: '0.35rem',
  textAlign: 'center',
  flexShrink: 0,
  color: alpha(theme.palette.text.secondary, 0.35),
  fontWeight: 300,
});

/**
 * Selector "Ahora | Luego" para Tareas.
 * Emite eventos: agendaViewChanged { view }
 */
export default function AgendaToolbarCenter() {
  const { pathname } = useLocation();
  const [agendaView, setAgendaView] = useState('ahora');
  const theme = useTheme();

  if (matchTiempoSection(pathname) !== 'tareas') {
    return null;
  }

  const handleSelect = (view) => {
    if (view === agendaView) return;
    setAgendaView(view);
    window.dispatchEvent(new CustomEvent('agendaViewChanged', { detail: { view } }));
  };

  const inactiveColor = alpha(theme.palette.text.secondary, 0.55);

  return (
    <Box
      sx={toggleGroupSx}
      role="group"
      aria-label={TASK_HORIZON_GROUP_ARIA}
    >
      {OPTIONS.map((option, index) => {
        const isActive = agendaView === option.value;
        return (
          <React.Fragment key={option.value}>
            {index > 0 && (
              <Typography component="span" sx={separatorSx(theme)} aria-hidden>
                |
              </Typography>
            )}
            <Box
              component="button"
              type="button"
              onClick={() => handleSelect(option.value)}
              aria-pressed={isActive}
              sx={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                p: 0,
                m: 0,
                font: 'inherit',
                fontSize: '0.75rem',
                lineHeight: 1.2,
                minWidth: OPTION_MIN_WIDTH,
                textAlign: 'center',
                fontWeight: 700,
                color: isActive ? 'text.primary' : inactiveColor,
                opacity: isActive ? 1 : 0.55,
                transition: 'color 0.15s ease, opacity 0.15s ease',
                '&:hover': {
                  color: isActive ? 'text.primary' : 'text.secondary',
                  opacity: 1,
                },
              }}
            >
              {option.label}
            </Box>
          </React.Fragment>
        );
      })}
    </Box>
  );
}
