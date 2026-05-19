import React from 'react';
import { getFinanzasBranchPages } from '@shared/navigation/appNavResolver';
import AttaBranchSectionNav from '../navigation/AttaBranchSectionNav';
import { CuentasHubSection } from '../finance/cuentas';
import { MonedasHubSection } from '../finance/monedas';
import { TransaccionesHubSection } from '../finance/transacciones';
import DeudoresHubSection from './DeudoresHubSection';
import InversionesHubSection from './InversionesHubSection';
import { FINANZAS_SECTION_META, FINANZAS_STATS_ENDPOINTS } from './finanzasSectionMeta';

const FINANZAS_HUB_CARDS = {
  transacciones: TransaccionesHubSection,
  cuentas: CuentasHubSection,
  monedas: MonedasHubSection,
  inversiones: InversionesHubSection,
  deudores: DeudoresHubSection,
};

/** Navegación contextual Finanzas (mismo patrón que Propiedades). */
export default function FinanzasSectionNav({ variant = 'hub' }) {
  return (
    <AttaBranchSectionNav
      branchId="finanzas"
      sectionMeta={FINANZAS_SECTION_META}
      statsEndpoints={FINANZAS_STATS_ENDPOINTS}
      hubSectionCards={variant === 'hub' ? FINANZAS_HUB_CARDS : undefined}
      stripPages={variant === 'strip' ? getFinanzasBranchPages : undefined}
      ariaLabel="Secciones de Finanzas"
      variant={variant}
    />
  );
}
