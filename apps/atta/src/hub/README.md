# Atta Hub Kit

Punto único de verdad para hubs de **Finanzas**, **Propiedades** e **Inventario**.

## Importar

```js
import {
  AttaHubSectionCard,
  HubItemsPreview,
  HubRow,
  useHubPreviewSlice,
  getHubChipSx,
} from '@/hub';
```

Estilos de tarjeta/chip: `@/hub/styles/attaHubSectionStyles` o `@/hub/styles/attaHubChipStyles`. **No** usar shims en `navigation/` ni re-exports deprecados en dominio.

## Checklist PR3 (sin shims)

- [x] `finance/` y `bienes/` eliminados; dominios en `finanzas/`, `propiedades/`, `inventario/`
- [x] Tarjeta hub: `AttaHubSectionCard` desde `@/hub` (no `FinanzasHubSectionCard`)
- [x] Estilos hub: `hub/styles/*` (no `finanzasHubStyles`, `propiedadesHubStyles`, `navigation/attaHubSectionStyles`)
- [x] Filas hub: `HubRow` desde `@/hub` (no `BienesHubRow`)
- [x] Nav Atta: `getAttaBranchPropiedades` / `getAttaPropiedadesNav` (no aliases `bienes`)

## Nueva sección hub

1. **Menú:** ítem en `apps/shared/navigation/menuStructure.js` bajo la rama (`finanzas` | `propiedades` | `inventario`).
2. **Meta (opcional):** entrada en `*SectionMeta.js` de la rama.
3. **Componente:** `XxxHubSection.jsx` en dominio (`finanzas/hub/`, `propiedades/hub/`, `inventario/hub/`):

```jsx
export default function XxxHubSection() {
  const { items, loading } = useXxxData();
  return (
    <AttaHubSectionCard title="..." iconKey="..." path="..." isActive={...}>
      <HubItemsPreview loading={loading} items={items} emptyLabel="Sin datos" />
    </AttaHubSectionCard>
  );
}
```

4. **Registro:** `page.id: XxxHubSection` en `hub/config/attaHubBranchConfig.js` → `hubSectionCards`.
5. **Toolbar:** si la navegación es solo in-page, añadir `page.id` a `*_TOOLBAR_EXCLUDE_PAGE_IDS` en `appNavResolver.js`.
6. **Stats (opcional):** endpoint en `*StatsEndpoints.js` solo para tarjetas genéricas sin componente custom.

## Widgets compartidos entre ramas

Algunos componentes viven en un dominio y se reutilizan en hubs de otro:

| Widget | Origen | Consumidores típicos |
|--------|--------|----------------------|
| `MonedasCarousel`, `MonedaTile` | `finanzas/monedas` | `finanzas/hub/MonedasHubSection`, `propiedades/hub/*`, `HabitacionesCarouselSection` |

Importar desde el barrel del dominio, p. ej. `import { MonedasCarousel } from '../../finanzas/monedas'`.

## Variantes de layout

| Variante | Primitive |
|----------|-----------|
| Lista con expand | `HubItemsPreview` + `useHubPreviewSlice` |
| Carrusel | `hubCarouselSx` + tiles de dominio |
| Métricas | `HubMetricsRow` + `MetricChip` |
| Custom | cuerpo libre dentro de `AttaHubSectionCard` |

No editar estilos de tarjeta en dominio salvo cambio global en `hub/styles/`.
