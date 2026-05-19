import { FINANZAS_HUB, getHubChipSx } from '../../finanzas/finanzasHubStyles';

/** Propiedades visibles en el hub antes de expandir (bloques más altos). */
export const BIENES_HUB_PROPIEDAD_PREVIEW_COUNT = 2;

/** Filas visibles en secciones tipo lista (inquilinos, inventario). */
export const BIENES_HUB_PREVIEW_COUNT = 3;

export const BIENES_HUB_ROW = {
  minHeight: 32,
  py: 0.2,
  px: 0.75,
  gap: 0.5,
  mb: 0.375,
};

/** Tile de ambiente (hub / detalle): chip icon-only alineado con MONEDA_TILE / FINANZAS_HUB. */
export const HABITACION_TILE = {
  height: FINANZAS_HUB.chipHeight,
  heightFull: FINANZAS_HUB.chipHeight,
  width: FINANZAS_HUB.chipHeight,
  widthFull: 54,
  symbolSize: 26,
  iconFontSize: 16,
  gap: FINANZAS_HUB.chipGap,
  px: FINANZAS_HUB.chipPx,
  py: FINANZAS_HUB.chipPy,
  radius: FINANZAS_HUB.chipRadius,
};

export function getHabitacionTileSx(options) {
  return {
    ...getHubChipSx(options),
    scrollSnapAlign: 'start',
    ...(options?.isSelectable && !options?.selected && {
      '&:hover': {
        bgcolor: 'action.selected',
      },
    }),
  };
}

/** Círculo neutro del icono (mismo lenguaje que monedaSymbolSx). */
export const habitacionIconSx = {
  width: HABITACION_TILE.symbolSize,
  height: HABITACION_TILE.symbolSize,
  borderRadius: '50%',
  bgcolor: 'background.default',
  border: '1px solid',
  borderColor: 'divider',
  color: 'text.secondary',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};
