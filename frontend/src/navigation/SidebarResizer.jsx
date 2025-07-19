import React, { useState, useCallback, useEffect } from 'react';
import { Box } from '@mui/material';
import { useTheme, useMediaQuery } from '@mui/material';

const SidebarResizer = ({ onResize, isOpen, minWidth = 200, maxWidth = 400, defaultWidth = 280 }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
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
    
    // Llamar a la función de callback con el nuevo ancho
    onResize(newWidth);
  }, [isResizing, startX, startWidth, minWidth, maxWidth, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Agregar event listeners globales
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Cambiar el cursor del body
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

  // Solo mostrar en desktop y cuando la sidebar esté abierta
  if (!isDesktop || !isOpen) return null;

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