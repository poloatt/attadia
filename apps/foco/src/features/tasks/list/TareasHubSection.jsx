import React from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { HubSectionShell } from '@shared/components/hub';
import TareasTable from './TareasTable';
import focoConfig from '../../../config/app';

const TAREAS_PATH = focoConfig.routes.tareas;

export default function TareasHubSection({
  isMobile,
  agendaView,
  tareasAgenda,
  tareasAhora,
  tareasLuego,
  tareasTableCommonProps,
}) {
  const navigate = useNavigate();

  return (
    <HubSectionShell
      title="Tareas"
      onTitleClick={() => navigate(TAREAS_PATH)}
      shellSx={{ mt: 1.5 }}
      bodySx={{ pt: 1, pb: 0, px: { xs: 0, sm: 0.5 } }}
    >
      {isMobile ? (
        <TareasTable
          {...tareasTableCommonProps}
          tareas={tareasAgenda}
          agendaView={agendaView}
        />
      ) : (
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <TareasTable
              {...tareasTableCommonProps}
              tareas={tareasAhora}
              agendaView="ahora"
            />
          </Box>
          <Box sx={{ width: '1px', bgcolor: 'divider', flexShrink: 0, display: { xs: 'none', md: 'block' } }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <TareasTable
              {...tareasTableCommonProps}
              tareas={tareasLuego}
              agendaView="luego"
            />
          </Box>
        </Box>
      )}
    </HubSectionShell>
  );
}
