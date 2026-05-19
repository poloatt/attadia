import React from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { isPathActive } from '@shared/navigation/appNavResolver';

import FinanzasHubSectionCard from '../../finanzas/FinanzasHubSectionCard';

import { INVENTARIO_HUB_PATHS, INVENTARIO_UBICACION } from './inventarioHubConstants';

import InventarioHubItemsPreview from './InventarioHubItemsPreview';

import { useInventarioHubItems } from './useInventarioHubItems';



export default function InventarioEnPropiedadesHubSection() {

  const navigate = useNavigate();

  const { pathname } = useLocation();

  const isActive = isPathActive(pathname, INVENTARIO_HUB_PATHS.enPropiedades);

  const { items, preview, rest, loading, hasMore } = useInventarioHubItems(INVENTARIO_UBICACION.PROPIEDAD);



  return (

    <FinanzasHubSectionCard

      title="En propiedades"

      iconKey="apartment"

      path={INVENTARIO_HUB_PATHS.enPropiedades}

      isActive={isActive}

    >

      <InventarioHubItemsPreview

        loading={loading}

        items={items}

        preview={preview}

        rest={rest}

        hasMore={hasMore}

        emptyLabel="Sin ítems en propiedades"

        onRowClick={(e) => {

          e.stopPropagation();

          navigate(INVENTARIO_HUB_PATHS.enPropiedades);

        }}

      />

    </FinanzasHubSectionCard>

  );

}

