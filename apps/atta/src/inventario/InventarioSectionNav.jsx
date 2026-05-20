import React from 'react';
import AttaBranchSectionNav from '../navigation/AttaBranchSectionNav';
import { getAttaHubBranchConfig } from '../hub/config/attaHubBranchConfig';

const config = getAttaHubBranchConfig('inventario');

/** Navegación contextual rama Inventario (hub en /propiedades/inventario). */
export default function InventarioSectionNav({ variant = 'hub' }) {
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
