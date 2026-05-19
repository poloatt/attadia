import { alpha } from '@mui/material/styles';

/** Tokens compartidos: hubs Inventario, Propiedades y Finanzas. */
export const ATTA_HUB = {
  sectionRadius: 3,
  blockGap: 1,
  headerPx: 1.75,
  headerPy: 1.25,
  bodyPx: 1.5,
  bodyPy: 1.25,
};

/** Fondo plano de tarjeta/cuerpo (misma base que Layout → background.default). */
export const attaHubSectionBg = 'background.default';

export const ATTA_HUB_CARD_BODY_MIN_HEIGHT = 132;
export const ATTA_HUB_CARD_MIN_HEIGHT = 176;

/** Base de tarjeta de sección (borde sutil, sin caja gris anidada). */
export function getHubCardSx(isActive) {
  return {
    border: '1px solid',
    borderColor: isActive ? 'primary.main' : 'divider',
    bgcolor: attaHubSectionBg,
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    minHeight: { xs: 'auto', md: ATTA_HUB_CARD_MIN_HEIGHT },
  };
}

/** Contenedor exterior redondeado (mismo look que Inventario). */
export function getAttaHubSectionCardSx(isActive) {
  return {
    ...getHubCardSx(isActive),
    borderRadius: ATTA_HUB.sectionRadius,
    backgroundImage: 'none',
    boxShadow: (theme) => (isActive ? theme.shadows[2] : theme.shadows[1]),
    overflow: 'hidden',
  };
}

export const hubHeaderActionSx = {
  px: 1,
  py: 0.75,
  display: 'block',
};

export const attaHubSectionHeaderSx = {
  ...hubHeaderActionSx,
  px: ATTA_HUB.headerPx,
  py: ATTA_HUB.headerPy,
  borderBottom: 1,
  borderColor: 'divider',
  bgcolor: (theme) =>
    alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.04 : 0.03),
};

export const attaHubSectionBodySx = {
  px: ATTA_HUB.bodyPx,
  py: ATTA_HUB.bodyPy,
  pt: 1,
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: { xs: 'auto', md: ATTA_HUB_CARD_BODY_MIN_HEIGHT },
  bgcolor: attaHubSectionBg,
  gap: ATTA_HUB.blockGap,
};

export const hubGridContainerSx = {
  alignItems: 'stretch',
};

export const hubGridItemSx = {
  display: 'flex',
  width: '100%',
};

/** Celdas de subsección (chips, métricas, tiles) dentro del cuerpo de tarjeta hub. */
export const ATTA_HUB_SUBSECTION = {
  borderRadius: 1.5,
};

/**
 * Recuadro plano con fondo de sección y borde sutil (sin paper/elevación).
 * Usar en grids de Monedas, Transacciones, Cuentas, Propiedades, Inventario, etc.
 */
export function getAttaHubSubsectionSx({ selected } = {}) {
  return {
    borderRadius: ATTA_HUB_SUBSECTION.borderRadius,
    bgcolor: selected ? 'action.selected' : attaHubSectionBg,
    border: '1px solid',
    borderColor: 'divider',
    boxShadow: 'none',
    backgroundImage: 'none',
  };
}

export const hubExpandButtonSx = {
  width: '100%',
  mt: 0.1,
  py: 0.25,
  borderRadius: 1.5,
  color: 'text.secondary',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 0.25,
  fontSize: '0.6875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
  '&:hover': { bgcolor: attaHubSectionBg },
};

/** Bloque de propiedad dentro del cuerpo de sección (sin tarjeta anidada). */
export function getPropiedadHubBlockSx({ isLast = false } = {}) {
  return {
    borderBottom: isLast ? 0 : 1,
    borderColor: 'divider',
    pb: isLast ? 0 : ATTA_HUB.blockGap,
    mb: isLast ? 0 : ATTA_HUB.blockGap,
    overflow: 'hidden',
  };
}

export const propiedadHubHeaderSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.25,
  cursor: 'pointer',
  py: 0.5,
  px: 0.125,
  borderRadius: 1.5,
  transition: 'background-color 0.15s ease',
  '&:hover': { bgcolor: attaHubSectionBg },
};

export const propiedadHubIconSx = {
  fontSize: 20,
  color: 'text.secondary',
  flexShrink: 0,
};

export const propiedadHubTitleSx = {
  fontSize: '0.875rem',
  fontWeight: 500,
  lineHeight: 1.45,
  color: 'text.primary',
  display: 'block',
};

export const propiedadHubSubtitleSx = {
  fontSize: '0.75rem',
  lineHeight: 1.35,
  color: 'text.secondary',
  display: 'block',
  mt: 0.25,
};

export function getPropiedadEstadoChipSx(estadoColor) {
  return (theme) => {
    const resolved =
      typeof estadoColor === 'string' && estadoColor.includes('.')
        ? theme.palette[estadoColor.split('.')[0]]?.[estadoColor.split('.')[1]] ||
          theme.palette.text.secondary
        : estadoColor;

    return {
      display: 'inline-flex',
      alignItems: 'center',
      flexShrink: 0,
      px: 1.25,
      py: 0.375,
      borderRadius: '16px',
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: 1.35,
      color: estadoColor,
      bgcolor: alpha(resolved, theme.palette.mode === 'dark' ? 0.16 : 0.1),
      border: 'none',
    };
  };
}

export const propiedadHubCarouselAreaSx = {
  px: 0.125,
  pt: 0.75,
};

export const propiedadHubCarouselSx = {
  py: 0.125,
};

export const propiedadHubEmptySx = {
  display: 'block',
  px: 0.125,
  py: 0.75,
  fontSize: '0.75rem',
  color: 'text.disabled',
};
