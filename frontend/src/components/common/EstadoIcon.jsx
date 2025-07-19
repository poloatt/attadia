import React from 'react';
import { getStatusIconComponent } from './StatusSystem';

const EstadoIcon = ({ estado, tipo = 'PROPIEDAD', sx = {}, ...props }) => {
  const iconElement = getStatusIconComponent(estado, tipo);
  
  // Clonar el elemento y aplicar las props personalizadas
  return React.cloneElement(iconElement, { sx, ...props });
};

export default EstadoIcon; 