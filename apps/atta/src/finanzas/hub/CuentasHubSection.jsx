import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAPI } from '@shared/hooks/useAPI';
import { isPathActive } from '@shared/navigation/appNavResolver';
import { AttaHubSectionCard, HubItemsPreview } from '../../hub';
import CuentaRow from '../cuentas/CuentaRow';
import { CUENTAS_HUB_PREVIEW_COUNT, normalizeCuenta } from '../cuentas/cuentaConstants';

const CUENTAS_PATH = '/finanzas/cuentas';

/** Bloque compacto Cuentas en el hub Finanzas. */
export default function CuentasHubSection() {
  const { pathname } = useLocation();
  const isActive = isPathActive(pathname, CUENTAS_PATH);

  const { data, loading } = useAPI('/api/cuentas', {
    enableCache: true,
    cacheDuration: 60000,
  });

  const cuentas = useMemo(() => {
    const docs = data?.docs ?? (Array.isArray(data) ? data : []);
    return docs.map(normalizeCuenta);
  }, [data]);

  return (
    <AttaHubSectionCard
      title="Cuentas"
      iconKey="accountBalance"
      path={CUENTAS_PATH}
      isActive={isActive}
    >
      <HubItemsPreview
        loading={loading}
        items={cuentas}
        previewCount={CUENTAS_HUB_PREVIEW_COUNT}
        emptyLabel="Sin cuentas"
        renderRow={(cuenta) => <CuentaRow key={cuenta.id} cuenta={cuenta} />}
      />
    </AttaHubSectionCard>
  );
}
