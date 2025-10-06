// Utilidades de alineación compartidas entre Header y Toolbar

/**
 * Calcula estilos para centrar una sección principal considerando sidebar y secciones laterales.
 * @param {Object} params
 * @param {boolean} params.isMobileOrTablet
 * @param {number} params.mainMargin - margen principal calculado (por sidebar)
 * @param {number} params.leftSectionWidth - ancho ocupado por sección izquierda (opcional)
 * @param {number} params.rightSectionWidth - ancho ocupado por sección derecha (opcional)
 */
export function getCenteredSectionSx({ isMobileOrTablet, mainMargin, leftSectionWidth = 0, rightSectionWidth = 0 }) {
  return {
    position: 'absolute',
    left: isMobileOrTablet ? 0 : `${mainMargin}px`,
    right: 0,
    top: 0,
    pl: isMobileOrTablet ? `${leftSectionWidth}px` : 0,
    pr: `${rightSectionWidth}px`
  };
}


