import { useEffect, useRef, useState } from 'react';

/**
 * Hook para medir dinámicamente los anchos de secciones izquierda y derecha.
 * Devuelve refs para asociar a contenedores y los anchos medidos.
 */
export function useAnchorWidths(initialLeft = 0, initialRight = 0, deps = []) {
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const [leftWidth, setLeftWidth] = useState(initialLeft);
  const [rightWidth, setRightWidth] = useState(initialRight);

  useEffect(() => {
    const measure = () => {
      if (leftRef.current) {
        const value = leftRef.current.offsetWidth || 0;
        if (value !== leftWidth) setLeftWidth(value);
      }
      if (rightRef.current) {
        const value = rightRef.current.offsetWidth || 0;
        if (value !== rightWidth) setRightWidth(value);
      }
    };

    measure();
    const timeoutId = setTimeout(measure, 0);

    const ro = new ResizeObserver(measure);
    if (leftRef.current) ro.observe(leftRef.current);
    if (rightRef.current) ro.observe(rightRef.current);

    return () => {
      clearTimeout(timeoutId);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { leftWidthRef: leftRef, rightWidthRef: rightRef, leftWidth, rightWidth };
}


