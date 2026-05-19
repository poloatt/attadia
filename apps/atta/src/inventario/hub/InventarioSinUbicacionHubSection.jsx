import React from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { isPathActive } from '@shared/navigation/appNavResolver';

import FinanzasHubSectionCard from '../../finanzas/FinanzasHubSectionCard';

import { INVENTARIO_HUB_PATHS, INVENTARIO_UBICACION } from './inventarioHubConstants';

import InventarioHubItemsPreview from './InventarioHubItemsPreview';

import { useInventarioHubItems } from './useInventarioHubItems';



export default function InventarioSinUbicacionHubSection() {

  const navigate = useNavigate();

  const { pathname } = useLocation();

  const isActive = isPathActive(pathname, INVENTARIO_HUB_PATHS.sinUbicacion);

  const { items, preview, rest, loading, hasMore } = useInventarioHubItems(INVENTARIO_UBICACION.SIN);



  return (

    <FinanzasHubSectionCard

      title="Sin locación"

      iconKey="inventario"

      path={INVENTARIO_HUB_PATHS.sinUbicacion}

      isActive={isActive}

    >

      <InventarioHubItemsPreview

        loading={loading}

        items={items}

        preview={preview}

        rest={rest}

        hasMore={hasMore}

        emptyLabel="Sin ítems sin ubicación"

        onRowClick={(e) => {

          e.stopPropagation();

          navigate(INVENTARIO_HUB_PATHS.sinUbicacion);

        }}

      />

    </FinanzasHubSectionCard>

  );

}

