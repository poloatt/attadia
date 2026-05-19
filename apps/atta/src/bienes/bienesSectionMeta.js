import { PROPIEDADES_SECTION_META } from './propiedadesSectionMeta';
import { INVENTARIO_SECTION_META } from './inventarioSectionMeta';

/** @deprecated Use PROPIEDADES_SECTION_META / INVENTARIO_SECTION_META */
export const BIENES_SECTION_META = {
  ...PROPIEDADES_SECTION_META,
  ...INVENTARIO_SECTION_META,
};
