import React from 'react';
import { Box, Chip, Stack } from '@mui/material';
import { TareaFormSectionLabel, tareaFormChipSx } from '@shared/components/forms/tareaFormUi';

export default function TareaFormAttachmentsSection({ archivos = [], onRemove }) {
  if (!archivos.length) return null;

  return (
    <Box sx={{ py: 1.5 }}>
      <TareaFormSectionLabel>Archivos adjuntos</TareaFormSectionLabel>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {archivos.map((archivo, index) => (
          <Chip
            key={`${archivo.nombre}-${index}`}
            label={archivo.nombre}
            onDelete={() => onRemove?.(index)}
            size="small"
            sx={tareaFormChipSx}
          />
        ))}
      </Stack>
    </Box>
  );
}
