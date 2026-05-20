import React from 'react';
import AttaBranchSectionNav from '../navigation/AttaBranchSectionNav';
import { getAttaHubBranchConfig } from '../hub/config/attaHubBranchConfig';

const config = getAttaHubBranchConfig('propiedades');

/** Navegación contextual rama Propiedades. */
export default function PropiedadesSectionNav({ variant = 'hub' }) {
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
