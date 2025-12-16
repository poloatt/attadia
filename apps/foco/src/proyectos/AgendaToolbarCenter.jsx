import React, { useState } from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

/**
 * Controles centrales para la Agenda en la Toolbar.
 * - Selector "Ahora / Luego"
 * Emite eventos:
 *  - agendaViewChanged { view }
 */
export default function AgendaToolbarCenter() {
  const [agendaView, setAgendaView] = useState('ahora');

  return (
    <ToggleButtonGroup
      size="small"
      color="primary"
      value={agendaView}
      exclusive
      sx={{
        '& .MuiToggleButton-root': {
          minHeight: 28,
          py: 0.25,
          px: 1.25,
          lineHeight: 1,
          fontSize: '0.75rem'
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
      <ToggleButton value="ahora">Ahora</ToggleButton>
      <ToggleButton value="luego">Luego</ToggleButton>
    </ToggleButtonGroup>
  );
}


