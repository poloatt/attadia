import React from 'react';
import { useLocation } from 'react-router-dom';
import { isPathActive } from '@shared/navigation/appNavResolver';
import { AttaHubSectionCard } from '../../hub';
import TransaccionesHubSummary from '../transacciones/TransaccionesHubSummary';

const TRANSACCIONES_PATH = '/finanzas/transacciones';

/** Bloque Transacciones en el hub Finanzas. */
export default function TransaccionesHubSection() {
  const { pathname } = useLocation();
  const isActive = isPathActive(pathname, TRANSACCIONES_PATH);
  return (
    <AttaHubSectionCard
      title="Transacciones"
      iconKey="moneyBag"
      path={TRANSACCIONES_PATH}
      isActive={isActive}
    >
      <TransaccionesHubSummary />
    </AttaHubSectionCard>
  );
}
