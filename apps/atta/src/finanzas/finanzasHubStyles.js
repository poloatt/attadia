import {
  ATTA_HUB_CARD_BODY_MIN_HEIGHT,
  ATTA_HUB_CARD_MIN_HEIGHT,
  ATTA_HUB_SUBSECTION,
  getAttaHubSubsectionSx,
  getHubCardSx,
  hubGridContainerSx,
  hubGridItemSx,
  hubHeaderActionSx,
} from '../navigation/attaHubSectionStyles';

/** Estilos de chips/métricas del hub Finanzas + reexport del shell compartido Atta. */
export {
  ATTA_HUB_CARD_BODY_MIN_HEIGHT as FINANZAS_HUB_CARD_BODY_MIN_HEIGHT,
  ATTA_HUB_CARD_MIN_HEIGHT as FINANZAS_HUB_CARD_MIN_HEIGHT,
  getHubCardSx,
  hubGridContainerSx,
  hubGridItemSx,
  hubHeaderActionSx,
};

export const FINANZAS_HUB = {
  chipHeight: 50,
  chipRadius: ATTA_HUB_SUBSECTION.borderRadius,
  chipGap: 0.625,
  chipPx: 0.875,
  chipPy: 0.5,
  monedaTileWidth: 108,
};

export const hubBodySx = {
  px: 0.75,
  pb: 0.75,
  pt: 0.25,
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: { xs: 'auto', md: ATTA_HUB_CARD_BODY_MIN_HEIGHT },
};

export const hubHeaderIconSx = {
  flexShrink: 0,
  color: 'text.primary',
};

/** Chips/métricas en carrusel (mismo recuadro que subsecciones Atta). */
export function getHubChipSx({ selected } = {}) {
  return {
    ...getAttaHubSubsectionSx({ selected }),
    height: FINANZAS_HUB.chipHeight,
    px: FINANZAS_HUB.chipPx,
    py: FINANZAS_HUB.chipPy,
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minWidth: 0,
  };
}

/** Filas de lista en el cuerpo plano de la sección. */
export function getHubListRowSx({ selected } = {}) {
  return {
    ...getAttaHubSubsectionSx({ selected }),
    px: FINANZAS_HUB.chipPx,
    py: FINANZAS_HUB.chipPy,
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minWidth: 0,
  };
}

export const hubLabelSx = {
  fontWeight: 600,
  lineHeight: 1.15,
  fontSize: '0.6875rem',
  letterSpacing: '0.02em',
  color: 'text.secondary',
  textTransform: 'uppercase',
};

export const hubValueSx = {
  fontWeight: 700,
  fontSize: '0.8125rem',
  lineHeight: 1.2,
  mt: 0.125,
};

export const hubPeriodSx = {
  display: 'block',
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '0.02em',
  color: 'text.secondary',
  textTransform: 'uppercase',
  mb: 0.375,
  px: 0.125,
};

export const hubCarouselSx = {
  display: 'flex',
  gap: FINANZAS_HUB.chipGap,
  overflowX: 'auto',
  py: 0.125,
  scrollSnapType: 'x mandatory',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
};

export const hubMetricsRowSx = {
  display: 'flex',
  gap: FINANZAS_HUB.chipGap,
  alignItems: 'stretch',
};
