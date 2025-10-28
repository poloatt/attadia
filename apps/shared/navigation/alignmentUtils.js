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
  // En desktop, el área centrada debe comenzar en el borde del main
  // más lo que ocupa su sección izquierda; a la derecha debe descontar
  // el ancho ocupado por la sección derecha.
  if (!isMobileOrTablet) {
    return {
      position: 'absolute',
      left: `${mainMargin + (leftSectionWidth || 0)}px`,
      right: `${rightSectionWidth || 0}px`,
      top: 0
    };
  }
  // En mobile/tablet, ocupar todo el ancho y compensar con paddings
  return {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    pl: `${leftSectionWidth || 0}px`,
    pr: `${rightSectionWidth || 0}px`
  };
}


