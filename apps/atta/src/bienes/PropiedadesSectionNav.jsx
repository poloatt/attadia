import React from 'react';
import { getPropiedadesBranchPages } from '@shared/navigation/appNavResolver';
import AttaBranchSectionNav from '../navigation/AttaBranchSectionNav';
import { PROPIEDADES_SECTION_META } from './propiedadesSectionMeta';
import { PROPIEDADES_STATS_ENDPOINTS } from './propiedadesStatsEndpoints';
import { InquilinosHubSection, PropiedadesHubSection } from './hub';

const PROPIEDADES_HUB_CARDS = {
  propiedades: PropiedadesHubSection,
  inquilinos: InquilinosHubSection,
};

/** Contratos se resumen dentro de Inquilinos en el hub. */
const PROPIEDADES_HUB_EXCLUDE_PAGE_IDS = ['contratos'];

/** Navegación contextual rama Propiedades. */
export default function PropiedadesSectionNav({ variant = 'hub' }) {
  return (
    <AttaBranchSectionNav
      branchId="propiedades"
      sectionMeta={PROPIEDADES_SECTION_META}
      statsEndpoints={PROPIEDADES_STATS_ENDPOINTS}
      hubSectionCards={variant === 'hub' ? PROPIEDADES_HUB_CARDS : undefined}
      hubExcludePageIds={variant === 'hub' ? PROPIEDADES_HUB_EXCLUDE_PAGE_IDS : undefined}
      stripPages={variant === 'strip' ? getPropiedadesBranchPages : undefined}
      ariaLabel="Secciones de Propiedades"
      variant={variant}
    />
  );
}
