import React from 'react';
import { getTipoPropiedadIconComponent } from '../../utils/propiedadUtils';

const TipoPropiedadIcon = ({ tipo, sx = {}, ...props }) => {
  const { IconComponent, props: defaultProps } = getTipoPropiedadIconComponent(tipo, { sx, ...props });
  
  if (!IconComponent || typeof IconComponent !== 'function') {
    console.warn(`TipoPropiedadIcon: IconComponent no es válido para tipo: ${tipo}`, IconComponent);
    return null;
  }
  
  return <IconComponent {...defaultProps} />;
};

export default TipoPropiedadIcon; 