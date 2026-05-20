import {
  getFinanzasBranchPages,
  getInventarioBranchPages,
  getPropiedadesBranchPages,
} from '@shared/navigation/appNavResolver';
import {
  CuentasHubSection,
  DeudoresHubSection,
  InversionesHubSection,
  MonedasHubSection,
  TransaccionesHubSection,
} from '../../finanzas/hub';
import { FINANZAS_SECTION_META, FINANZAS_STATS_ENDPOINTS } from '../../finanzas/finanzasSectionMeta';
import { InquilinosHubSection, PropiedadesHubSection } from '../../propiedades/hub';
import { INVENTARIO_SECTION_META } from '../../inventario/inventarioSectionMeta';
import { INVENTARIO_STATS_ENDPOINTS } from '../../inventario/inventarioStatsEndpoints';
import { PROPIEDADES_SECTION_META } from '../../propiedades/propiedadesSectionMeta';
import { PROPIEDADES_STATS_ENDPOINTS } from '../../propiedades/propiedadesStatsEndpoints';
import {
  AutosHubSection,
  InventarioEnPropiedadesHubSection,
  InventarioSinUbicacionHubSection,
} from '../../inventario/hub';

/** Registro unificado de hubs Atta por rama. */
export const ATTA_HUB_BRANCHES = {
  finanzas: {
    branchId: 'finanzas',
    ariaLabel: 'Secciones de Finanzas',
    sectionMeta: FINANZAS_SECTION_META,
    statsEndpoints: FINANZAS_STATS_ENDPOINTS,
    hubSectionCards: {
      transacciones: TransaccionesHubSection,
      cuentas: CuentasHubSection,
      monedas: MonedasHubSection,
      inversiones: InversionesHubSection,
      deudores: DeudoresHubSection,
    },
    hubExcludePageIds: [],
    getStripPages: getFinanzasBranchPages,
  },
  propiedades: {
    branchId: 'propiedades',
    ariaLabel: 'Secciones de Propiedades',
    sectionMeta: PROPIEDADES_SECTION_META,
    statsEndpoints: PROPIEDADES_STATS_ENDPOINTS,
    hubSectionCards: {
      propiedades: PropiedadesHubSection,
      inquilinos: InquilinosHubSection,
    },
    /** Contratos se resumen dentro de Inquilinos en el hub. */
    hubExcludePageIds: ['contratos'],
    getStripPages: getPropiedadesBranchPages,
  },
  inventario: {
    branchId: 'inventario',
    ariaLabel: 'Secciones de Inventario',
    sectionMeta: INVENTARIO_SECTION_META,
    statsEndpoints: INVENTARIO_STATS_ENDPOINTS,
    hubSectionCards: {
      'inventario-en-propiedades': InventarioEnPropiedadesHubSection,
      vehiculos: AutosHubSection,
      'inventario-sin-ubicacion': InventarioSinUbicacionHubSection,
    },
    hubExcludePageIds: [],
    getStripPages: getInventarioBranchPages,
  },
};

export function getAttaHubBranchConfig(branchId) {
  return ATTA_HUB_BRANCHES[branchId] ?? null;
}
