import React from 'react';
import { getTipoPropiedadIconComponent } from '../../utils/propiedadUtils';

const TipoPropiedadIcon = ({ tipo, sx = {}, ...props }) => {
  // Validar que tipo sea un string válido
  if (!tipo || typeof tipo !== 'string') {
    console.warn(`TipoPropiedadIcon: tipo inválido recibido:`, tipo);
    return null;
  }

  try {
    const { IconComponent, props: defaultProps } = getTipoPropiedadIconComponent(tipo, { sx, ...props });
    
    // Validación más robusta del IconComponent
    if (!IconComponent || typeof IconComponent !== 'function' || !IconComponent.$$typeof) {
      console.warn(`TipoPropiedadIcon: IconComponent no es válido para tipo: ${tipo}`, IconComponent);
      return null;
    }
    
    return <IconComponent {...defaultProps} />;
  } catch (error) {
    console.error(`TipoPropiedadIcon: Error al renderizar icono para tipo: ${tipo}`, error);
    return null;
  }
};

export default TipoPropiedadIcon; 