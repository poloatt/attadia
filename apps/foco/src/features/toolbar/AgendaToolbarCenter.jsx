import React, { useState } from 'react';
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useResponsive from '@shared/hooks/useResponsive';

/**
 * Controles centrales para la Agenda en la Toolbar.
 * - Selector "Ahora / Luego"
 * - Solo se muestra en móvil (no en tablet ni desktop/pantalla dividida)
 * Emite eventos:
 *  - agendaViewChanged { view }
 */
export default function AgendaToolbarCenter() {
  const { isMobile } = useResponsive();
  const [agendaView, setAgendaView] = useState('ahora');
  const theme = useTheme();

  // No mostrar en tablet ni desktop (pantalla dividida) ya que ambos filtros se ven simultáneamente
  if (!isMobile) {
    return null;
  }

  // Colores para botón no seleccionado (transparente)
  const unselectedBorder = theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.15)
    : alpha(theme.palette.common.black, 0.15);
  const unselectedHoverBorder = theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.25)
    : alpha(theme.palette.common.black, 0.25);
  
  // Colores para botón seleccionado (con fill)
  const selectedBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.12)
    : alpha(theme.palette.common.black, 0.10);
  const selectedHoverBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.16)
    : alpha(theme.palette.common.black, 0.14);
  const selectedBorder = theme.palette.mode === 'dark'
    ? alpha(theme.palette.text.primary, 0.45)
    : alpha(theme.palette.text.primary, 0.40);
  const selectedBorderLeft = theme.palette.mode === 'dark'
    ? alpha(theme.palette.primary.main, 0.8)
    : theme.palette.primary.main;

  return (
    // Nota: el CenteredTrack (Toolbar) centra su child y tiene padding izquierdo.
    // Usamos posicionamiento absoluto y agregamos el mismo padding que la página principal
    // para alinear con el contenido (px: 1 en móvil, igual que Tareas.jsx).
    <Box sx={{ 
      position: 'absolute',
      left: 0,
      display: 'flex', 
      alignItems: 'center',
      height: '100%',
      pl: 1 // Mismo padding que la página principal (px: { xs: 1 }) para alineación
    }}>
      <ToggleButtonGroup
        size="small"
        value={agendaView}
        exclusive
        sx={{
          width: 'auto',
          margin: 0,
          padding: 0,
          '& .MuiToggleButtonGroup-grouped': {
            margin: 0,
            borderRadius: 0,
            '&:not(:first-of-type):not(.Mui-selected)': {
              borderLeft: 'none'
            }
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
            fontWeight: 500,
            textTransform: 'none',
            borderRadius: 0,
            color: 'text.secondary',
            background: 'transparent',
            border: '1px solid',
            borderColor: unselectedBorder,
            borderLeft: '3px solid',
            borderLeftColor: unselectedBorder,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              background: 'transparent',
              color: 'text.primary',
              borderColor: unselectedHoverBorder,
              borderLeftColor: unselectedHoverBorder
            },
            '&.Mui-selected': {
              color: 'text.primary',
              fontWeight: 600,
              background: selectedBg,
              borderColor: selectedBorder,
              borderLeft: '3px solid',
              borderLeftColor: selectedBorderLeft,
              '&:hover': {
                background: selectedHoverBg,
                borderColor: selectedBorder
              }
            }
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
            fontWeight: 500,
            textTransform: 'none',
            borderRadius: 0,
            color: 'text.secondary',
            background: 'transparent',
            border: '1px solid',
            borderColor: unselectedBorder,
            borderLeft: '3px solid',
            borderLeftColor: unselectedBorder,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              background: 'transparent',
              color: 'text.primary',
              borderColor: unselectedHoverBorder,
              borderLeftColor: unselectedHoverBorder
            },
            '&.Mui-selected': {
              color: 'text.primary',
              fontWeight: 600,
              background: selectedBg,
              borderColor: selectedBorder,
              borderLeft: '3px solid',
              borderLeftColor: selectedBorderLeft,
              '&:hover': {
                background: selectedHoverBg,
                borderColor: selectedBorder
              }
            }
          }}
        >
          Luego
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}


