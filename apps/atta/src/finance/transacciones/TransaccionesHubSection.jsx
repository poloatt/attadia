import React from 'react';
import { useLocation } from 'react-router-dom';
import { isPathActive } from '@shared/navigation/appNavResolver';
import FinanzasHubSectionCard from '../../finanzas/FinanzasHubSectionCard';
import TransaccionesHubSummary from './TransaccionesHubSummary';

const TRANSACCIONES_PATH = '/finanzas/transacciones';

/** Bloque Transacciones en el hub Finanzas. */
export default function TransaccionesHubSection() {
  const { pathname } = useLocation();
  const isActive = isPathActive(pathname, TRANSACCIONES_PATH);
  return (
    <FinanzasHubSectionCard
      title="Transacciones"
      iconKey="moneyBag"
      path={TRANSACCIONES_PATH}
      isActive={isActive}
    >
      <TransaccionesHubSummary />
    </FinanzasHubSectionCard>
  );
}
