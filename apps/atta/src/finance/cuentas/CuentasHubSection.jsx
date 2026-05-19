import React, { useMemo, useState } from 'react';
import { Box, ButtonBase, Collapse, Typography } from '@mui/material';
import { ExpandMoreOutlined } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { useAPI } from '@shared/hooks/useAPI';
import { isPathActive } from '@shared/navigation/appNavResolver';
import FinanzasHubSectionCard from '../../finanzas/FinanzasHubSectionCard';
import { hubExpandButtonSx } from '../../navigation/attaHubSectionStyles';
import CuentaRow, { CuentaRowSkeleton } from './CuentaRow';
import { CUENTAS_HUB_PREVIEW_COUNT, normalizeCuenta } from './cuentaConstants';
const CUENTAS_PATH = '/finanzas/cuentas';

/** Bloque compacto Cuentas en el hub Finanzas. */
export default function CuentasHubSection() {
  const { pathname } = useLocation();
  const isActive = isPathActive(pathname, CUENTAS_PATH);
  const [expanded, setExpanded] = useState(false);

  const { data, loading } = useAPI('/api/cuentas', {
    enableCache: true,
    cacheDuration: 60000,
  });

  const cuentas = useMemo(() => {
    const docs = data?.docs ?? (Array.isArray(data) ? data : []);
    return docs.map(normalizeCuenta);
  }, [data]);

  const preview = cuentas.slice(0, CUENTAS_HUB_PREVIEW_COUNT);
  const rest = cuentas.slice(CUENTAS_HUB_PREVIEW_COUNT);
  const hasMore = rest.length > 0;

  return (
    <FinanzasHubSectionCard
      title="Cuentas"
      iconKey="accountBalance"
      path={CUENTAS_PATH}
      isActive={isActive}
    >
      {loading ? (
        <>
          <CuentaRowSkeleton />
          <CuentaRowSkeleton />
        </>
      ) : cuentas.length === 0 ? (
        <Typography variant="caption" color="text.secondary" sx={{ px: 0.125 }}>
          Sin cuentas
        </Typography>
      ) : (
        <>
          {preview.map((cuenta) => (
            <CuentaRow key={cuenta.id} cuenta={cuenta} />
          ))}

          {hasMore && (
            <>
              <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Box>
                  {rest.map((cuenta) => (
                    <CuentaRow key={cuenta.id} cuenta={cuenta} />
                  ))}
                </Box>
              </Collapse>
              <ButtonBase onClick={() => setExpanded((v) => !v)} sx={hubExpandButtonSx}>
                <ExpandMoreOutlined
                  sx={{
                    fontSize: 16,
                    transition: 'transform 0.2s',
                    transform: expanded ? 'rotate(180deg)' : 'none',
                  }}
                />
                <span>{expanded ? 'Ver menos' : `Ver ${rest.length} más`}</span>
              </ButtonBase>
            </>
          )}
        </>
      )}
    </FinanzasHubSectionCard>
  );
}
