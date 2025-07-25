import React, { useState, useCallback, useEffect } from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material';
import { useSidebar } from '../context/SidebarContext';

/**
 * SidebarResizer modular y desacoplado.
 * Props:
 * - onResize: función callback para cambiar el ancho (requerido)
 * - minWidth, maxWidth, defaultWidth: límites de ancho (opcional)
 * - isDesktop, isOpen, isPinned: opcionales, si no se pasan usa el contexto Sidebar
 *
 * Así puede ser usado en cualquier layout/sidebar, y la lógica de visibilidad queda centralizada.
 */
const SidebarResizer = ({
  onResize,
  minWidth = 200,
  maxWidth = 400,
  defaultWidth = 280,
  isDesktop: propIsDesktop,
  isOpen: propIsOpen,
  isPinned: propIsPinned
}) => {
  const theme = useTheme();
  // Permite usar props o contexto SOLO si la prop no está definida
  const context = useSidebar();
  const isDesktop = propIsDesktop !== undefined ? propIsDesktop : context?.isDesktop;
  const isOpen = propIsOpen !== undefined ? propIsOpen : context?.isOpen;
  const isPinned = propIsPinned !== undefined ? propIsPinned : context?.isPinned;
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(defaultWidth);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(defaultWidth);
  }, [defaultWidth]);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    const deltaX = e.clientX - startX;
    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));
    onResize(newWidth);
  }, [isResizing, startX, startWidth, minWidth, maxWidth, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Solo mostrar si el padre lo decide (mejor práctica modular)
  if (!isDesktop || !isOpen || isPinned) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        right: -2,
        top: 0,
        bottom: 0,
        width: 4,
        cursor: 'col-resize',
        zIndex: 1300,
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 2,
          height: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          borderRadius: 1,
          opacity: 0,
          transition: 'opacity 0.2s',
        },
        '&:hover::before': {
          opacity: 1,
        },
        ...(isResizing && {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          '&::before': {
            opacity: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
          },
        }),
      }}
      onMouseDown={handleMouseDown}
    />
  );
};

export default SidebarResizer; 