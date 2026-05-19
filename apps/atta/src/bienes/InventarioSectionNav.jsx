import React from 'react';

import { getInventarioBranchPages } from '@shared/navigation/appNavResolver';

import AttaBranchSectionNav from '../navigation/AttaBranchSectionNav';

import { INVENTARIO_SECTION_META } from './inventarioSectionMeta';

import { INVENTARIO_STATS_ENDPOINTS } from './inventarioStatsEndpoints';

import {

  AutosHubSection,

  InventarioEnPropiedadesHubSection,

  InventarioSinUbicacionHubSection,

} from '../inventario/hub';



const INVENTARIO_HUB_CARDS = {

  'inventario-en-propiedades': InventarioEnPropiedadesHubSection,

  vehiculos: AutosHubSection,

  'inventario-sin-ubicacion': InventarioSinUbicacionHubSection,

};



/** Navegación contextual rama Inventario (hub en /propiedades/inventario). */

export default function InventarioSectionNav({ variant = 'hub' }) {

  return (

    <AttaBranchSectionNav

      branchId="inventario"

      sectionMeta={INVENTARIO_SECTION_META}

      statsEndpoints={INVENTARIO_STATS_ENDPOINTS}

      hubSectionCards={variant === 'hub' ? INVENTARIO_HUB_CARDS : undefined}

      stripPages={variant === 'strip' ? getInventarioBranchPages : undefined}

      ariaLabel="Secciones de Inventario"

      variant={variant}

    />

  );

}

