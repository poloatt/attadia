import React from 'react';
import { Box, Typography } from '@mui/material';
import { TaskFormSecondaryLine } from '../../../../foco/src/foco/taskFormUi';
import { formatFecha } from '@shared/utils/contratoUtils';
import TipoPropiedadIcon from '../TipoPropiedadIcon';
import { propiedadDetailPrimaryTextSx } from '../propiedadDetailStyles';
import { formatContratoDuration } from './inquilinoDetailUtils';

export default function InquilinoPropiedadSection({ contrato }) {
  if (!contrato?.propiedad || !contrato.fechaInicio || !contrato.fechaFin) {
    return (
      <Typography sx={{ fontSize: '0.8125rem', color: 'text.disabled', py: 0.5 }}>
        Sin propiedad asociada
      </Typography>
    );
  }

  const propiedad = contrato.propiedad;
  const label = propiedad.alias || propiedad.titulo || propiedad.nombre || 'Propiedad';

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
      <TipoPropiedadIcon
        tipo={propiedad.tipo}
        sx={{ fontSize: 20, color: 'text.secondary', mt: 0.25, flexShrink: 0 }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={propiedadDetailPrimaryTextSx}>{label}</Typography>
        <TaskFormSecondaryLine>
          {formatFecha(contrato.fechaInicio)} – {formatFecha(contrato.fechaFin)} ·{' '}
          {formatContratoDuration(contrato.fechaInicio, contrato.fechaFin)}
        </TaskFormSecondaryLine>
        {propiedad.ciudad || propiedad.direccion ? (
          <TaskFormSecondaryLine sx={{ mt: 0.25 }}>
            {[propiedad.ciudad, propiedad.direccion].filter(Boolean).join(' · ')}
          </TaskFormSecondaryLine>
        ) : null}
      </Box>
    </Box>
  );
}
