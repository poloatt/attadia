import React from 'react';
import { useLocation } from 'react-router-dom';
import { isPathActive } from '@shared/navigation/appNavResolver';
import { AttaHubSectionCard } from '../../hub';
import TransaccionesHubSummary from '../transacciones/TransaccionesHubSummary';
import { getTransaccionesPath, resolveFinanzasBranch } from '../finanzasDeepLink';

/** Bloque Transacciones en hubs Finanzas, Propiedades e Inventario. */
export default function TransaccionesHubSection() {
  const { pathname } = useLocation();
  const branchId = resolveFinanzasBranch(pathname);
  const transaccionesPath = getTransaccionesPath(branchId);
  const isActive = isPathActive(pathname, transaccionesPath);

  return (
    <AttaHubSectionCard
      title="Transacciones"
      iconKey="moneyBag"
      path={transaccionesPath}
      isActive={isActive}
    >
      <TransaccionesHubSummary />
    </AttaHubSectionCard>
  );
}
