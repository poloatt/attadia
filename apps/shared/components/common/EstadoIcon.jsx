import React from 'react';
import { getStatusIconComponent, getEstadoColor } from './StatusSystem';

const EstadoIcon = ({ estado, tipo = 'PROPIEDAD', sx = {}, ...props }) => {
  const color = getEstadoColor(estado, tipo);
  const iconElement = getStatusIconComponent(estado, tipo);
  
  // Verificar que iconElement sea un elemento React válido
  if (!React.isValidElement(iconElement)) {
    console.warn(`EstadoIcon: iconElement no es válido para estado: ${estado}, tipo: ${tipo}`, iconElement);
    return null;
  }
  
  // Clonar el elemento y aplicar el color y props personalizados
  return React.cloneElement(iconElement, { sx: { color, ...sx }, ...props });
};

export default EstadoIcon; 