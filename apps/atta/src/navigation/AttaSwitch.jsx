import React from 'react';
import { Switch } from '@mui/material';
import { attaSwitchSx } from '../hub/styles/attaPropiedadHubStyles';

/**
 * Switch compacto con estética hub Atta (Google Tasks–like).
 * Reutilizable en filas de lista y tiles de finanzas.
 */
function AttaSwitch({ sx, ...props }) {
  return (
    <Switch
      color="primary"
      disableRipple
      sx={[attaSwitchSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      {...props}
    />
  );
}

export default React.memo(AttaSwitch);
export { attaSwitchSx };
