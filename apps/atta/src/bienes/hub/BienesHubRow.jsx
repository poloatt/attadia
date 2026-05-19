import React from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import { getHubListRowSx, hubLabelSx, hubValueSx } from '../../finanzas/finanzasHubStyles';
import { getAttaHubSubsectionSx } from '../../navigation/attaHubSectionStyles';
import { BIENES_HUB_ROW } from './bienesHubConstants';

export function BienesHubRowSkeleton() {
  return (
    <Skeleton
      variant="rounded"
      height={BIENES_HUB_ROW.minHeight}
      animation="wave"
      sx={{
        ...getAttaHubSubsectionSx(),
        mb: BIENES_HUB_ROW.mb,
        minHeight: BIENES_HUB_ROW.minHeight,
      }}
    />
  );
}

/** Fila compacta reutilizable en tarjetas del hub Bienes. */
export default function BienesHubRow({
  icon = null,
  primary,
  secondary,
  trailing,
  trailingColor = 'text.secondary',
  onClick,
}) {
  const content = (
    <Box
      sx={{
        ...getHubListRowSx(),
        height: 'auto',
        minHeight: BIENES_HUB_ROW.minHeight,
        py: BIENES_HUB_ROW.py,
        px: BIENES_HUB_ROW.px,
        flexDirection: 'row',
        alignItems: 'center',
        gap: BIENES_HUB_ROW.gap,
        mb: BIENES_HUB_ROW.mb,
        cursor: onClick ? 'pointer' : 'default',
        '&:last-child': { mb: 0 },
        ...(onClick
          ? {
              '&:hover': { bgcolor: 'action.selected' },
            }
          : {}),
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
    >
      {icon ? <Box sx={{ display: 'flex', flexShrink: 0 }}>{icon}</Box> : null}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" noWrap sx={{ ...hubLabelSx, textTransform: 'none', display: 'block' }}>
          {primary}
        </Typography>
        {secondary ? (
          typeof secondary === 'string' ? (
            <Typography variant="caption" noWrap color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
              {secondary}
            </Typography>
          ) : (
            <Box sx={{ display: 'block', lineHeight: 1.2, mt: 0.125 }}>{secondary}</Box>
          )
        ) : null}
      </Box>
      {trailing != null && trailing !== '' ? (
        <Typography variant="caption" noWrap sx={{ ...hubValueSx, color: trailingColor, flexShrink: 0 }}>
          {trailing}
        </Typography>
      ) : null}
    </Box>
  );

  return content;
}
