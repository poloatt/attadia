import React from 'react';
import { getTipoPropiedadIconComponent } from '../../utils/propiedadUtils';

const TipoPropiedadIcon = ({ tipo, sx = {}, ...props }) => {
  const { IconComponent, props: defaultProps } = getTipoPropiedadIconComponent(tipo, { sx, ...props });
  
  return <IconComponent {...defaultProps} />;
};

export default TipoPropiedadIcon; 