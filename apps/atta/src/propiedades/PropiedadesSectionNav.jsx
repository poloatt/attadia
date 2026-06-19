import React from 'react';
import AttaBranchSectionNav from '../navigation/AttaBranchSectionNav';
import { getAttaHubBranchConfig } from '../hub/config/attaHubBranchConfig';

const BRANCH_ID = 'propiedades';

/** Navegación contextual rama Propiedades. */
export default function PropiedadesSectionNav({ variant = 'hub' }) {
  const config = getAttaHubBranchConfig(BRANCH_ID);
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
