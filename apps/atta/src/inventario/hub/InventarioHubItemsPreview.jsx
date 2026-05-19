import React, { useState } from 'react';
import { Box, ButtonBase, Collapse, Typography } from '@mui/material';
import { ExpandMoreOutlined, Inventory2Outlined } from '@mui/icons-material';
import BienesHubRow, { BienesHubRowSkeleton } from '../../bienes/hub/BienesHubRow';
import { hubExpandButtonSx } from '../../navigation/attaHubSectionStyles';
import { getInventarioRowSecondary } from './inventarioHubUtils';

export default function InventarioHubItemsPreview({
  loading,
  items,
  preview,
  rest,
  hasMore,
  emptyLabel = 'Sin ítems',
  onRowClick,
}) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <>
        <BienesHubRowSkeleton />
        <BienesHubRowSkeleton />
      </>
    );
  }

  if (items.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary" sx={{ px: 0.125 }}>
        {emptyLabel}
      </Typography>
    );
  }

  const renderRow = (item) => (
    <BienesHubRow
      key={item.id}
      icon={<Inventory2Outlined sx={{ fontSize: 16, color: 'text.secondary' }} />}
      primary={item.nombre || 'Sin nombre'}
      secondary={getInventarioRowSecondary(item)}
      trailing={item.cantidad != null ? `× ${item.cantidad}` : ''}
      onClick={onRowClick ? (e) => onRowClick(e, item) : undefined}
    />
  );

  return (
    <>
      {preview.map(renderRow)}
      {hasMore && (
        <>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box>{rest.map(renderRow)}</Box>
          </Collapse>
          <ButtonBase onClick={() => setExpanded((v) => !v)} sx={hubExpandButtonSx}>
            <ExpandMoreOutlined
              sx={{
                fontSize: 16,
                transition: 'transform 0.2s',
                transform: expanded ? 'rotate(180deg)' : 'none',
              }}
            />
            <span>{expanded ? 'Ver menos' : `Ver ${rest.length} más`}</span>
          </ButtonBase>
        </>
      )}
    </>
  );
}
