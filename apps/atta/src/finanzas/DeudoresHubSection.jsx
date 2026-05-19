import React from 'react';
import { Typography } from '@mui/material';
import { PersonSearchOutlined } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { isPathActive } from '@shared/navigation/appNavResolver';
import FinanzasHubSectionCard from './FinanzasHubSectionCard';

const DEUDORES_PATH = '/finanzas/deudores';

export default function DeudoresHubSection() {
  const { pathname } = useLocation();
  const isActive = isPathActive(pathname, DEUDORES_PATH);

  return (
    <FinanzasHubSectionCard
      title="Deudores"
      iconKey="personSearch"
      path={DEUDORES_PATH}
      isActive={isActive}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ px: 0.125, display: 'flex', alignItems: 'center', gap: 0.75 }}
      >
        <PersonSearchOutlined sx={{ fontSize: 16, opacity: 0.7 }} />
        Próximamente: préstamos y cobros pendientes
      </Typography>
    </FinanzasHubSectionCard>
  );
}
