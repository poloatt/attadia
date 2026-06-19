import React from 'react';
import AttaBranchSectionNav from '../navigation/AttaBranchSectionNav';
import { getAttaHubBranchConfig } from '../hub/config/attaHubBranchConfig';

const BRANCH_ID = 'inventario';

/** Navegación contextual rama Inventario (hub en /propiedades/inventario). */
export default function InventarioSectionNav({ variant = 'hub' }) {
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
