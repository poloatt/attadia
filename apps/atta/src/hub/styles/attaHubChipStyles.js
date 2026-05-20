import {
  ATTA_HUB_CARD_BODY_MIN_HEIGHT,
  ATTA_HUB_CARD_MIN_HEIGHT,
  ATTA_HUB_SUBSECTION,
  attaSwitchSx,
  getAttaHubSubsectionSx,
  getHubCardSx,
  hubGridContainerSx,
  hubGridItemSx,
  hubHeaderActionSx,
} from './attaHubSectionStyles';

export {
  ATTA_HUB_CARD_BODY_MIN_HEIGHT,
  ATTA_HUB_CARD_MIN_HEIGHT,
  attaSwitchSx,
  getHubCardSx,
  hubGridContainerSx,
  hubGridItemSx,
  hubHeaderActionSx,
};

export const ATTA_HUB_CHIP = {
  chipHeight: 50,
  chipRadius: ATTA_HUB_SUBSECTION.borderRadius,
  chipGap: 0.625,
  chipPx: 0.875,
  chipPy: 0.5,
  monedaTileWidth: 108,
};

/** @deprecated Use ATTA_HUB_CHIP */
export const FINANZAS_HUB = ATTA_HUB_CHIP;

export const hubHeaderIconSx = {
  flexShrink: 0,
  color: 'text.primary',
};

export function getHubChipSx({ selected } = {}) {
  return {
    ...getAttaHubSubsectionSx({ selected }),
    height: ATTA_HUB_CHIP.chipHeight,
    px: ATTA_HUB_CHIP.chipPx,
    py: ATTA_HUB_CHIP.chipPy,
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minWidth: 0,
  };
}

export function getHubListRowSx({ selected } = {}) {
  return {
    ...getAttaHubSubsectionSx({ selected }),
    px: ATTA_HUB_CHIP.chipPx,
    py: ATTA_HUB_CHIP.chipPy,
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
  gap: ATTA_HUB_CHIP.chipGap,
  overflowX: 'auto',
  py: 0.125,
  scrollSnapType: 'x mandatory',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
};

export const hubMetricsRowSx = {
  display: 'flex',
  gap: ATTA_HUB_CHIP.chipGap,
  alignItems: 'stretch',
};
