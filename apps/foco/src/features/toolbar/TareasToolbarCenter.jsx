import React from 'react';
import { Box } from '@mui/material';
import useResponsive from '@shared/hooks/useResponsive';
import { useTareasPageView } from '../tasks/list/useTareasPageView';
import AgendaToolbarCenter from './AgendaToolbarCenter';
import AgendaViewModeToggle from './AgendaViewModeToggle';
import TiempoToolbarActions from './TiempoToolbarActions';
import {
  TAREAS_TOOLBAR_CENTER_ROW_HEIGHT,
  TAREAS_TOOLBAR_RIGHT_SLOT_WIDTH,
} from './tareasToolbarLayout';

const rightSlotSx = {
  position: 'relative',
  width: TAREAS_TOOLBAR_RIGHT_SLOT_WIDTH,
  minWidth: TAREAS_TOOLBAR_RIGHT_SLOT_WIDTH,
  height: TAREAS_TOOLBAR_CENTER_ROW_HEIGHT,
  flexShrink: 0,
};

const rightSlotLayerSx = {
  position: 'absolute',
  top: 0,
  right: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  height: '100%',
};

export default function TareasToolbarCenter() {
  const { isMobile } = useResponsive();
  const pageView = useTareasPageView();
  const isAgendaView = pageView === 'agenda';

  if (!isMobile) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          minHeight: TAREAS_TOOLBAR_CENTER_ROW_HEIGHT,
          height: TAREAS_TOOLBAR_CENTER_ROW_HEIGHT,
          overflow: 'hidden',
        }}
      >
        <TiempoToolbarActions section="tareas" dense />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        width: '100%',
        minHeight: TAREAS_TOOLBAR_CENTER_ROW_HEIGHT,
        height: TAREAS_TOOLBAR_CENTER_ROW_HEIGHT,
        overflow: 'hidden',
      }}
    >
      <Box aria-hidden sx={{ minWidth: 0 }} />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <TiempoToolbarActions section="tareas" dense />
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          minWidth: 0,
        }}
      >
        <Box sx={rightSlotSx}>
          <Box
            sx={{
              ...rightSlotLayerSx,
              visibility: isAgendaView ? 'hidden' : 'visible',
              pointerEvents: isAgendaView ? 'none' : 'auto',
            }}
            aria-hidden={isAgendaView}
          >
            <AgendaToolbarCenter />
          </Box>
          <Box
            sx={{
              ...rightSlotLayerSx,
              visibility: isAgendaView ? 'visible' : 'hidden',
              pointerEvents: isAgendaView ? 'auto' : 'none',
            }}
            aria-hidden={!isAgendaView}
          >
            <AgendaViewModeToggle />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
