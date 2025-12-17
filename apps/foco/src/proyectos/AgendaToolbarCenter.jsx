import React, { useState } from 'react';
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

/**
 * Controles centrales para la Agenda en la Toolbar.
 * - Selector "Ahora / Luego"
 * Emite eventos:
 *  - agendaViewChanged { view }
 */
export default function AgendaToolbarCenter() {
  const [agendaView, setAgendaView] = useState('ahora');
  const theme = useTheme();

  const baseBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.04)
    : alpha(theme.palette.common.black, 0.04);
  const hoverBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.08)
    : alpha(theme.palette.common.black, 0.06);
  const selectedBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.10)
    : alpha(theme.palette.common.black, 0.08);
  const selectedHoverBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.12)
    : alpha(theme.palette.common.black, 0.10);
  const rail = theme.palette.mode === 'dark'
    ? alpha(theme.palette.text.primary, 0.22)
    : alpha(theme.palette.text.primary, 0.18);

  return (
    // Nota: el CenteredTrack (Toolbar) centra su child. Para alinear a la izquierda,
    // hacemos que este componente ocupe todo el ancho disponible y alinee internamente.
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
      <ToggleButtonGroup
        size="small"
        value={agendaView}
        exclusive
        sx={{
          width: 'auto',
          justifyContent: 'flex-start',
          '& .MuiToggleButtonGroup-grouped': {
            margin: 0,
            border: 'none',
            borderRadius: 0
          }
        }}
        onChange={(_, v) => {
          if (!v) return;
          // Solo soportamos ahora/luego (sin subfiltros)
          if (v !== 'ahora' && v !== 'luego') return;
          setAgendaView(v);
          window.dispatchEvent(new CustomEvent('agendaViewChanged', { detail: { view: v } }));
        }}
      >
        <ToggleButton
          value="ahora"
          sx={{
            minHeight: 28,
            py: 0.25,
            px: 1.25,
            lineHeight: 1,
            fontSize: '0.75rem',
            textTransform: 'none',
            borderRadius: 0,
            color: 'text.secondary',
            background: baseBg,
            borderLeft: '2px solid',
            borderLeftColor: rail,
            '&:hover': { background: hoverBg, color: 'text.primary' },
            '&.Mui-selected': {
              color: 'text.primary',
              background: selectedBg,
              borderLeftColor: alpha(theme.palette.text.primary, 0.32)
            },
            '&.Mui-selected:hover': { background: selectedHoverBg }
          }}
        >
          Ahora
        </ToggleButton>
        <ToggleButton
          value="luego"
          sx={{
            minHeight: 28,
            py: 0.25,
            px: 1.25,
            lineHeight: 1,
            fontSize: '0.75rem',
            textTransform: 'none',
            borderRadius: 0,
            color: 'text.secondary',
            background: 'transparent',
            borderLeft: '2px solid',
            borderLeftColor: rail,
            '&:hover': { background: 'transparent', color: 'text.primary' },
            '&.Mui-selected': {
              color: 'text.primary',
              background: 'transparent',
              borderLeftColor: alpha(theme.palette.text.primary, 0.32)
            },
            '&.Mui-selected:hover': { background: 'transparent' }
          }}
        >
          Luego
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}


