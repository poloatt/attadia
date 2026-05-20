import React from 'react';
import AttaBranchSectionNav from '../navigation/AttaBranchSectionNav';
import { getAttaHubBranchConfig } from '../hub/config/attaHubBranchConfig';

const config = getAttaHubBranchConfig('finanzas');

/** Navegación contextual Finanzas. */
export default function FinanzasSectionNav({ variant = 'hub' }) {
  return (
    <AttaBranchSectionNav
      branchId={config.branchId}
      sectionMeta={config.sectionMeta}
      statsEndpoints={config.statsEndpoints}
      hubSectionCards={variant === 'hub' ? config.hubSectionCards : undefined}
      hubExcludePageIds={variant === 'hub' ? config.hubExcludePageIds : undefined}
      stripPages={variant === 'strip' ? config.getStripPages : undefined}
      ariaLabel={config.ariaLabel}
      variant={variant}
    />
  );
}
