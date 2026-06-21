import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';
import useResponsive from '@shared/hooks/useResponsive';
import { matchTiempoSection } from '@shared/navigation/tiempoToolbarPaths';

const OPTIONS = [
  { value: 'ahora', label: 'Ahora' },
  { value: 'luego', label: 'Luego' },
];

/**
 * Selector "Ahora | Luego" para Tareas en móvil.
 * Emite eventos: agendaViewChanged { view }
 */
export default function AgendaToolbarCenter() {
  const { isMobile } = useResponsive();
  const { pathname } = useLocation();
  const [agendaView, setAgendaView] = useState('ahora');
  const theme = useTheme();

  if (!isMobile || matchTiempoSection(pathname) !== 'tareas') {
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
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        flexShrink: 0,
        userSelect: 'none',
      }}
      role="group"
      aria-label="Vista de agenda"
    >
      {OPTIONS.map((option, index) => (
        <React.Fragment key={option.value}>
          {index > 0 && (
            <Typography
              component="span"
              sx={{
                fontSize: '0.75rem',
                lineHeight: 1,
                color: alpha(theme.palette.text.secondary, 0.35),
                fontWeight: 300,
              }}
              aria-hidden
            >
              |
            </Typography>
          )}
          <Box
            component="button"
            type="button"
            onClick={() => handleSelect(option.value)}
            aria-pressed={agendaView === option.value}
            sx={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              p: 0,
              m: 0,
              font: 'inherit',
              fontSize: '0.75rem',
              lineHeight: 1.2,
              fontWeight: agendaView === option.value ? 700 : 400,
              color: agendaView === option.value ? 'text.primary' : inactiveColor,
              opacity: agendaView === option.value ? 1 : 0.85,
              transition: 'color 0.15s ease, opacity 0.15s ease',
              '&:hover': {
                color: agendaView === option.value ? 'text.primary' : 'text.secondary',
                opacity: 1,
              },
            }}
          >
            {option.label}
          </Box>
        </React.Fragment>
      ))}
    </Box>
  );
}
