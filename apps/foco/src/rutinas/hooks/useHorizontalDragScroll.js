import { useCallback, useRef, useState } from 'react';

/**
 * Hook simple para "drag to scroll" horizontal usando Pointer Events.
 * - Evita clicks accidentales luego de un drag (moved flag)
 * - Oculta detalles de implementación (refs/handlers) del componente
 */
export default function useHorizontalDragScroll({
  enabled = true,
  thresholdPx = 6,
} = {}) {
  const scrollRef = useRef(null);
  const dragRef = useRef({ isDown: false, startX: 0, startScrollLeft: 0, moved: false });
  const [isDragging, setIsDragging] = useState(false);

  const onPointerDownCapture = useCallback((e) => {
    if (!enabled) return;
    const el = scrollRef.current;
    if (!el) return;

    dragRef.current.isDown = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startScrollLeft = el.scrollLeft;
    dragRef.current.moved = false;

    try {
      el.setPointerCapture?.(e.pointerId);
    } catch {
      // noop
    }

    setIsDragging(true);
  }, [enabled]);

  const onPointerMove = useCallback((e) => {
    if (!enabled) return;
    const el = scrollRef.current;
    if (!el) return;
    if (!dragRef.current.isDown) return;

    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > thresholdPx) dragRef.current.moved = true;
    if (dragRef.current.moved) e.preventDefault?.();
    el.scrollLeft = dragRef.current.startScrollLeft - dx;
  }, [enabled, thresholdPx]);

  const endDrag = useCallback(() => {
    if (!enabled) return;
    dragRef.current.isDown = false;
    setIsDragging(false);

    // Importante: mantener moved=true hasta el próximo tick para bloquear clicks post-drag.
    if (dragRef.current.moved) {
      setTimeout(() => {
        dragRef.current.moved = false;
      }, 0);
    } else {
      dragRef.current.moved = false;
    }
  }, [enabled]);

  return {
    scrollRef,
    dragRef,
    isDragging,
    bind: {
      onPointerDownCapture,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
}


