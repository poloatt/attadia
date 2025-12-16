import React, { useState } from 'react';
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';

/**
 * Controles centrales para la Agenda en la Toolbar.
 * - Selector "Ahora / Luego"
 * Emite eventos:
 *  - agendaViewChanged { view }
 */
export default function AgendaToolbarCenter() {
  const [agendaView, setAgendaView] = useState('ahora');

  const groupSx = {
    width: 'fit-content',
    display: 'inline-flex',
    borderRadius: 0,
    overflow: 'hidden',
    border: '1px solid #2a2a2a',
    background: '#1c1c1c',
    boxShadow: 'none',
    '& .MuiToggleButtonGroup-grouped': {
      margin: 0,
      border: 'none',
      borderRadius: 0
    }
  };

  const baseBtnSx = {
    minHeight: 28,
    py: 0.25,
    px: 1.4,
    lineHeight: 1,
    fontSize: '0.75rem',
    textTransform: 'none',
    letterSpacing: 0.2,
    // Sin "faded": texto siempre pleno
    color: '#fff',
    background: '#1c1c1c',
    fontWeight: 500,
    transition: 'background 0.18s ease, color 0.18s ease',
    '&:hover': { background: '#232323' },
    '&:not(:first-of-type)': { borderLeft: '1px solid #2a2a2a' },
    '&.Mui-selected': {
      background: '#262626',
      fontWeight: 700,
      boxShadow: 'inset 0 0 0 1px #3a3a3a'
    },
    '&.Mui-selected:hover': { background: '#2b2b2b' }
  };

  return (
    // Nota: el CenteredTrack (Toolbar) centra su child. Para alinear a la izquierda,
    // hacemos que este componente ocupe todo el ancho disponible y alinee internamente.
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
      <ToggleButtonGroup
        size="small"
        value={agendaView}
        exclusive
        sx={groupSx}
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
          sx={baseBtnSx}
        >
          Ahora
        </ToggleButton>
        <ToggleButton
          value="luego"
          sx={baseBtnSx}
        >
          Luego
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}


